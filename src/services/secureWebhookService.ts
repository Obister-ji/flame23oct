import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import crypto from 'crypto-js';
import { toast } from 'sonner';

// Security configuration
const SECURITY_CONFIG = {
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  MAX_FIELD_LENGTH: 10000,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input validation patterns
const VALIDATION_PATTERNS = {
  recipientName: /^[a-zA-Z\s\-'\.]{1,100}$/,
  emailPurpose: /^[a-zA-Z\s\-]{1,50}$/,
  tone: /^[a-zA-Z\s\-]{1,30}$/,
  emailLength: /^(short|medium|long)$/,
  // Allow more characters in text fields but limit dangerous ones
  keyPoints: /^[\s\S]{1,5000}$/,
  additionalContext: /^[\s\S]{0,2000}$/,
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

export interface SecureEmailRequest {
  recipientName: string;
  emailPurpose: string;
  tone: string;
  keyPoints: string;
  additionalContext?: string;
  emailLength: string;
  timestamp: number;
  nonce: string;
  signature?: string;
}

export interface SecureEmailResponse {
  success: boolean;
  data?: {
    email: string;
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

class SecureWebhookService {
  private baseURL: string;
  private apiKey: string;
  private secretKey: string;
  private requestIdCounter = 0;

  constructor() {
    // Use environment variables for sensitive data
    this.baseURL = this.getEnvVar('REACT_APP_N8N_WEBHOOK_URL') || 'https://n8n.srv970139.hstgr.cloud/webhook/email-writer';
    this.apiKey = this.getEnvVar('REACT_APP_N8N_API_KEY') || this.generateApiKey();
    this.secretKey = this.getEnvVar('REACT_APP_N8N_SECRET_KEY') || this.generateSecretKey();
  }

  private getEnvVar(name: string): string | undefined {
    // Handle both browser and Node.js environments
    if (typeof window !== 'undefined') {
      // Browser environment
      return (window as any).__ENV?.[name] || import.meta.env?.[name];
    } else {
      // Node.js environment
      return (typeof process !== 'undefined') ? process.env?.[name] : undefined;
    }
  }

  private generateApiKey(): string {
    return crypto.lib.WordArray.random(32).toString();
  }

  private generateSecretKey(): string {
    return crypto.lib.WordArray.random(64).toString();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNonce(): string {
    return crypto.lib.WordArray.random(16).toString();
  }

  private generateSignature(data: any, nonce: string): string {
    const timestamp = Date.now();
    const payload = JSON.stringify({ data, nonce, timestamp });
    return crypto.HmacSHA256(payload, this.secretKey).toString();
  }

  private verifySignature(data: any, signature: string, nonce: string): boolean {
    const expectedSignature = this.generateSignature(data, nonce);
    return crypto.HmacSHA256(signature, this.secretKey).toString() === crypto.HmacSHA256(expectedSignature, this.secretKey).toString();
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
      return { isValid: false, error: `${fieldName} contains invalid characters` };
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

  private validateRequest(request: SecureEmailRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    const requiredFields = ['recipientName', 'emailPurpose', 'tone', 'keyPoints', 'emailLength'];
    for (const field of requiredFields) {
      if (!request[field as keyof SecureEmailRequest]) {
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
      ctx.fillText('Client fingerprint', 2, 2);
    }
    const fingerprint = canvas.toDataURL();
    return crypto.MD5(fingerprint + navigator.userAgent).toString();
  }

  private async secureRequest(request: SecureEmailRequest): Promise<SecureEmailResponse> {
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
      const sanitizedRequest: SecureEmailRequest = {
        ...request,
        recipientName: this.sanitizeInput(request.recipientName),
        emailPurpose: this.sanitizeInput(request.emailPurpose),
        tone: this.sanitizeInput(request.tone),
        keyPoints: this.sanitizeInput(request.keyPoints),
        additionalContext: request.additionalContext ? this.sanitizeInput(request.additionalContext) : undefined,
      };

      // Generate signature
      const nonce = this.generateNonce();
      const signature = this.generateSignature(sanitizedRequest, nonce);

      // Prepare secure request
      const securePayload = {
        ...sanitizedRequest,
        nonce,
        signature,
        apiKey: this.apiKey,
        requestId,
        clientTimestamp: Date.now(),
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
              'User-Agent': 'FlameAI-SecureWebhook/1.0'
            },
            timeout: SECURITY_CONFIG.REQUEST_TIMEOUT,
          };

          const response: AxiosResponse = await axios.post(this.baseURL, securePayload, config);
          
          // Verify response signature if present
          if (response.headers['x-signature']) {
            const signatureValid = this.verifySignature(response.data, response.headers['x-signature'], nonce);
            if (!signatureValid) {
              throw new Error('Response signature verification failed');
            }
          }

          return {
            success: true,
            data: {
              email: response.data.email || response.data[0]?.email,
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
      
      // Log security incident
      this.logSecurityIncident({
        requestId,
        clientId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        type: 'WEBHOOK_REQUEST_FAILED'
      });

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

  private logSecurityIncident(incident: {
    requestId: string;
    clientId: string;
    error: string;
    timestamp: number;
    type: string;
  }): void {
    // In production, this would send to a security monitoring service
    console.warn('Security Incident:', {
      ...incident,
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Store incidents locally for monitoring (in production, use a proper logging service)
    const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
    incidents.push(incident);
    
    // Keep only last 100 incidents
    if (incidents.length > 100) {
      incidents.splice(0, incidents.length - 100);
    }
    
    localStorage.setItem('security_incidents', JSON.stringify(incidents));
  }

  public async generateSecureEmail(requestData: {
    recipientName: string;
    emailPurpose: string;
    tone: string;
    keyPoints: string;
    additionalContext?: string;
    emailLength: string;
  }): Promise<SecureEmailResponse> {
    const request: SecureEmailRequest = {
      ...requestData,
      timestamp: Date.now(),
      nonce: this.generateNonce(),
    };

    return this.secureRequest(request);
  }

  public getSecurityStatus(): {
    rateLimitStatus: { [key: string]: any };
    recentIncidents: any[];
    configStatus: { [key: string]: boolean };
  } {
    const clientId = this.getClientId();
    const rateLimitStatus = rateLimitStore.get(clientId);
    const recentIncidents = JSON.parse(localStorage.getItem('security_incidents') || '[]').slice(-10);
    
    return {
      rateLimitStatus: rateLimitStatus || { count: 0, resetTime: Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW },
      recentIncidents,
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
    localStorage.removeItem('security_incidents');
  }
}

// Export singleton instance
export const secureWebhookService = new SecureWebhookService();

// Export utility functions
export const validateEmailInput = (input: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(input);
};

export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const generateSecureToken = (): string => {
  return crypto.lib.WordArray.random(32).toString();
};