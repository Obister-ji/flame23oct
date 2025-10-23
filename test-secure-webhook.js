import crypto from 'crypto';

// Configuration
const API_URL = 'http://localhost:3002/api/secure-prompt-webhook';
const API_KEY = 'secure_api_key_change_in_production';
const SECRET_KEY = 'secure_secret_key_change_in_production';

// Generate a nonce for request security
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate a signature for request authentication
function generateSignature(payload) {
  return crypto.createHmac('sha256', SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Test the secure webhook
async function testSecureWebhook() {
  console.log('🧪 Testing secure webhook integration...');
  
  const nonce = generateNonce();
  const timestamp = Date.now();
  
  // Prepare test payload
  const payload = {
    prompt: 'Write a creative story about a robot discovering emotions',
    context: 'Science fiction with emotional depth',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
    nonce
  };
  
  // Generate signature
  const signature = generateSignature({
    ...payload,
    timestamp,
    apiKey: API_KEY
  });
  
  try {
    console.log('📤 Sending test request to secure webhook...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Signature': signature,
        'X-Timestamp': timestamp.toString(),
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📥 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Secure webhook test successful!');
      console.log('Response data:', data);
      
      // Verify response signature if present
      const responseSignature = response.headers.get('x-signature');
      if (responseSignature) {
        const expectedResponseSignature = generateSignature(data);
        const isValidSignature = crypto.timingSafeEqual(
          Buffer.from(responseSignature, 'hex'),
          Buffer.from(expectedResponseSignature, 'hex')
        );
        
        if (isValidSignature) {
          console.log('✅ Response signature verified');
        } else {
          console.log('❌ Response signature verification failed');
        }
      }
    } else {
      const errorData = await response.text();
      console.error('❌ Secure webhook test failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test health endpoint
async function testHealthEndpoint() {
  console.log('🏥 Testing health endpoint...');
  
  try {
    const response = await fetch('http://localhost:3002/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check successful:', data);
    } else {
      console.error('❌ Health check failed');
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testHealthEndpoint();
  await testSecureWebhook();
}

runTests();