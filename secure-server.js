import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: '10mb',
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 30,
  API_KEY_LENGTH: 32,
  SECRET_KEY_LENGTH: 64,
  NONCE_LENGTH: 16,
  TIMESTAMP_TOLERANCE: 300000, // 5 minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// In-memory store for rate limiting and security monitoring
const securityStore = {
  rateLimits: new Map(),
  nonces: new Set(),
  incidents: [],
  apiKeys: new Set(),
};

// Initialize security keys
const API_KEY = process.env.SECURE_API_KEY || crypto.randomBytes(SECURITY_CONFIG.API_KEY_LENGTH).toString('hex');
const SECRET_KEY = process.env.SECURE_SECRET_KEY || crypto.randomBytes(SECURITY_CONFIG.SECRET_KEY_LENGTH).toString('hex');

// Add API key to store
securityStore.apiKeys.add(API_KEY);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://n8n.srv970139.hstgr.cloud"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'X-Request-ID', 'X-Timestamp', 'X-Signature'],
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for'] || 'unknown';
    return ip + ':' + (req.headers['x-api-key'] || 'anonymous');
  },
  handler: (req, res) => {
    logSecurityIncident({
      type: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      timestamp: Date.now()
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS / 1000)
    });
  }
});

app.use('/api/', limiter);

// Body parser middleware with size limit
app.use(express.json({ 
  limit: SECURITY_CONFIG.MAX_REQUEST_SIZE,
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

// Security utilities
const generateNonce = () => crypto.randomBytes(SECURITY_CONFIG.NONCE_LENGTH).toString('hex');

const generateSignature = (payload, secret) => {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
};

const verifySignature = (payload, signature, secret) => {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
};

const validateTimestamp = (timestamp) => {
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  return Math.abs(now - requestTime) <= SECURITY_CONFIG.TIMESTAMP_TOLERANCE;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string' || input === undefined || input === null) return '';
  
  // Remove dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /@import/gi,
  ];
  
  let sanitized = input;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\*\/|\/\*)/gi,
    /(\bOR\b.*=.*\bOR\b)/gi,
    /(\bAND\b.*=.*\bAND\b)/gi,
  ];
  
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // HTML entity encoding
  sanitized = sanitized
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
};

const validateEmailRequest = (data) => {
  const errors = [];
  const requiredFields = ['recipientName', 'emailPurpose', 'tone', 'keyPoints', 'emailLength'];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!data[field] || typeof data[field] !== 'string') {
      errors.push(`${field} is required and must be a string`);
    }
  });
  
  // Validate field lengths and patterns
  if (data.recipientName && data.recipientName.length > 100) {
    errors.push('Recipient name too long (max 100 characters)');
  }
  
  if (data.keyPoints && data.keyPoints.length > 5000) {
    errors.push('Key points too long (max 5000 characters)');
  }
  
  if (data.additionalContext && data.additionalContext.length > 2000) {
    errors.push('Additional context too long (max 2000 characters)');
  }
  
  // Validate email length
  const validLengths = ['short', 'medium', 'long'];
  if (data.emailLength && !validLengths.includes(data.emailLength)) {
    errors.push('Invalid email length');
  }
  
  return { isValid: errors.length === 0, errors };
};

const validatePromptRequest = (data) => {
  const errors = [];
  
  // Check for either prompt field (for regular prompts) or taskDescription field (for structured prompts)
  const isRegularPrompt = data.prompt !== undefined;
  const isStructuredPrompt = data.taskDescription !== undefined;
  
  if (!isRegularPrompt && !isStructuredPrompt) {
    errors.push('Either prompt or taskDescription is required');
  }
  
  // Validate regular prompt
  if (isRegularPrompt) {
    if (typeof data.prompt !== 'string') {
      errors.push('Prompt must be a string');
    }
    
    if (data.prompt && data.prompt.length > 10000) {
      errors.push('Prompt too long (max 10000 characters)');
    }
  }
  
  // Validate structured prompt
  if (isStructuredPrompt) {
    if (typeof data.taskDescription !== 'string') {
      errors.push('Task description must be a string');
    }
    
    if (data.taskDescription && data.taskDescription.length > 5000) {
      errors.push('Task description too long (max 5000 characters)');
    }
  }
  
  // Validate optional fields
  if (data.context && typeof data.context !== 'string') {
    errors.push('Context must be a string');
  }
  
  if (data.context && data.context.length > 5000) {
    errors.push('Context too long (max 5000 characters)');
  }
  
  // Validate model parameters
  if (data.model && typeof data.model !== 'string') {
    errors.push('Model must be a string');
  }
  
  if (data.temperature && (typeof data.temperature !== 'number' || data.temperature < 0 || data.temperature > 2)) {
    errors.push('Temperature must be a number between 0 and 2');
  }
  
  if (data.maxTokens && (typeof data.maxTokens !== 'number' || data.maxTokens < 1 || data.maxTokens > 4000)) {
    errors.push('Max tokens must be a number between 1 and 4000');
  }
  
  // Validate other structured prompt fields
  if (data.useCaseCategory && typeof data.useCaseCategory !== 'string') {
    errors.push('Use case category must be a string');
  }
  
  if (data.desiredOutputFormat && typeof data.desiredOutputFormat !== 'string') {
    errors.push('Desired output format must be a string');
  }
  
  if (data.targetModel && typeof data.targetModel !== 'string') {
    errors.push('Target model must be a string');
  }
  
  if (data.contextBackground && typeof data.contextBackground !== 'string') {
    errors.push('Context background must be a string');
  }
  
  if (data.industryDomain && typeof data.industryDomain !== 'string') {
    errors.push('Industry domain must be a string');
  }
  
  return { isValid: errors.length === 0, errors };
};

const logSecurityIncident = (incident) => {
  const incidentWithId = {
    ...incident,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
  
  securityStore.incidents.push(incidentWithId);
  
  // Keep only last 1000 incidents
  if (securityStore.incidents.length > 1000) {
    securityStore.incidents = securityStore.incidents.slice(-1000);
  }
  
  console.warn('🚨 Security Incident:', incidentWithId);
  
  // In production, send to security monitoring service
  // await sendToSecurityMonitoring(incidentWithId);
};

// Authentication middleware
const authenticateRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    logSecurityIncident({
      type: 'MISSING_API_KEY',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (!securityStore.apiKeys.has(apiKey)) {
    logSecurityIncident({
      type: 'INVALID_API_KEY',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      apiKey: apiKey.substring(0, 8) + '...'
    });
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.apiKey = apiKey;
  next();
};

// Signature verification middleware
const verifyRequestSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const nonce = req.body?.nonce;
  
  if (!signature || !timestamp || !nonce) {
    logSecurityIncident({
      type: 'MISSING_SECURITY_HEADERS',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      missingHeaders: {
        signature: !signature,
        timestamp: !timestamp,
        nonce: !nonce
      }
    });
    return res.status(401).json({ error: 'Missing security headers' });
  }
  
  // Validate timestamp
  if (!validateTimestamp(timestamp)) {
    logSecurityIncident({
      type: 'INVALID_TIMESTAMP',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      timestamp
    });
    return res.status(401).json({ error: 'Invalid or expired timestamp' });
  }
  
  // Check for replay attacks (nonce reuse)
  if (securityStore.nonces.has(nonce)) {
    logSecurityIncident({
      type: 'REPLAY_ATTACK',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      nonce
    });
    return res.status(401).json({ error: 'Invalid nonce (possible replay attack)' });
  }
  
  // Add nonce to store and clean up old nonces
  securityStore.nonces.add(nonce);
  setTimeout(() => securityStore.nonces.delete(nonce), SECURITY_CONFIG.TIMESTAMP_TOLERANCE);
  
  // Verify signature
  const payload = {
    ...req.body,
    timestamp: parseInt(timestamp),
    apiKey: req.apiKey
  };
  
  if (!verifySignature(payload, signature, SECRET_KEY)) {
    logSecurityIncident({
      type: 'INVALID_SIGNATURE',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      signature: signature.substring(0, 16) + '...'
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};

// Secure email webhook endpoint
app.post('/api/secure-email-webhook', authenticateRequest, verifyRequestSignature, async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  
  try {
    console.log(`🔐 Processing secure email request: ${requestId}`);
    
    // Validate request data
    const validation = validateEmailRequest(req.body);
    if (!validation.isValid) {
      logSecurityIncident({
        type: 'VALIDATION_FAILED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        errors: validation.errors,
        requestId
      });
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors,
        requestId 
      });
    }
    
    // Sanitize input data
    const sanitizedData = {
      recipientName: sanitizeInput(req.body.recipientName),
      emailPurpose: sanitizeInput(req.body.emailPurpose),
      tone: sanitizeInput(req.body.tone),
      keyPoints: sanitizeInput(req.body.keyPoints),
      additionalContext: req.body.additionalContext ? sanitizeInput(req.body.additionalContext) : undefined,
      emailLength: sanitizeInput(req.body.emailLength),
    };
    
    // Prepare data for n8n
    const n8nData = {
      ...sanitizedData,
      requestId,
      timestamp: Date.now(),
      source: 'secure-webhook'
    };
    
    console.log('📤 Forwarding sanitized request to n8n:', { requestId, ...sanitizedData });
    
    // Get n8n webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error('❌ N8N_WEBHOOK_URL not configured in environment variables');
      logSecurityIncident({
        type: 'CONFIGURATION_ERROR',
        ip: req.ip,
        endpoint: req.path,
        error: 'N8N_WEBHOOK_URL not configured',
        requestId
      });
      return res.status(500).json({ error: 'Service configuration error', requestId });
    }
    
    // Forward to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlameAI-SecureProxy/1.0',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify(n8nData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📥 n8n response status: ${n8nResponse.status} for request: ${requestId}`);
      
      if (n8nResponse.ok) {
        const responseData = await n8nResponse.json();
        console.log('✅ n8n response received:', { requestId, data: responseData });
        
        // Generate response signature
        const responsePayload = {
          ...responseData,
          requestId,
          timestamp: Date.now()
        };
        const responseSignature = generateSignature(responsePayload, SECRET_KEY);
        
        return res.status(200)
          .set('X-Signature', responseSignature)
          .set('X-Request-ID', requestId)
          .json(responsePayload);
      } else {
        const errorText = await n8nResponse.text();
        console.error('❌ n8n error response:', { requestId, error: errorText, status: n8nResponse.status });
        
        logSecurityIncident({
          type: 'N8N_ERROR',
          ip: req.ip,
          endpoint: req.path,
          n8nStatus: n8nResponse.status,
          n8nError: errorText,
          requestId
        });
        
        return res.status(n8nResponse.status).json({ 
          error: 'Email service temporarily unavailable',
          details: 'Service error occurred',
          requestId 
        });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logSecurityIncident({
          type: 'N8N_TIMEOUT',
          ip: req.ip,
          endpoint: req.path,
          timeout: 30000,
          requestId
        });
        return res.status(504).json({ 
          error: 'Service timeout',
          details: 'Email service took too long to respond',
          requestId 
        });
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('❌ Secure webhook error:', { requestId, error: error.message });
    
    logSecurityIncident({
      type: 'WEBHOOK_ERROR',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      error: error.message,
      requestId
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      requestId 
    });
  }
});

// Secure prompt webhook endpoint
app.post('/api/secure-prompt-webhook', authenticateRequest, verifyRequestSignature, async (req, res) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  
  try {
    console.log(`🔐 Processing secure prompt request: ${requestId}`);
    
    // Validate request data
    const validation = validatePromptRequest(req.body);
    if (!validation.isValid) {
      logSecurityIncident({
        type: 'PROMPT_VALIDATION_FAILED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        errors: validation.errors,
        requestId
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
        requestId
      });
    }
    
    // Sanitize input data
    const sanitizedData = {
      prompt: sanitizeInput(req.body.prompt),
      context: req.body.context ? sanitizeInput(req.body.context) : undefined,
      model: req.body.model ? sanitizeInput(req.body.model) : 'gpt-4',
      temperature: req.body.temperature || 0.7,
      maxTokens: req.body.maxTokens || 1000,
      conversationHistory: req.body.conversationHistory || [],
      // Structured prompt fields
      taskDescription: req.body.taskDescription ? sanitizeInput(req.body.taskDescription) : undefined,
      useCaseCategory: req.body.useCaseCategory ? sanitizeInput(req.body.useCaseCategory) : undefined,
      desiredOutputFormat: req.body.desiredOutputFormat ? sanitizeInput(req.body.desiredOutputFormat) : undefined,
      targetModel: req.body.targetModel ? sanitizeInput(req.body.targetModel) : undefined,
      contextBackground: req.body.contextBackground ? sanitizeInput(req.body.contextBackground) : undefined,
      industryDomain: req.body.industryDomain ? sanitizeInput(req.body.industryDomain) : undefined,
    };
    
    // Prepare data for n8n - match the structure that the working chat endpoint expects
    const n8nData = {
      // For structured prompts, create a message from the structured data
      message: sanitizedData.taskDescription || sanitizedData.prompt || 'No prompt provided',
      sessionId: requestId,
      sender: 'user',
      createdAt: new Date().toISOString(),
      // Include structured data as additional context
      structuredData: {
        taskDescription: sanitizedData.taskDescription,
        useCaseCategory: sanitizedData.useCaseCategory,
        desiredOutputFormat: sanitizedData.desiredOutputFormat,
        targetModel: sanitizedData.targetModel,
        contextBackground: sanitizedData.contextBackground,
        industryDomain: sanitizedData.industryDomain,
        context: sanitizedData.context,
        model: sanitizedData.model,
        temperature: sanitizedData.temperature,
        maxTokens: sanitizedData.maxTokens
      },
      requestId,
      timestamp: Date.now(),
      source: 'secure-prompt-webhook'
    };
    
    console.log('📤 Forwarding sanitized prompt request to n8n:', { requestId, message: n8nData.message.substring(0, 100) + '...', hasStructuredData: !!n8nData.structuredData });
    
    // Get n8n prompt webhook URL from environment variables
    const n8nPromptWebhookUrl = process.env.N8N_PROMPT_WEBHOOK_URL;
    if (!n8nPromptWebhookUrl) {
      console.error('❌ N8N_PROMPT_WEBHOOK_URL not configured in environment variables');
      logSecurityIncident({
        type: 'PROMPT_CONFIGURATION_ERROR',
        ip: req.ip,
        endpoint: req.path,
        error: 'N8N_PROMPT_WEBHOOK_URL not configured',
        requestId
      });
      return res.status(500).json({
        success: false,
        error: 'Service configuration error',
        requestId
      });
    }
    
    // Forward to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const n8nResponse = await fetch(n8nPromptWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlameAI-SecurePromptProxy/1.0',
          'X-Request-ID': requestId,
          'X-Webhook-Secret': process.env.PROMPT_WEBHOOK_SECRET || ''
        },
        body: JSON.stringify(n8nData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📥 n8n prompt response status: ${n8nResponse.status} for request: ${requestId}`);
      
      if (n8nResponse.ok) {
        const responseData = await n8nResponse.json();
        console.log('✅ n8n prompt response received:', { requestId, hasData: !!responseData });
        
        // Format the response to match what the frontend expects
        const formattedData = {
          optimizedPrompt: responseData.message || responseData.response || responseData.output || 'Prompt processed successfully',
          suggestions: responseData.suggestions || [],
          improvements: responseData.improvements || [],
          output: responseData.output || responseData.message,
          message: responseData.message
        };
        
        // Generate response signature
        const responsePayload = {
          success: true,
          data: formattedData,
          requestId,
          timestamp: Date.now()
        };
        const responseSignature = generateSignature(responsePayload, SECRET_KEY);
        
        return res.status(200)
          .set('X-Signature', responseSignature)
          .set('X-Request-ID', requestId)
          .json(responsePayload);
      } else {
        const errorText = await n8nResponse.text();
        console.error('❌ n8n prompt error response:', { requestId, error: errorText, status: n8nResponse.status });
        
        logSecurityIncident({
          type: 'N8N_PROMPT_ERROR',
          ip: req.ip,
          endpoint: req.path,
          n8nStatus: n8nResponse.status,
          n8nError: errorText,
          requestId
        });
        
        return res.status(n8nResponse.status).json({
          success: false,
          error: 'Prompt service temporarily unavailable',
          details: 'Service error occurred',
          requestId
        });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logSecurityIncident({
          type: 'N8N_PROMPT_TIMEOUT',
          ip: req.ip,
          endpoint: req.path,
          timeout: 30000,
          requestId
        });
        return res.status(504).json({
          success: false,
          error: 'Service timeout',
          details: 'Prompt service took too long to respond',
          requestId
        });
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('❌ Secure prompt webhook error:', { requestId, error: error.message });
    
    logSecurityIncident({
      type: 'PROMPT_WEBHOOK_ERROR',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      error: error.message,
      requestId
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      requestId
    });
  }
});

// Security status endpoint
app.get('/api/security-status', authenticateRequest, (req, res) => {
  const status = {
    timestamp: Date.now(),
    config: {
      rateLimitWindow: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
      timestampTolerance: SECURITY_CONFIG.TIMESTAMP_TOLERANCE
    },
    statistics: {
      activeApiKeys: securityStore.apiKeys.size,
      storedNonces: securityStore.nonces.size,
      recentIncidents: securityStore.incidents.slice(-10).map(inc => ({
        id: inc.id,
        type: inc.type,
        timestamp: inc.timestamp
      }))
    },
    health: 'healthy'
  };
  
  res.json(status);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    security: 'enabled'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  logSecurityIncident({
    type: 'UNHANDLED_ERROR',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.headers['x-request-id']
  });
});

// 404 handler
app.use((req, res) => {
  logSecurityIncident({
    type: 'NOT_FOUND',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.path,
    method: req.method
  });
  
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`🔒 Secure webhook server running on port ${port}`);
  console.log(`🔑 API Key: ${API_KEY}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🛡️  Security status: http://localhost:${port}/api/security-status`);
  console.log(`📧 Secure email webhook: http://localhost:${port}/api/secure-email-webhook`);
  console.log(`🤖 Secure prompt webhook: http://localhost:${port}/api/secure-prompt-webhook`);
  
  // Log startup
  logSecurityIncident({
    type: 'SERVER_START',
    port,
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  logSecurityIncident({
    type: 'SERVER_SHUTDOWN',
    reason: 'SIGTERM',
    timestamp: Date.now()
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  logSecurityIncident({
    type: 'SERVER_SHUTDOWN',
    reason: 'SIGINT',
    timestamp: Date.now()
  });
  process.exit(0);
});