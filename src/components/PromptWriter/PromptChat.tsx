import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Copy,
  RefreshCw,
  Save,
  Trash2,
  Download,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { securePromptApiService } from '@/services/securePromptApi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isOptimized?: boolean;
  structuredData?: any;
}

interface PromptChatProps {
  onConversationSave?: (messages: ChatMessage[], title: string) => void;
}

export function PromptChat({ onConversationSave }: PromptChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the n8n webhook service to optimize the prompt
      const response = await securePromptApiService.generateOptimizedPrompt({
        prompt: inputMessage,
        conversationHistory: messages.slice(-5), // Send last 5 messages for context
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      });

      if (response.success && response.data) {
        const content = response.data.optimizedPrompt || response.data.output || response.data.message || response.data.prompt || 'I\'ve optimized your prompt based on our conversation.';
        console.log('Extracted content from n8n webhook:', content);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          isOptimized: true
        };
        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Prompt optimized via n8n webhook!');
      } else {
        toast.error(response.error || 'Failed to optimize prompt via n8n. Please try again.');
        console.error('n8n webhook error:', response.error);
      }
    } catch (error) {
      console.error('Error sending message to n8n webhook:', error);
      toast.error(`Failed to connect to n8n webhook: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your configuration.`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (prompt: string): string => {
    const suggestions = [
      "Consider adding specific examples to clarify your request",
      "Include constraints on length or format for better results",
      "Specify the desired tone and style for the response",
      "Add context about your intended audience",
      "Define success criteria for the AI response"
    ];

    const improvements = [
      "Enhanced prompt structure for better AI comprehension",
      "Added specific context and background information",
      "Improved clarity with more precise language",
      "Included output format guidelines",
      "Added relevant constraints and boundaries"
    ];

    const randomSuggestions = suggestions.sort(() => Math.random() - 0.5).slice(0, 3);
    const randomImprovements = improvements.sort(() => Math.random() - 0.5).slice(0, 3);

    return `Here's an optimized version of your prompt:\n\n**Optimized Prompt:**\n${prompt}\n\n**💡 Suggestions:**\n${randomSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**🔧 Improvements Applied:**\n${randomImprovements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const regenerateResponse = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0 && messages[messageIndex - 1].role === 'user') {
      const userMessage = messages[messageIndex - 1];
      setMessages(prev => prev.slice(0, messageIndex));
      setInputMessage(userMessage.content);
      inputRef.current?.focus();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationTitle('');
    toast.success('Conversation cleared!');
  };

  const saveConversation = () => {
    if (!conversationTitle.trim()) {
      toast.error('Please enter a title for the conversation');
      return;
    }
    onConversationSave?.(messages, conversationTitle);
    setShowSaveDialog(false);
    setConversationTitle('');
    toast.success('Conversation saved!');
  };

  const downloadConversation = () => {
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '👤 User' : '🤖 Assistant'} - ${m.timestamp.toLocaleString()}\n${m.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-conversation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation downloaded!');
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Prompt Writer Chat</h2>
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
              onClick={clearConversation}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation to refine your prompts</p>
            <p className="text-sm mt-2">Share your initial prompt and I'll help you improve it</p>
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
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => regenerateResponse(message.id)}
                      className="p-1 rounded hover:bg-muted/50 transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
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
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4 rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your prompt or ask for improvements..."
            className="flex-1 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            <Send className="w-4 h-4" />
          </button>
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