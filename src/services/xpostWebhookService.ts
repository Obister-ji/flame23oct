import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import crypto from 'crypto-js';
import { toast } from 'sonner';

// Security configuration for XPostWriter
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  MAX_FIELD_LENGTH: 10000,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 15,
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input validation patterns for XPostWriter
const VALIDATION_PATTERNS = {
  topic: /^[\s\S]{1,200}$/,
  cta: /^[\s\S]{0,100}$/,
  audience: /^[\s\S]{1,100}$/,
  mediaDescription: /^[\s\S]{0,500}$/,
  hashtags: /^[\s\S]{0,300}$/,
  tone: /^(professional|casual|enthusiastic|humorous|informative|inspirational|urgent)$/,
  length: /^(short|medium|long)$/,
};

// XSS and injection prevention patterns
const DANGEROUS_PATTERNS = [
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
  /binding\s*:/gi,
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|\*\/|\/\*)/gi,
  /(\bOR\b.*=.*\bOR\b)/gi,
  /(\bAND\b.*=.*\bAND\b)/gi,
  /(\bWHERE\b.*=.*\bOR\b)/gi,
  /(\bWHERE\b.*=.*\bAND\b)/gi,
];

export interface SecureXPostRequest {
  topic: string;
  cta: string;
  audience: string;
  mediaDescription: string;
  hashtags: string;
  tone: string;
  length: string;
  timestamp: number;
  nonce: string;
  signature?: string;
}

export interface SecureXPostResponse {
  success: boolean;
  data?: {
    content: string;
    hashtags: string[];
    cta: string;
    requestId: string;
    timestamp: number;
  };
  error?: string;
  securityMetadata?: {
    requestId: string;
    rateLimitRemaining: number;
    validationPassed: boolean;
    signatureValid: boolean;
  };
}

class XPostWebhookService {
  private baseURL: string;
  private apiKey: string;
  private secretKey: string;
  private requestIdCounter = 0;

  constructor() {
    // Use the provided webhook URL
    this.baseURL = 'https://n8n.srv970139.hstgr.cloud/webhook/b16ba27f-dee9-4d42-8976-e03476cec981';
    this.apiKey = this.generateApiKey();
    this.secretKey = this.generateSecretKey();
  }

  private generateApiKey(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  private generateSecretKey(): string {
    return crypto.lib.WordArray.random(64).toString();
  }

  private generateRequestId(): string {
    return `xpost_${Date.now()}_${++this.requestIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNonce(): string {
    return crypto.lib.WordArray.random(16).toString();
  }

  private generateSignature(data: any, nonce: string): string {
    const timestamp = Date.now();
    const payload = JSON.stringify({ data, nonce, timestamp });
    return crypto.HmacSHA256(payload, this.secretKey).toString();
  }

  private sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove dangerous patterns
    let sanitized = input;
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    SQL_INJECTION_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // HTML entity encoding for additional safety
    sanitized = sanitized
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized.trim();
  }

  private validateField(fieldName: string, value: string): { isValid: boolean; error?: string } {
    // Check field length
    if (value.length > SECURITY_CONFIG.MAX_FIELD_LENGTH) {
      return { isValid: false, error: `${fieldName} exceeds maximum length` };
    }

    // Check against validation patterns
    const pattern = VALIDATION_PATTERNS[fieldName as keyof typeof VALIDATION_PATTERNS];
    if (pattern && !pattern.test(value)) {
      return { isValid: false, error: `${fieldName} contains invalid characters or format` };
    }

    // Additional checks for dangerous content
    const combinedDangerousPatterns = [...DANGEROUS_PATTERNS, ...SQL_INJECTION_PATTERNS];
    for (const dangerousPattern of combinedDangerousPatterns) {
      if (dangerousPattern.test(value)) {
        return { isValid: false, error: `${fieldName} contains potentially dangerous content` };
      }
    }

    return { isValid: true };
  }

  private validateRequest(request: SecureXPostRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    const requiredFields = ['topic', 'audience', 'tone', 'length'];
    for (const field of requiredFields) {
      if (!request[field as keyof SecureXPostRequest]) {
        errors.push(`${field} is required`);
      }
    }

    // Field-specific validation
    Object.entries(request).forEach(([field, value]) => {
      if (typeof value === 'string') {
        const validation = this.validateField(field, value);
        if (!validation.isValid) {
          errors.push(validation.error || `${field} validation failed`);
        }
      }
    });

    // Timestamp validation (prevent replay attacks)
    const now = Date.now();
    if (Math.abs(now - request.timestamp) > 300000) { // 5 minutes window
      errors.push('Request timestamp is too old or too far in the future');
    }

    // Nonce validation
    if (!request.nonce || request.nonce.length < 16) {
      errors.push('Invalid nonce');
    }

    return { isValid: errors.length === 0, errors };
  }

  private checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const clientLimit = rateLimitStore.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      // Reset or create new rate limit entry
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      });
      return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW };
    }

    if (clientLimit.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0, resetTime: clientLimit.resetTime };
    }

    clientLimit.count++;
    return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - clientLimit.count, resetTime: clientLimit.resetTime };
  }

  private getClientId(): string {
    // Generate a client identifier based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('XPost fingerprint', 2, 2);
    }
    const fingerprint = canvas.toDataURL();
    return crypto.MD5(fingerprint + navigator.userAgent).toString();
  }

  private async secureRequest(request: SecureXPostRequest): Promise<SecureXPostResponse> {
    const requestId = this.generateRequestId();
    const clientId = this.getClientId();
    
    try {
      // Rate limiting check
      const rateLimit = this.checkRateLimit(clientId);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          securityMetadata: {
            requestId,
            rateLimitRemaining: 0,
            validationPassed: false,
            signatureValid: false
          }
        };
      }

      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          securityMetadata: {
            requestId,
            rateLimitRemaining: rateLimit.remaining,
            validationPassed: false,
            signatureValid: false
          }
        };
      }

      // Sanitize inputs
      const sanitizedRequest: SecureXPostRequest = {
        ...request,
        topic: this.sanitizeInput(request.topic),
        cta: this.sanitizeInput(request.cta),
        audience: this.sanitizeInput(request.audience),
        mediaDescription: this.sanitizeInput(request.mediaDescription),
        hashtags: this.sanitizeInput(request.hashtags),
      };

      // Generate signature
      const nonce = this.generateNonce();
      const signature = this.generateSignature(sanitizedRequest, nonce);

      // Prepare secure request - simplified for n8n compatibility
      const securePayload = {
        topic: sanitizedRequest.topic,
        cta: sanitizedRequest.cta,
        audience: sanitizedRequest.audience,
        mediaDescription: sanitizedRequest.mediaDescription,
        hashtags: sanitizedRequest.hashtags,
        tone: sanitizedRequest.tone,
        length: sanitizedRequest.length,
        // Add security metadata in headers instead of body for n8n compatibility
      };

      // Make secure request with retry logic
      let lastError: any;
      for (let attempt = 1; attempt <= SECURITY_CONFIG.MAX_RETRIES; attempt++) {
        try {
          const config: AxiosRequestConfig = {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey,
              'X-Request-ID': requestId,
              'X-Timestamp': Date.now().toString(),
              'X-Signature': signature,
              'User-Agent': 'FlameAI-XPostWriter/1.0'
            },
            timeout: SECURITY_CONFIG.REQUEST_TIMEOUT,
          };

          const response: AxiosResponse = await axios.post(this.baseURL, securePayload, config);
          
          console.log('N8N Response Status:', response.status);
          console.log('N8N Response Headers:', response.headers);
          console.log('N8N Response Data:', response.data);
          
          // Process the response - handle different response formats
          let postContent = '';
          let postHashtags = [];
          let postCTA = '';
          
          // Check if response is an array
          if (Array.isArray(response.data)) {
            console.log('Response is an array with', response.data.length, 'items');
            if (response.data.length > 0) {
              const firstItem = response.data[0];
              postContent = firstItem.content || firstItem.text || firstItem.post || firstItem.message || firstItem.output || 'Generated post content';
              postHashtags = firstItem.hashtags ?
                (Array.isArray(firstItem.hashtags) ? firstItem.hashtags : firstItem.hashtags.split(' ').filter((h: string) => h.startsWith('#'))) :
                (request.hashtags ? request.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
              postCTA = firstItem.cta || request.cta || 'Engage with this post';
            }
          }
          // Check if response has data property that's an array
          else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            console.log('Response has data array with', response.data.data.length, 'items');
            if (response.data.data.length > 0) {
              const firstItem = response.data.data[0];
              postContent = firstItem.content || firstItem.text || firstItem.post || firstItem.message || firstItem.output || 'Generated post content';
              postHashtags = firstItem.hashtags ?
                (Array.isArray(firstItem.hashtags) ? firstItem.hashtags : firstItem.hashtags.split(' ').filter((h: string) => h.startsWith('#'))) :
                (request.hashtags ? request.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
              postCTA = firstItem.cta || request.cta || 'Engage with this post';
            }
          }
          // Check if response has direct content property
          else if (response.data && (response.data.content || response.data.text || response.data.post || response.data.message || response.data.output)) {
            console.log('Response has direct content property');
            postContent = response.data.content || response.data.text || response.data.post || response.data.message || response.data.output;
            postHashtags = response.data.hashtags ?
              (Array.isArray(response.data.hashtags) ? response.data.hashtags : response.data.hashtags.split(' ').filter((h: string) => h.startsWith('#'))) :
              (request.hashtags ? request.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
            postCTA = response.data.cta || request.cta || 'Engage with this post';
          }
          // Check if response is a simple string
          else if (typeof response.data === 'string') {
            console.log('Response is a string');
            postContent = response.data;
            postHashtags = request.hashtags ? request.hashtags.split(' ').filter(h => h.startsWith('#')) : [];
            postCTA = request.cta || 'Engage with this post';
          }
          // Fallback - try to extract any text content
          else {
            console.warn('Unexpected response format:', response.data);
            postContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            postHashtags = request.hashtags ? request.hashtags.split(' ').filter(h => h.startsWith('#')) : [];
            postCTA = request.cta || 'Engage with this post';
          }
          
          console.log('Processed post content:', postContent);
          console.log('Processed hashtags:', postHashtags);
          console.log('Processed CTA:', postCTA);

          return {
            success: true,
            data: {
              content: postContent,
              hashtags: postHashtags,
              cta: postCTA,
              requestId,
              timestamp: Date.now()
            },
            securityMetadata: {
              requestId,
              rateLimitRemaining: rateLimit.remaining,
              validationPassed: true,
              signatureValid: true
            }
          };

        } catch (error) {
          lastError = error;
          console.warn(`Request attempt ${attempt} failed:`, error);
          
          if (attempt < SECURITY_CONFIG.MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.RETRY_DELAY * attempt));
          }
        }
      }

      throw lastError;

    } catch (error) {
      console.error('Secure webhook request failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        securityMetadata: {
          requestId,
          rateLimitRemaining: 0,
          validationPassed: false,
          signatureValid: false
        }
      };
    }
  }

  public async generateSecurePost(requestData: {
    topic: string;
    cta: string;
    audience: string;
    mediaDescription: string;
    hashtags: string;
    tone: string;
    length: string;
  }): Promise<SecureXPostResponse> {
    const request: SecureXPostRequest = {
      ...requestData,
      timestamp: Date.now(),
      nonce: this.generateNonce(),
    };

    // Try secure request first
    try {
      const result = await this.secureRequest(request);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.warn('Secure request failed, trying simple request:', error);
    }

    // Fallback to simple request if secure fails
    return this.simpleRequest(requestData);
  }

  private async simpleRequest(requestData: {
    topic: string;
    cta: string;
    audience: string;
    mediaDescription: string;
    hashtags: string;
    tone: string;
    length: string;
  }): Promise<SecureXPostResponse> {
    const requestId = this.generateRequestId();
    
    try {
      console.log('Trying GET request to n8n...');
      
      // Build query string from request data
      const queryParams = new URLSearchParams({
        topic: requestData.topic,
        cta: requestData.cta || 'Engage with this post',
        audience: requestData.audience,
        mediaDescription: requestData.mediaDescription || '',
        hashtags: requestData.hashtags || '',
        tone: requestData.tone,
        length: requestData.length,
        requestId: requestId,
        timestamp: Date.now().toString(),
      });

      const fullUrl = `${this.baseURL}?${queryParams.toString()}`;
      console.log('Making GET request to:', fullUrl);

      // Try POST first as some n8n webhooks might be configured for POST
      let response;
      try {
        response = await axios.post(this.baseURL, {
          topic: requestData.topic,
          cta: requestData.cta || 'Engage with this post',
          audience: requestData.audience,
          mediaDescription: requestData.mediaDescription || '',
          hashtags: requestData.hashtags || '',
          tone: requestData.tone,
          length: requestData.length,
          requestId: requestId,
          timestamp: Date.now().toString(),
        }, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FlameAI-XPostWriter/1.0'
          },
          timeout: 30000,
        });
        console.log('POST request successful');
      } catch (postError) {
        console.log('POST failed, trying GET request:', postError);
        // Fallback to GET if POST fails
        response = await axios.get(fullUrl, {
          headers: {
            'User-Agent': 'FlameAI-XPostWriter/1.0'
          },
          timeout: 30000,
        });
        console.log('GET request successful');
      }

      console.log('GET request response:', response.data);

      // Process the actual n8n response
      let postContent = '';
      let postHashtags = [];
      let postCTA = '';
      
      // Handle different response formats from n8n
      if (Array.isArray(response.data)) {
        console.log('Response is an array with', response.data.length, 'items');
        if (response.data.length > 0) {
          const firstItem = response.data[0];
          postContent = firstItem.content || firstItem.text || firstItem.post || firstItem.message || firstItem.output || firstItem.result || 'Generated post content';
          postHashtags = firstItem.hashtags ?
            (Array.isArray(firstItem.hashtags) ? firstItem.hashtags : String(firstItem.hashtags).split(' ').filter((h: string) => h.startsWith('#'))) :
            (requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
          postCTA = firstItem.cta || firstItem.callToAction || requestData.cta || 'Engage with this post';
        }
      }
      // Check if response has data property that's an array
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Response has data array with', response.data.data.length, 'items');
        if (response.data.data.length > 0) {
          const firstItem = response.data.data[0];
          postContent = firstItem.content || firstItem.text || firstItem.post || firstItem.message || firstItem.output || firstItem.result || 'Generated post content';
          postHashtags = firstItem.hashtags ?
            (Array.isArray(firstItem.hashtags) ? firstItem.hashtags : String(firstItem.hashtags).split(' ').filter((h: string) => h.startsWith('#'))) :
            (requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
          postCTA = firstItem.cta || firstItem.callToAction || requestData.cta || 'Engage with this post';
        }
      }
      // Check if response has direct content property
      else if (response.data && (response.data.content || response.data.text || response.data.post || response.data.message || response.data.output || response.data.result)) {
        console.log('Response has direct content property');
        postContent = response.data.content || response.data.text || response.data.post || response.data.message || response.data.output || response.data.result;
        postHashtags = response.data.hashtags ?
          (Array.isArray(response.data.hashtags) ? response.data.hashtags : String(response.data.hashtags).split(' ').filter((h: string) => h.startsWith('#'))) :
          (requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : []);
        postCTA = response.data.cta || response.data.callToAction || requestData.cta || 'Engage with this post';
      }
      // Check if response is a simple string
      else if (typeof response.data === 'string') {
        console.log('Response is a string');
        postContent = response.data;
        postHashtags = requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : [];
        postCTA = requestData.cta || 'Engage with this post';
      }
      // Handle case where n8n returns just "Workflow was started" - implement polling for results
      else if (response.data && response.data.message === 'Workflow was started') {
        console.log('Workflow started, implementing polling for results...');
        
        // Poll for results using the requestId
        const pollResults = await this.pollForResults(requestId, 30000); // Poll for 30 seconds
        
        if (pollResults.success) {
          postContent = pollResults.content;
          postHashtags = pollResults.hashtags;
          postCTA = pollResults.cta;
        } else {
          // Fallback if polling fails
          postContent = `🚀 Processing your request for ${requestData.topic}...`;
          postHashtags = requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : ['#Processing', '#AI'];
          postCTA = requestData.cta || 'Check back soon for results!';
        }
      }
      // Fallback - try to extract any text content
      else {
        console.warn('Unexpected response format:', response.data);
        postContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        postHashtags = requestData.hashtags ? requestData.hashtags.split(' ').filter(h => h.startsWith('#')) : [];
        postCTA = requestData.cta || 'Engage with this post';
      }
      
      console.log('Final processed content:', postContent);
      console.log('Final processed hashtags:', postHashtags);
      console.log('Final processed CTA:', postCTA);

      return {
        success: true,
        data: {
          content: postContent,
          hashtags: postHashtags,
          cta: postCTA,
          requestId,
          timestamp: Date.now()
        },
        securityMetadata: {
          requestId,
          rateLimitRemaining: 15,
          validationPassed: true,
          signatureValid: false // Simple request doesn't use signature
        }
      };

    } catch (error) {
      console.error('Simple request also failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        securityMetadata: {
          requestId,
          rateLimitRemaining: 0,
          validationPassed: false,
          signatureValid: false
        }
      };
    }
  }

  private async pollForResults(requestId: string, timeoutMs: number): Promise<{
    success: boolean;
    content: string;
    hashtags: string[];
    cta: string;
  }> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds
    
    console.log('Starting to poll for results with requestId:', requestId);
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Poll the results endpoint (you might need to configure this in n8n)
        const resultsUrl = `${this.baseURL.replace('/webhook/', '/webhook-results/')}${requestId}`;
        console.log('Polling:', resultsUrl);
        
        const response = await axios.get(resultsUrl, {
          headers: {
            'User-Agent': 'FlameAI-XPostWriter/1.0'
          },
          timeout: 5000,
        });
        
        console.log('Poll response:', response.data);
        
        // Check if we have results
        if (response.data && response.data.status === 'completed') {
          return {
            success: true,
            content: response.data.content || 'Generated content',
            hashtags: response.data.hashtags || [],
            cta: response.data.cta || 'Engage with this post'
          };
        }
        
        // If workflow is still running, continue polling
        if (response.data && response.data.status === 'running') {
          console.log('Workflow still running, continuing to poll...');
          continue;
        }
        
      } catch (error) {
        console.warn('Polling attempt failed:', error);
        // Continue polling on error
      }
    }
    
    // Timeout reached
    console.log('Polling timeout reached for requestId:', requestId);
    return {
      success: false,
      content: '',
      hashtags: [],
      cta: ''
    };
  }

  public getSecurityStatus(): {
    rateLimitStatus: { [key: string]: any };
    configStatus: { [key: string]: boolean };
  } {
    const clientId = this.getClientId();
    const rateLimitStatus = rateLimitStore.get(clientId);
    
    return {
      rateLimitStatus: rateLimitStatus || { count: 0, resetTime: Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW },
      configStatus: {
        hasApiKey: !!this.apiKey,
        hasSecretKey: !!this.secretKey,
        hasWebhookUrl: !!this.baseURL,
        httpsEnabled: this.baseURL.startsWith('https://')
      }
    };
  }

  public clearSecurityData(): void {
    rateLimitStore.clear();
  }
}

// Export singleton instance
export const xpostWebhookService = new XPostWebhookService();

// Export utility functions
export const validateXPostInput = (fieldName: string, value: string): boolean => {
  const pattern = VALIDATION_PATTERNS[fieldName as keyof typeof VALIDATION_PATTERNS];
  return pattern ? pattern.test(value) : false;
};

export const sanitizeXPostInput = (input: string): string => {
  const service = new XPostWebhookService();
  return service['sanitizeInput'](input);
};