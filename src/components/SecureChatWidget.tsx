import React, { useEffect, useRef, useState } from 'react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  createdAt: string;
}

interface SecureChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const SecureChatWidget: React.FC<SecureChatWidgetProps> = ({ 
  isOpen = false, 
  onToggle 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! My name is Flamy, how can I assist you?",
      sender: 'bot',
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      text: inputValue.trim(),
      sender: 'user',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId,
          sender: 'user',
          createdAt: userMessage.createdAt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const botResponse = await response.json();
      
      // Handle different response formats from n8n
      let botMessageText: string;
      
      if (botResponse.text) {
        botMessageText = botResponse.text;
      } else if (botResponse.message) {
        botMessageText = botResponse.message;
      } else if (botResponse.output) {
        // n8n returns response in "output" field
        botMessageText = botResponse.output;
      } else {
        botMessageText = "I'm sorry, I didn't understand that. Could you please rephrase?";
      }
      
      const botMessage: Message = {
        text: botMessageText,
        sender: 'bot',
        createdAt: botResponse.createdAt || new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        text: error instanceof Error ? error.message : "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsMinimized(!isMinimized);
    onToggle?.();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-green-800 to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <svg 
            className="w-6 h-6 group-hover:scale-110 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold font-fraunces">Flamy - AI Assistant</h3>
        <button
          onClick={toggleChat}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Minimize chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                message.sender === 'user'
                  ? 'bg-orange-500 text-white rounded-br-none'
                  : 'bg-green-800 text-white rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-green-800 text-white rounded-2xl rounded-bl-none px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border-2 border-green-300 rounded-full focus:outline-none focus:border-green-500 bg-amber-50 text-gray-800 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};