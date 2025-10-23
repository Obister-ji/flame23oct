import { z } from 'zod';

// Rate limiting storage (in production, use Redis or database)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Request validation schema
const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  sender: z.enum(['user', 'bot']).optional(),
  createdAt: z.string().optional()
});

// Rate limiting function
function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
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
export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limiting
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return Response.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime || 0)
          }
        }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    try {
      const validatedData = messageSchema.parse(body);
      
      // Additional security checks
      if (validatedData.message && validatedData.message.length > 2000) {
        return Response.json(
          { error: 'Message too long. Maximum 2000 characters allowed.' },
          { status: 400 }
        );
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
          return Response.json(
            { error: 'Invalid message format. Suspicious content detected.' },
            { status: 400 }
          );
        }
      }
      
      // Forward the validated request to n8n webhook
      const n8nWebhookUrl = 'https://n8n.srv970139.hstgr.cloud/webhook/7cc20139-28b4-4798-aa0c-84752dce1db6/chat';
      
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlameAI-Proxy/1.0',
          'X-Forwarded-For': ip,
          'X-Request-ID': crypto.randomUUID(),
        },
        body: JSON.stringify(validatedData)
      });
      
      if (!response.ok) {
        console.error(`n8n webhook error: ${response.status} ${response.statusText}`);
        return Response.json(
          { error: 'Chat service temporarily unavailable. Please try again later.' },
          { status: response.status }
        );
      }
      
      // Get response from n8n
      const responseData = await response.json();
      
      // Log the interaction for monitoring (in production, use proper logging)
      console.log(`Chat interaction from ${ip}: ${validatedData.message?.substring(0, 50)}...`);
      
      return Response.json(responseData, {
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(Math.max(0, 30 - (rateLimit.get(ip)?.count || 0))),
          'X-RateLimit-Reset': String(rateLimit.get(ip)?.resetTime || 0)
        }
      });
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return Response.json(
          { 
            error: 'Invalid request format',
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return Response.json(
    { error: 'Method not allowed. Use POST for chat requests.' },
    { status: 405 }
  );
}

export async function PUT() {
  return Response.json(
    { error: 'Method not allowed. Use POST for chat requests.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return Response.json(
    { error: 'Method not allowed. Use POST for chat requests.' },
    { status: 405 }
  );
}