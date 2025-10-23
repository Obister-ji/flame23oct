import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Sparkles,
  Copy,
  Download,
  User,
  Mail,
  FileText,
  MessageSquare,
  Clock,
  Plus,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Email } from '@/types/email';
import { apiService } from '@/services/emailApi';
import { validateEmailInput, sanitizeHtml } from '@/services/secureWebhookService';

interface EmailGeneratorProps {
  onEmailGenerated: (email: Omit<Email, 'id' | 'createdAt'>) => void;
}

const emailPurposes = [
  'introduction',
  'follow-up',
  'proposal',
  'inquiry',
  'thank you',
  'apology',
  'request',
  'announcement',
  'invitation',
  'other'
];

const emailTones = [
  'professional',
  'friendly',
  'formal',
  'casual',
  'enthusiastic',
  'empathetic',
  'urgent',
  'diplomatic'
];

const emailLengths = [
  'short',
  'medium',
  'long'
];

export function EmailGenerator({ onEmailGenerated }: EmailGeneratorProps) {
  const { isSignedIn, user } = useUser();
  const [recipientName, setRecipientName] = useState('');
  const [emailPurpose, setEmailPurpose] = useState('');
  const [tone, setTone] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [emailLength, setEmailLength] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // Security state
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [useSecureMode, setUseSecureMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastSecurityMetadata, setLastSecurityMetadata] = useState<any>(null);
  
  // Check if user has access to security features
  const hasSecurityAccess = user?.primaryEmailAddress?.emailAddress === 'sarvaxgupta@gmail.com';

  // Initialize security status
  useEffect(() => {
    const initializeSecurity = () => {
      try {
        const status = apiService.getSecurityStatus();
        setSecurityStatus(status);
        
        // Enable secure mode if available
        const secureModeAvailable = status.configStatus.hasApiKey && status.configStatus.hasSecretKey;
        setUseSecureMode(secureModeAvailable && process.env.REACT_APP_USE_SECURE_WEBHOOK === 'true');
        
        if (secureModeAvailable) {
          console.log('🔐 Secure mode available');
        } else {
          console.log('⚠️ Secure mode not available - using standard mode');
        }
      } catch (error) {
        console.error('Error initializing security:', error);
      }
    };
    
    initializeSecurity();
    
    // Check security status every 30 seconds
    const interval = setInterval(initializeSecurity, 30000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Basic required field validation
    if (!recipientName.trim()) {
      errors.push('Recipient Name is required');
    }
    if (!emailPurpose.trim()) {
      errors.push('Email Purpose is required');
    }
    if (!tone.trim()) {
      errors.push('Tone is required');
    }
    if (!keyPoints.trim()) {
      errors.push('Key Points to Cover is required');
    }
    if (!emailLength.trim()) {
      errors.push('Email Length is required');
    }
    
    // Email validation for recipient field
    if (recipient.trim() && !validateEmailInput(recipient)) {
      errors.push('Recipient email format is invalid');
    }
    
    // Security validation for secure mode
    if (useSecureMode) {
      // Check for potentially dangerous content
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
        /vbscript:/i,
      ];
      
      const fields = [recipientName, emailPurpose, tone, keyPoints, additionalContext];
      const fieldNames = ['Recipient Name', 'Email Purpose', 'Tone', 'Key Points', 'Additional Context'];
      
      fields.forEach((field, index) => {
        if (field) {
          dangerousPatterns.forEach(pattern => {
            if (pattern.test(field)) {
              errors.push(`${fieldNames[index]} contains potentially dangerous content`);
            }
          });
        }
      });
      
      // Length validation
      if (recipientName.length > 100) {
        errors.push('Recipient name too long (max 100 characters)');
      }
      if (keyPoints.length > 5000) {
        errors.push('Key points too long (max 5000 characters)');
      }
      if (additionalContext.length > 2000) {
        errors.push('Additional context too long (max 2000 characters)');
      }
    }
    
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }
    
    return true;
  };

  const generateEmail = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setValidationErrors([]);
    
    try {
      console.log(`🔐 Generating email in ${useSecureMode ? 'secure' : 'standard'} mode`);
      
      const response = await apiService.generateOptimizedEmail({
        recipientName: useSecureMode ? sanitizeHtml(recipientName) : recipientName,
        emailPurpose: useSecureMode ? sanitizeHtml(emailPurpose) : emailPurpose,
        tone: useSecureMode ? sanitizeHtml(tone) : tone,
        keyPoints: useSecureMode ? sanitizeHtml(keyPoints) : keyPoints,
        additionalContext: additionalContext ? (useSecureMode ? sanitizeHtml(additionalContext) : additionalContext) : undefined,
        emailLength
      });

      if (response.success && response.data) {
        setGeneratedEmail(response.data.email);
        
        // Store security metadata for display
        if (response.securityMetadata) {
          setLastSecurityMetadata(response.securityMetadata);
          console.log('🛡️ Security metadata:', response.securityMetadata);
        }
        
        // Try to extract subject from the generated email
        const subjectMatch = response.data.email.match(/Subject: (.+?)(?:\n\n|$)/);
        if (subjectMatch) {
          setSubject(subjectMatch[1]);
        } else {
          // Generate a default subject based on purpose
          setSubject(`${emailPurpose.charAt(0).toUpperCase() + emailPurpose.slice(1)} Email`);
        }
        
        const successMessage = useSecureMode ?
          'Email generated securely!' :
          'Email generated successfully!';
        toast.success(successMessage);
      } else {
        throw new Error(response.error || 'Failed to generate email');
      }
    } catch (error) {
      console.error('Email generation error:', error);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadEmail = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedEmail], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `email-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Email downloaded!');
  };

  const saveEmail = () => {
    if (!generatedEmail.trim() || !subject.trim()) {
      toast.error('Please generate an email and add a subject');
      return;
    }

    // Check if user is authenticated before saving
    if (!isSignedIn || !user) {
      toast.error('Please log in to save emails to your history');
      return;
    }

    console.log('Saving email with data:', {
      subject,
      content: generatedEmail.substring(0, 100) + '...',
      recipient,
      category: emailPurpose,
      tags,
      isFavorite: false,
      userId: user.id
    });

    onEmailGenerated({
      subject,
      content: generatedEmail,
      recipient,
      category: emailPurpose,
      tags,
      isFavorite: false
    });

    // Reset form
    setSubject('');
    setRecipient('');
    setTags([]);
    setGeneratedEmail('');
    setRecipientName('');
    setEmailPurpose('');
    setTone('');
    setKeyPoints('');
    setAdditionalContext('');
    setEmailLength('');
    
    toast.success('Email saved to history!');
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Security Status Banner */}
      {securityStatus && hasSecurityAccess && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">
                  Secure Mode Active
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
            
            {showSecurityInfo && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Request signing enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Input validation active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Rate limiting enforced</span>
                    </div>
                  </div>
                </div>
                
                {lastSecurityMetadata && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <div className="font-medium mb-1">Last Request Security Info:</div>
                    <div>Request ID: {lastSecurityMetadata.requestId}</div>
                    <div>Rate Limit Remaining: {lastSecurityMetadata.rateLimitRemaining}</div>
                    <div>Validation Passed: {lastSecurityMetadata.validationPassed ? 'Yes' : 'No'}</div>
                    <div>Signature Valid: {lastSecurityMetadata.signatureValid ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Email Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Generator
            {useSecureMode && hasSecurityAccess && (
              <Badge variant="secondary" className="text-green-600">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Name */}
          <div>
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="recipientName"
                data-testid="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's name..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Email Purpose */}
          <div>
            <Label htmlFor="emailPurpose">Email Purpose *</Label>
            <Select value={emailPurpose} onValueChange={setEmailPurpose} data-testid="purpose">
              <SelectTrigger>
                <SelectValue placeholder="Select email purpose..." />
              </SelectTrigger>
              <SelectContent>
                {emailPurposes.map(purpose => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone */}
          <div>
            <Label htmlFor="tone">Tone *</Label>
            <Select value={tone} onValueChange={setTone} data-testid="tone">
              <SelectTrigger>
                <SelectValue placeholder="Select tone..." />
              </SelectTrigger>
              <SelectContent>
                {emailTones.map(toneOption => (
                  <SelectItem key={toneOption} value={toneOption}>
                    {toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Key Points to Cover */}
          <div>
            <Label htmlFor="keyPoints">Key Points to Cover *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              <Textarea
                id="keyPoints"
                data-testid="key-points"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Enter the main points to include in the email..."
                className="pl-10 min-h-[100px]"
              />
            </div>
          </div>

          {/* Additional Context */}
          <div>
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              <Textarea
                id="additionalContext"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Enter any supplementary information or special instructions..."
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          {/* Email Length */}
          <div>
            <Label htmlFor="emailLength">Email Length *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Select value={emailLength} onValueChange={setEmailLength}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select email length..." />
                </SelectTrigger>
                <SelectContent>
                  {emailLengths.map(length => (
                    <SelectItem key={length} value={length}>
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={generateEmail}
          disabled={isGenerating}
          className="flex items-center gap-2"
          size="lg"
          data-testid="generate-email-btn"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              {useSecureMode && hasSecurityAccess ? 'Generating Securely...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Email
              {useSecureMode && hasSecurityAccess && <Shield className="w-4 h-4" />}
            </>
          )}
        </Button>
      </div>

      {/* Generated Email */}
      {generatedEmail && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Generated Email</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedEmail)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadEmail}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg" data-testid="email-content">{generatedEmail}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Email Section */}
      {generatedEmail && (
        <Card>
          <CardHeader>
            <CardTitle>Save Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div>
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                />
                <Button
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={saveEmail}
              disabled={!subject.trim()}
              className="w-full"
              data-testid="save-email-btn"
            >
              Save to History
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}