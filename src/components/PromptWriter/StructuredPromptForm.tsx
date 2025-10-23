import React, { useState, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  RefreshCw,
  Save,
  Trash2,
  Download,
  Sparkles,
  Target,
  FileText,
  Cpu,
  Globe,
  Building,
  Keyboard,
  Command,
  Lightbulb,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage } from './PromptChat';
import { securePromptApiService } from '@/services/securePromptApi';

export interface StructuredPromptData {
  taskDescription: string;
  useCaseCategory: string;
  desiredOutputFormat?: string; // Made optional since it's not shown in UI
  targetAIModel: string;
  contextBackground: string;
  industryDomain: string;
}

interface StructuredPromptFormProps {
  // No props needed
}

const useCaseCategories = [
  'Content Creation',
  'Data Analysis',
  'Customer Support',
  'Code Generation',
  'Research',
  'Marketing',
  'Education',
  'Business Strategy',
  'Creative Writing',
  'Technical Documentation',
  'Other'
];


const aiModels = [
  'GPT-4',
  'GPT-3.5',
  'Claude',
  'Gemini',
  'LLaMA',
  'Other'
];

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media',
  'Government',
  'Non-Profit',
  'Other'
];

const outputFormats = [
  { value: 'paragraph', label: 'Paragraph', description: 'Standard paragraph format' },
  { value: 'bullets', label: 'Bullet Points', description: 'Structured bullet points' },
  { value: 'numbered', label: 'Numbered List', description: 'Sequential numbered list' },
  { value: 'table', label: 'Table', description: 'Tabular data format' },
  { value: 'json', label: 'JSON', description: 'Structured data format' },
  { value: 'markdown', label: 'Markdown', description: 'Markdown formatted text' },
  { value: 'code', label: 'Code', description: 'Programming code format' },
  { value: 'email', label: 'Email', description: 'Email message format' },
  { value: 'outline', label: 'Outline', description: 'Hierarchical outline' },
  { value: 'qa', label: 'Q&A', description: 'Question and answer format' }
];

const promptTemplates = [
  {
    id: 'blog-post',
    name: 'Blog Post Writer',
    category: 'Content Creation',
    description: 'Create engaging blog posts on any topic',
    template: {
      taskDescription: 'Write a comprehensive blog post about [TOPIC] that includes engaging introduction, key points, practical examples, and a strong conclusion.',
      useCaseCategory: 'Content Creation',
      desiredOutputFormat: 'markdown',
      targetAIModel: 'GPT-4',
      contextBackground: 'The target audience is [AUDIENCE] and the tone should be [TONE]. Include SEO keywords naturally.',
      industryDomain: 'Marketing'
    }
  },
  {
    id: 'code-review',
    name: 'Code Review Assistant',
    category: 'Code Generation',
    description: 'Generate comprehensive code reviews',
    template: {
      taskDescription: 'Review the following code and provide detailed feedback on code quality, performance, security, and best practices.',
      useCaseCategory: 'Code Generation',
      desiredOutputFormat: 'bullets',
      targetAIModel: 'GPT-4',
      contextBackground: 'The code is written in [LANGUAGE] and follows [FRAMEWORK/STYLE] patterns.',
      industryDomain: 'Technology'
    }
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    category: 'Marketing',
    description: 'Create persuasive marketing emails',
    template: {
      taskDescription: 'Write a compelling marketing email to promote [PRODUCT/SERVICE] to [TARGET_AUDIENCE].',
      useCaseCategory: 'Marketing',
      desiredOutputFormat: 'email',
      targetAIModel: 'GPT-4',
      contextBackground: 'Key selling points include [BENEFITS]. The goal is to [CALL_TO_ACTION].',
      industryDomain: 'Marketing'
    }
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis Report',
    category: 'Data Analysis',
    description: 'Generate comprehensive data analysis reports',
    template: {
      taskDescription: 'Analyze the provided dataset and create a comprehensive report including key findings, trends, and recommendations.',
      useCaseCategory: 'Data Analysis',
      desiredOutputFormat: 'table',
      targetAIModel: 'GPT-4',
      contextBackground: 'The data represents [DATA_TYPE] collected over [TIME_PERIOD] for [PURPOSE].',
      industryDomain: 'Finance'
    }
  },
  {
    id: 'customer-support',
    name: 'Customer Support Response',
    category: 'Customer Support',
    description: 'Generate helpful customer support responses',
    template: {
      taskDescription: 'Write a professional and empathetic response to a customer inquiry about [ISSUE].',
      useCaseCategory: 'Customer Support',
      desiredOutputFormat: 'paragraph',
      targetAIModel: 'GPT-3.5',
      contextBackground: 'Customer is [CUSTOMER_TYPE] and has [PREVIOUS_INTERACTION]. Our company policy is [POLICY].',
      industryDomain: 'Retail'
    }
  },
  {
    id: 'research-summary',
    name: 'Research Summary',
    category: 'Research',
    description: 'Summarize research papers and articles',
    template: {
      taskDescription: 'Summarize the research paper/article about [TOPIC] including key findings, methodology, and implications.',
      useCaseCategory: 'Research',
      desiredOutputFormat: 'outline',
      targetAIModel: 'GPT-4',
      contextBackground: 'The research focuses on [RESEARCH_AREA] and was published in [JOURNAL/SOURCE].',
      industryDomain: 'Education'
    }
  }
];

export function StructuredPromptForm({}: StructuredPromptFormProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState<StructuredPromptData>({
    taskDescription: '',
    useCaseCategory: '',
    desiredOutputFormat: 'paragraph', // Set default value but don't show in UI
    targetAIModel: 'GPT-4',
    contextBackground: '',
    industryDomain: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-save functionality
  React.useEffect(() => {
    const hasContent = formData.taskDescription.trim() ||
                     formData.contextBackground.trim() ||
                     formData.useCaseCategory !== '';

    if (hasContent) {
      const timer = setTimeout(() => {
        saveToLocalStorage();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [formData]);

  const saveToLocalStorage = () => {
    setIsAutoSaving(true);
    try {
      const dataToSave = {
        formData,
        messages,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('promptWriter_autosave', JSON.stringify(dataToSave));
      setLastSaved(new Date());
      toast.success('Auto-saved', {
        duration: 2000,
        description: 'Your work has been saved automatically'
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('promptWriter_autosave');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const savedDate = new Date(parsed.timestamp);
        const hoursDiff = (new Date().getTime() - savedDate.getTime()) / (1000 * 60 * 60);

        // Only restore if saved within last 24 hours
        if (hoursDiff < 24) {
          setFormData(parsed.formData);
          setMessages(parsed.messages || []);
          setLastSaved(savedDate);
          toast.info('Previous work restored', {
            duration: 3000,
            description: `Restored from ${savedDate.toLocaleString()}`
          });
        }
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  };

  // Load saved data on component mount
  React.useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading && formData.taskDescription.trim()) {
          handleSubmit();
        }
      }

      // Ctrl/Cmd + S to save manually
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveToLocalStorage();
      }

      // Ctrl/Cmd + K to clear
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        clearForm();
      }

      // Escape to close save dialog
      if (event.key === 'Escape' && showSaveDialog) {
        setShowSaveDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isLoading, showSaveDialog, messages]);

  const handleInputChange = (field: keyof StructuredPromptData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyTemplate = (template: typeof promptTemplates[0]) => {
    setFormData(template.template);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied`, {
      description: 'Fill in the bracketed placeholders with your specific information'
    });
  };

  const generatePromptFromStructuredData = (data: StructuredPromptData): string => {
    let prompt = `Task: ${data.taskDescription}\n\n`;
    
    if (data.useCaseCategory) {
      prompt += `Use Case Category: ${data.useCaseCategory}\n`;
    }
    
    if (data.contextBackground) {
      prompt += `Context/Background: ${data.contextBackground}\n`;
    }
    
    if (data.industryDomain) {
      prompt += `Industry/Domain: ${data.industryDomain}\n`;
    }
    
    prompt += `\nPlease provide the response in ${data.desiredOutputFormat || 'paragraph'} format`;
    
    if (data.targetAIModel) {
      prompt += ` (optimized for ${data.targetAIModel})`;
    }
    
    prompt += '.';
    
    return prompt;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.taskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    const generatedPrompt = generatePromptFromStructuredData(formData);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: generatedPrompt,
      timestamp: new Date(),
      structuredData: formData
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use the n8n webhook service for structured prompt processing
      const response = await securePromptApiService.submitStructuredPrompt({
        taskDescription: formData.taskDescription,
        useCaseCategory: formData.useCaseCategory,
        desiredOutputFormat: formData.desiredOutputFormat,
        targetModel: formData.targetAIModel,
        contextBackground: formData.contextBackground,
        industryDomain: formData.industryDomain
      });

      if (response.success && response.data) {
        const content = response.data.optimizedPrompt || response.data.output || response.data.message || response.data.prompt || 'I\'ve processed your structured prompt request.';
        console.log('Extracted content from n8n structured webhook:', content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          isOptimized: true
        };
        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Structured prompt optimized via n8n webhook!');
      } else {
        toast.error(response.error || 'Failed to process structured prompt via n8n. Please try again.');
        console.error('n8n structured webhook error:', response.error);
      }
    } catch (error) {
      console.error('Error submitting structured prompt to n8n webhook:', error);
      toast.error(`Failed to connect to n8n structured webhook: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your configuration.`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (prompt: string): string => {
    return `Here's your optimized prompt based on the structured inputs:\n\n**Optimized Prompt:**\n${prompt}\n\n**💡 Suggestions for Improvement:**\n• Consider adding more specific constraints\n• Include examples of desired output\n• Specify the tone and style\n• Define the target audience more clearly\n• Add success criteria for evaluation`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const clearForm = () => {
    setFormData({
      taskDescription: '',
      useCaseCategory: '',
      desiredOutputFormat: 'paragraph',
      targetAIModel: 'GPT-4',
      contextBackground: '',
      industryDomain: ''
    });
    setMessages([]);
    setLastSaved(null);

    // Clear auto-save
    try {
      localStorage.removeItem('promptWriter_autosave');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }

    toast.success('Form cleared');
  };

  const saveConversation = () => {
    if (!conversationTitle.trim()) {
      toast.error('Please enter a title for the conversation');
      return;
    }
    // Since we're not saving conversations anymore, just show a message
    setShowSaveDialog(false);
    setConversationTitle('');
    toast.success('Title noted!');
  };

  const downloadConversation = () => {
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '👤 User' : '🤖 Assistant'} - ${m.timestamp.toLocaleString()}\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structured-prompt-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation downloaded!');
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Structured Prompt Writer</h2>
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isAutoSaving ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadConversation}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Download conversation"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Save conversation"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-4 lg:border-r lg:border-border overflow-y-auto bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Structured Input
            </h3>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors text-sm"
            >
              <Wand2 className="w-3 h-3" />
              Templates
            </button>
          </div>

          {/* Templates Section */}
          {showTemplates && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Quick Start Templates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {promptTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="text-left p-3 bg-background border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground text-sm mb-1 group-hover:text-primary">
                          {template.name}
                        </h5>
                        <p className="text-xs text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                            {template.category}
                          </span>
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                            {template.template.targetAIModel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Task Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Task Description *
                </label>
                <span className={`text-xs ${formData.taskDescription.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.taskDescription.length}/500
                </span>
              </div>
              <textarea
                value={formData.taskDescription}
                onChange={(e) => handleInputChange('taskDescription', e.target.value.slice(0, 500))}
                placeholder="Describe what you want the AI to do..."
                className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                  !formData.taskDescription.trim() ? 'border-muted-foreground' : 'border-border'
                }`}
                rows={3}
                maxLength={500}
              />
              {!formData.taskDescription.trim() && (
                <p className="text-xs text-destructive mt-1">Task description is required</p>
              )}
            </div>

            {/* Use Case Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Use Case Category
              </label>
              <select
                value={formData.useCaseCategory}
                onChange={(e) => handleInputChange('useCaseCategory', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a category</option>
                {useCaseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Desired Output Format */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Desired Output Format
              </label>
              <select
                value={formData.desiredOutputFormat}
                onChange={(e) => handleInputChange('desiredOutputFormat', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {outputFormats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label} - {format.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Target AI Model */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Target AI Model
              </label>
              <select
                value={formData.targetAIModel}
                onChange={(e) => handleInputChange('targetAIModel', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {aiModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Context/Background */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Context/Background
                </label>
                <span className={`text-xs ${formData.contextBackground.length > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formData.contextBackground.length}/1000
                </span>
              </div>
              <textarea
                value={formData.contextBackground}
                onChange={(e) => handleInputChange('contextBackground', e.target.value.slice(0, 1000))}
                placeholder="Provide any relevant context or background information..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={3}
                maxLength={1000}
              />
            </div>

            {/* Industry/Domain */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Industry/Domain
              </label>
              <select
                value={formData.industryDomain}
                onChange={(e) => handleInputChange('industryDomain', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="bg-muted/50 rounded-lg p-3 border border-muted">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Keyboard Shortcuts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-muted-foreground">Ctrl+Enter</kbd>
                  <span className="text-muted-foreground">Generate Prompt</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-muted-foreground">Ctrl+S</kbd>
                  <span className="text-muted-foreground">Save Now</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-muted-foreground">Ctrl+K</kbd>
                  <span className="text-muted-foreground">Clear Form</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border text-muted-foreground">Esc</kbd>
                  <span className="text-muted-foreground">Close Dialog</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !formData.taskDescription.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Prompt
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded border">
                      Ctrl+Enter
                    </kbd>
                  </>
                )}
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary opacity-70" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Ready to Create Prompts</h3>
                <p className="mb-6">Fill in the structured fields on the left and click Generate to start</p>

                <div className="bg-muted/50 rounded-lg p-4 text-sm max-w-md mx-auto">
                  <h4 className="font-medium text-foreground mb-3">Quick Tips:</h4>
                  <ul className="text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      Be specific in your task description for better results
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      Provide context to help AI understand the background
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      Choose the right output format for your needs
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      Use <kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+Enter</kbd> to generate quickly
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.isOptimized && (
                        <div className="mt-2 text-xs opacity-70">
                          {message.role === 'assistant' && '✨ AI Optimized'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="p-1 rounded hover:bg-muted/50 transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">AI is processing your request...</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-muted-foreground/20 rounded animate-pulse"></div>
                      <div className="h-2 bg-muted-foreground/20 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-2 bg-muted-foreground/20 rounded w-3/5 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Conversation</h3>
            <input
              type="text"
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
              placeholder="Enter conversation title..."
              className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConversation}
                disabled={!conversationTitle.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}