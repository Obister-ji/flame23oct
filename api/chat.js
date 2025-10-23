// Production-ready serverless function for Vercel/Netlify deployment
import { z } from 'zod';

// Rate limiting storage (in production, use Redis or database)
const rateLimit = new Map();

// Request validation schema
const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  sender: z.enum(['user', 'bot']).optional(),
  createdAt: z.string().optional()
});

// Rate limiting function
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute per IP
  
  const current = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };
  
  if (now > current.resetTime) {
    // Reset the window
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  } else if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime };
  } else {
    current.count++;
    rateLimit.set(ip, current);
    return { allowed: true };
  }
}

// Main API handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST for chat requests.' });
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               'unknown';
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        resetTime: rateLimitResult.resetTime
      }, {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimitResult.resetTime || 0)
      });
    }
    
    // Parse and validate request body
    try {
      const validatedData = messageSchema.parse(req.body);
      
      // Additional security checks
      if (validatedData.message && validatedData.message.length > 2000) {
        return res.status(400).json({ error: 'Message too long. Maximum 2000 characters allowed.' });
      }
      
      // Check for suspicious patterns (basic XSS prevention)
      const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];
      
      const message = validatedData.message || '';
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(message)) {
          return res.status(400).json({ error: 'Invalid message format. Suspicious content detected.' });
        }
      }
      
      // Forward the validated request to n8n webhook
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.srv970139.hstgr.cloud/webhook/7cc20139-28b4-4798-aa0c-84752dce1db6/chat';
      
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlameAI-Proxy/1.0',
          'X-Forwarded-For': ip,
          'X-Request-ID': crypto.randomUUID(),
          ...(process.env.N8N_API_KEY && { 'Authorization': `Bearer ${process.env.N8N_API_KEY}` })
        },
        body: JSON.stringify(validatedData)
      });
      
      if (!response.ok) {
        console.error(`n8n webhook error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: 'Chat service temporarily unavailable. Please try again later.' });
      }
      
      // Get response from n8n
      const responseData = await response.json();
      
      // Log the interaction for monitoring (in production, use proper logging)
      console.log(`Chat interaction from ${ip}: ${validatedData.message?.substring(0, 50)}...`);
      
      return res.status(200).json(responseData, {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(Math.max(0, 30 - (rateLimit.get(ip)?.count || 0))),
        'X-RateLimit-Reset': String(rateLimit.get(ip)?.resetTime || 0)
      });
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request format',
          details: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}