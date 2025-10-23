# Secure n8n Chat Widget Deployment Guide

This guide explains how to deploy the secure n8n chat widget with proper security measures in place.

## Overview

The secure chat widget implementation includes:
- **Backend Proxy**: Hides the n8n webhook URL from client-side code
- **Rate Limiting**: Prevents abuse (30 requests per minute per IP)
- **Request Validation**: Validates and sanitizes all incoming requests
- **XSS Protection**: Blocks suspicious content patterns
- **Environment Variables**: Secure configuration management

## Security Features Implemented

### 1. Webhook URL Protection
- Original n8n webhook URL is stored server-side only
- Client-side communicates with `/api/chat` endpoint
- Direct access to n8n webhook is blocked

### 2. Rate Limiting
- 30 requests per minute per IP address
- Configurable time windows and limits
- Automatic reset after time window expires

### 3. Request Validation
- Message length validation (max 2000 characters)
- Schema validation using Zod
- XSS pattern detection and blocking

### 4. Security Headers
- Request ID tracking for monitoring
- IP forwarding for audit trails
- User agent identification

## Development Setup

1. **Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   - The secure proxy will be available at `http://localhost:8080/api/chat`
   - Chat widget will appear in the bottom-right corner

## Production Deployment

### Option 1: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables in Vercel Dashboard**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add:
     ```
     N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-id/chat
     N8N_API_KEY=your_api_key (optional)
     ```

### Option 2: Netlify Deployment

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   # Drag and drop the dist folder to Netlify
   # Or use Netlify CLI
   npm i -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Environment Variables in Netlify**
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add the same variables as Vercel

### Option 3: Custom Server Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Set Up Node.js Server**
   ```bash
   # Install express for the server
   npm install express cors
   ```

3. **Create Server File** (server.js)
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const path = require('path');
   
   const app = express();
   const port = process.env.PORT || 3000;
   
   app.use(cors());
   app.use(express.json());
   
   // Serve static files
   app.use(express.static(path.join(__dirname, 'dist')));
   
   // API proxy route
   app.post('/api/chat', async (req, res) => {
     // Copy the logic from api/chat.js here
   });
   
   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

## Environment Configuration

### Development (.env)
```bash
VITE_CLERK_PUBLISHABLE_KEY=your_dev_key
VITE_N8N_WEBHOOK_URL=https://n8n.srv970139.hstgr.cloud/webhook/your-id/chat
```

### Production (Server Environment Variables)
```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-id/chat
N8N_API_KEY=your_n8n_api_key
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## Monitoring and Maintenance

### 1. Log Monitoring
- Monitor console logs for chat interactions
- Set up alerts for error rates
- Track rate limiting violations

### 2. Performance Monitoring
- Monitor response times
- Track request volumes
- Set up uptime monitoring

### 3. Security Monitoring
- Monitor for suspicious patterns
- Track IP abuse
- Set up alerts for security events

## Testing the Security Implementation

### 1. Test Rate Limiting
```bash
# Send 31 requests quickly
for i in {1..31}; do
  curl -X POST http://localhost:8080/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "test message"}'
done
# Should return 429 on the 31st request
```

### 2. Test XSS Protection
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "<script>alert(\"xss\")</script>"}'
# Should return 400 error
```

### 3. Test Validation
```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
# Should return 400 error
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your server allows requests from your domain
   - Check that preflight requests are handled correctly

2. **Rate Limiting Too Strict**
   - Adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
   - Consider different limits for authenticated users

3. **n8n Webhook Not Responding**
   - Verify the n8n webhook URL is correct
   - Check if n8n requires authentication
   - Test the webhook directly

4. **Build Errors**
   - Ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify environment variables are set

## Security Best Practices

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update n8n regularly

2. **Access Control**
   - Implement authentication if needed
   - Consider role-based access
   - Monitor usage patterns

3. **Data Protection**
   - Don't log sensitive information
   - Implement data retention policies
   - Follow GDPR/CCPA requirements

4. **Backup and Recovery**
   - Regular backups of configuration
   - Disaster recovery plan
   - Monitoring and alerting

## Support

For issues with the secure chat widget:
1. Check the browser console for errors
2. Verify server logs
3. Test the n8n webhook directly
4. Check environment variable configuration
5. Review this troubleshooting guide

The secure implementation provides a robust foundation for your n8n chat integration while protecting your webhook URL and preventing abuse.