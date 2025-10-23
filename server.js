import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Different port from Vite

// Security middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  credentials: true
}));

// Rate limiting middleware (simple implementation)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

const rateLimitMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit[clientIp]) {
    rateLimit[clientIp] = { requests: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (now > rateLimit[clientIp].resetTime) {
    rateLimit[clientIp] = { requests: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  rateLimit[clientIp].requests++;
  
  if (rateLimit[clientIp].requests > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  
  next();
};

// Apply rate limiting to API routes
app.use('/api/', rateLimitMiddleware);

// Body parser middleware with size limit
app.use(express.json({ limit: '10mb' }));

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const { message, sessionId, sender, createdAt } = req.body;
    
    // Basic validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long. Maximum 2000 characters allowed.' });
    }
    
    // Prepare data for n8n
    const n8nData = {
      message,
      sessionId: sessionId || 'anonymous',
      sender: sender || 'user',
      createdAt: createdAt || new Date().toISOString()
    };
    
    console.log('Forwarding to n8n:', n8nData);
    
    // Get n8n webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured in environment variables');
      return res.status(500).json({ error: 'Chat service configuration error' });
    }
    
    // Forward to n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlameAI-Proxy/1.0'
      },
      body: JSON.stringify(n8nData),
      timeout: 30000 // 30 second timeout
    });
    
    console.log('n8n response status:', n8nResponse.status);
    
    if (n8nResponse.ok) {
      const responseData = await n8nResponse.json();
      console.log('n8n response data:', responseData);
      return res.status(200).json(responseData);
    } else {
      const errorText = await n8nResponse.text();
      console.error('n8n error response:', errorText);
      return res.status(n8nResponse.status).json({ 
        error: 'Chat service temporarily unavailable',
        details: errorText
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Handle other methods
app.get('/api/chat', (req, res) => {
  res.status(405).json({ error: 'Method not allowed. Use POST for chat requests.' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Start server
app.listen(port, () => {
  console.log(`🔒 Secure chat API server running on port ${port}`);
  console.log(`📊 Health check available at: http://localhost:${port}/api/health`);
});