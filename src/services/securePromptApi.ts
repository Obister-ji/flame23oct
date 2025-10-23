import axios from 'axios';
import { toast } from 'sonner';

// n8n webhook configuration for prompt optimization
// Using the correct Prompt Writer webhook URL
const N8N_PROMPT_WEBHOOK_URL = import.meta.env.VITE_N8N_PROMPT_WEBHOOK_URL || 'https://n8n.srv970139.hstgr.cloud/webhook/0dcd9b71-bf7f-4519-86bd-20304f600c4c';
const N8N_STRUCTURED_WEBHOOK_URL = import.meta.env.VITE_N8N_STRUCTURED_WEBHOOK_URL || 'https://n8n.srv970139.hstgr.cloud/webhook/0dcd9b71-bf7f-4519-86bd-20304f600c4c';
const API_KEY = import.meta.env.VITE_N8N_API_KEY || 'n8n_api_key_change_in_production';
const SECRET_KEY = import.meta.env.VITE_N8N_SECRET_KEY || 'n8n_secret_key_change_in_production';

export interface PromptGenerationRequest {
  prompt: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationHistory?: any[];
}

export interface StructuredPromptRequest {
  taskDescription: string;
  useCaseCategory?: string;
  desiredOutputFormat?: string;
  targetModel?: string;
  contextBackground?: string;
  industryDomain?: string;
}

export interface PromptGenerationResponse {
  success: boolean;
  data?: {
    optimizedPrompt?: string;
    output?: string;
    message?: string;
    prompt?: string;
    suggestions?: string[];
    improvements?: string[];
  };
  error?: string;
}

class SecureApiService {
  private promptWebhookURL = N8N_PROMPT_WEBHOOK_URL;
  private structuredWebhookURL = N8N_STRUCTURED_WEBHOOK_URL;
  private apiKey = API_KEY;
  private secretKey = SECRET_KEY;

  // Generate a nonce for request security
  private generateNonce(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate a signature for request authentication
  private async generateSignature(payload: any): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate a UUID for request tracking
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Timing safe comparison for signature verification
  private async timingSafeEqual(a: string, b: string): Promise<boolean> {
    if (a.length !== b.length) {
      return false;
    }
    
    const encoder = new TextEncoder();
    const dataA = encoder.encode(a);
    const dataB = encoder.encode(b);
    
    let result = 0;
    for (let i = 0; i < dataA.length; i++) {
      result |= dataA[i] ^ dataB[i];
    }
    
    return result === 0;
  }

  // Make a simple API request to n8n webhook with separate fields
  private async makeSimpleRequest(webhookURL: string, request: PromptGenerationRequest): Promise<any> {
    // Prepare payload with separate fields as n8n expects
    const payload = {
      prompt: request.prompt,
      context: request.context || '',
      model: request.model || 'gpt-4',
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || 1000
    };
    
    console.log('Sending to n8n webhook with separate fields:', payload);
    
    // Make the request with simple headers
    const response = await axios.post(webhookURL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlameAI-PromptOptimizer/1.0'
      },
      timeout: 30000
    });
    
    console.log('n8n webhook response:', response.data);
    
    return response.data;
  }

  async generateOptimizedPrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    try {
      console.log('🔐 Making prompt optimization request to n8n webhook with separate fields');
      
      const response = await this.makeSimpleRequest(this.promptWebhookURL, request);
      
      // Handle different response formats from n8n
      if (response && (response.output || response.optimizedPrompt || response.data)) {
        console.log('✅ n8n prompt optimization successful');
        const optimizedPrompt = response.output || response.optimizedPrompt || response.data || response.message || 'Prompt optimization completed';
        
        return {
          success: true,
          data: {
            optimizedPrompt: optimizedPrompt,
            output: optimizedPrompt,
            message: optimizedPrompt,
            prompt: optimizedPrompt,
            suggestions: response.suggestions || [],
            improvements: response.improvements || []
          }
        };
      } else {
        console.error('❌ n8n prompt optimization failed - unexpected response format:', response);
        return {
          success: false,
          error: 'Failed to optimize prompt via n8n webhook - unexpected response format'
        };
      }
    } catch (error) {
      console.error('🔒 n8n Webhook Error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.error('❌ Network error - n8n webhook unreachable');
          return {
            success: false,
            error: 'n8n webhook service is currently unavailable. Please check your network connection.'
          };
        }
        
        const errorMessage = error.response?.data?.error || error.message;
        return {
          success: false,
          error: `n8n webhook error: ${errorMessage}`
        };
      }
      
      return {
        success: false,
        error: 'Unknown n8n webhook error occurred'
      };
    }
  }

  async submitStructuredPrompt(request: StructuredPromptRequest): Promise<PromptGenerationResponse> {
    try {
      console.log('🔐 Making structured prompt request to n8n webhook with separate fields');
      
      // Prepare payload with the exact field names n8n expects
      const payload = {
        "Task Description": request.taskDescription,
        "Use Case Category": request.useCaseCategory || '',
        "Target AI Model": request.targetModel || 'GPT-4',
        "Context/Background": request.contextBackground || '',
        "Industry/Domain": request.industryDomain || ''
      };
      
      console.log('Sending structured prompt to n8n webhook with exact field names:', payload);
      
      // Make the request with simple headers
      const response = await axios.post(this.structuredWebhookURL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlameAI-StructuredPrompt/1.0'
        },
        timeout: 30000
      });
      
      console.log('n8n structured webhook response:', response.data);
      
      // Handle different response formats from n8n
      if (response && response.data && (response.data.output || response.data.optimizedPrompt || response.data.data)) {
        console.log('✅ n8n structured prompt submission successful');
        const optimizedPrompt = response.data.output || response.data.optimizedPrompt || response.data.data || response.data.message || 'Structured prompt processing completed';
        
        return {
          success: true,
          data: {
            optimizedPrompt: optimizedPrompt,
            output: optimizedPrompt,
            message: optimizedPrompt,
            prompt: optimizedPrompt,
            suggestions: response.data.suggestions || [],
            improvements: response.data.improvements || []
          }
        };
      } else {
        console.error('❌ n8n structured prompt submission failed - unexpected response format:', response.data);
        return {
          success: false,
          error: 'Failed to process structured prompt via n8n webhook - unexpected response format'
        };
      }
    } catch (error) {
      console.error('🔒 n8n Structured Prompt Webhook Error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          console.error('❌ Network error - n8n structured webhook unreachable');
          return {
            success: false,
            error: 'n8n structured prompt webhook service is currently unavailable. Please check your network connection.'
          };
        }
        
        const errorMessage = error.response?.data?.error || error.message;
        return {
          success: false,
          error: `n8n structured webhook error: ${errorMessage}`
        };
      }
      
      return {
        success: false,
        error: 'Unknown n8n structured webhook error occurred'
      };
    }
  }

  // Check if the n8n webhook service is available
  async checkApiAvailability(): Promise<boolean> {
    try {
      // Make a simple test request to the n8n webhook endpoint with separate fields
      const testPayload: PromptGenerationRequest = {
        prompt: 'test',
        context: 'availability check',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 100
      };
      
      const response = await axios.post(this.promptWebhookURL, testPayload, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept any response except server errors
      });
      
      // If we get any response that isn't a server error, consider the service available
      console.log('n8n prompt webhook is accessible');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
        console.log('n8n prompt webhook is not accessible');
        return false;
      }
      // For other errors, the service is available but might have configuration issues
      console.log('n8n prompt webhook is accessible but may have configuration issues');
      return true;
    }
  }
}

// Export singleton instance
export const securePromptApiService = new SecureApiService();

// Utility function to check if the n8n webhook service is available
export async function checkSecureApiAvailability(): Promise<boolean> {
  try {
    return await securePromptApiService.checkApiAvailability();
  } catch (error) {
    console.error('Error checking n8n webhook availability:', error);
    return false;
  }
}