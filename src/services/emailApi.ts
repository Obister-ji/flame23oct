import axios from 'axios';
import { toast } from 'sonner';
import { secureWebhookService, SecureEmailResponse } from './secureWebhookService';

// n8n webhook endpoint for email writer (fallback)
const N8N_WEBHOOK_URL = 'https://n8n.srv970139.hstgr.cloud/webhook/email-writer';

// Secure webhook endpoint
const SECURE_WEBHOOK_URL = getEnvVar('REACT_APP_SECURE_WEBHOOK_URL') || 'http://localhost:3002/api/secure-email-webhook';

// Helper function to get environment variables
function getEnvVar(name: string): string | undefined {
  if (typeof window !== 'undefined') {
    return (window as any).__ENV?.[name] || import.meta.env?.[name];
  } else {
    return (typeof process !== 'undefined') ? process.env?.[name] : undefined;
  }
}

export interface EmailGenerationRequest {
  recipientName: string;
  emailPurpose: string;
  tone: string;
  keyPoints: string;
  additionalContext?: string;
  emailLength: string;
}

export interface EmailGenerationResponse {
  success: boolean;
  data?: {
    email: string;
  };
  error?: string;
  securityMetadata?: {
    requestId: string;
    rateLimitRemaining: number;
    validationPassed: boolean;
    signatureValid: boolean;
  };
}

class ApiService {
  private baseURL = N8N_WEBHOOK_URL;
  private secureURL = SECURE_WEBHOOK_URL;
  private useSecureMode = getEnvVar('REACT_APP_USE_SECURE_WEBHOOK') === 'true';

  async generateOptimizedEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    // Use secure service if enabled
    if (this.useSecureMode) {
      return this.generateSecureEmail(request);
    }

    // Fallback to original implementation
    try {
      console.log('📤 Sending request to n8n webhook:', request);
      
      // Send request to n8n webhook
      const response = await axios.post(N8N_WEBHOOK_URL, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('📥 Response from n8n webhook:', response);
      console.log('📥 Response data:', response.data);
      
      // Handle the response structure from n8n webhook
      // The webhook returns an array with objects containing an "email" field
      let emailData;
      if (Array.isArray(response.data) && response.data.length > 0) {
        emailData = response.data[0];
      } else {
        emailData = response.data;
      }
      
      return {
        success: true,
        data: emailData
      };
    } catch (error) {
      console.error('❌ API Error:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        const errorMessage = error.response?.data?.error || error.message;
        toast.error(`API Error: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage
        };
      }
      
      toast.error('Failed to generate email. Please try again.');
      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  private async generateSecureEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    try {
      console.log('🔐 Sending secure request to webhook:', request);
      
      const secureResponse: SecureEmailResponse = await secureWebhookService.generateSecureEmail(request);
      
      if (secureResponse.success) {
        console.log('✅ Secure webhook response received:', secureResponse);
        
        // Log security metadata for monitoring
        if (secureResponse.securityMetadata) {
          console.log('🛡️ Security metadata:', secureResponse.securityMetadata);
        }
        
        return {
          success: true,
          data: secureResponse.data,
          securityMetadata: secureResponse.securityMetadata
        };
      } else {
        console.error('❌ Secure webhook error:', secureResponse.error);
        
        // Show appropriate error message based on security metadata
        if (secureResponse.securityMetadata?.rateLimitRemaining === 0) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (!secureResponse.securityMetadata?.validationPassed) {
          toast.error('Input validation failed. Please check your input and try again.');
        } else if (!secureResponse.securityMetadata?.signatureValid) {
          toast.error('Security validation failed. Please refresh the page and try again.');
        } else {
          toast.error(secureResponse.error || 'Failed to generate email. Please try again.');
        }
        
        return {
          success: false,
          error: secureResponse.error || 'Secure webhook request failed',
          securityMetadata: secureResponse.securityMetadata
        };
      }
    } catch (error) {
      console.error('❌ Secure service error:', error);
      toast.error('Secure email service unavailable. Falling back to standard mode.');
      
      // Fallback to non-secure mode on error
      this.useSecureMode = false;
      return this.generateOptimizedEmail(request);
    }
  }

  // Method to switch between secure and standard mode
  setSecureMode(enabled: boolean): void {
    this.useSecureMode = enabled;
    console.log(`🔐 Secure mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get current security status
  getSecurityStatus(): any {
    return secureWebhookService.getSecurityStatus();
  }

  // Clear security data
  clearSecurityData(): void {
    secureWebhookService.clearSecurityData();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Utility function to check if n8n webhook service is available
export async function checkN8nAvailability(): Promise<boolean> {
  try {
    // Check if the n8n webhook endpoint is accessible
    const response = await axios.get(N8N_WEBHOOK_URL, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept any response except server errors
    });
    
    // If we get any response that isn't a server error, consider it available
    return true;
  } catch (error) {
    // If it's a timeout or connection error, service is not available
    if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
      return false;
    }
    // For other errors, the service is available
    return true;
  }
}

// Utility function to check if secure webhook service is available
export async function checkSecureWebhookAvailability(): Promise<boolean> {
  try {
    const response = await axios.get(`${SECURE_WEBHOOK_URL.replace('/api/secure-email-webhook', '/api/health')}`, {
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
      return false;
    }
    return true;
  }
}