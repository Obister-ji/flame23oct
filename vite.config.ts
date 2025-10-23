import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/chat': {
        target: 'http://localhost:8080',
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Custom plugin to handle API routes
    {
      name: 'api-routes',
      configureServer(server: any) {
        server.middlewares.use('/api/chat', async (req: any, res: any, next: any) => {
          // Handle all methods for /api/chat
          if (req.url && req.url.includes('/api/chat')) {
            try {
              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              
              // Handle preflight requests
              if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
              }
              
              // Simple inline API handler
              if (req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Method not allowed. Use POST for chat requests.'
                }));
                return;
              }
              
              if (req.method === 'POST') {
                // Get request body with proper encoding
                const chunks: any[] = [];
                req.on('data', (chunk: any) => {
                  chunks.push(chunk);
                });
                
                req.on('end', async () => {
                  try {
                    const body = Buffer.concat(chunks).toString();
                    console.log('Received request body:', body);
                    
                    const data = JSON.parse(body);
                    console.log('Parsed data:', data);
                    
                    // Basic validation
                    if (!data.message || typeof data.message !== 'string') {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Message is required and must be a string' }));
                      return;
                    }
                    
                    if (data.message.length > 2000) {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ error: 'Message too long. Maximum 2000 characters allowed.' }));
                      return;
                    }
                    
                    // Prepare data for n8n - match the original format
                    const n8nData = {
                      message: data.message,
                      sessionId: data.sessionId || 'anonymous',
                      sender: data.sender || 'user',
                      createdAt: data.createdAt || new Date().toISOString()
                    };
                    
                    console.log('Forwarding to n8n:', n8nData);
                    
                    // Forward to n8n webhook
                    const n8nResponse = await fetch('https://n8n.srv970139.hstgr.cloud/webhook/7cc20139-28b4-4798-aa0c-84752dce1db6/chat', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'FlameAI-Proxy/1.0'
                      },
                      body: JSON.stringify(n8nData)
                    });
                    
                    console.log('n8n response status:', n8nResponse.status);
                    
                    if (n8nResponse.ok) {
                      const responseData = await n8nResponse.json();
                      console.log('n8n response data:', responseData);
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify(responseData));
                    } else {
                      const errorText = await n8nResponse.text();
                      console.error('n8n error response:', errorText);
                      res.writeHead(n8nResponse.status, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({
                        error: 'Chat service temporarily unavailable',
                        details: errorText
                      }));
                    }
                  } catch (parseError) {
                    console.error('Request processing error:', parseError);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
                  }
                });
                
                req.on('error', (error: any) => {
                  console.error('Request error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Request processing failed' }));
                });
                
                return;
              }
              
              // Other methods
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
            } catch (error) {
              console.error('API route error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
              }));
            }
          } else {
            next();
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020', // Updated to ES2020 which supports BigInt
    sourcemap: true,  // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          transformers: ['@huggingface/transformers']
        }
      }
    },
    chunkSizeWarningLimit: 2000, // Increase chunk size limit for ML models
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'] // Prevent optimization of transformers.js
  }
}));
