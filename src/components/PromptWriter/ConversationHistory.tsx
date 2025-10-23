import React, { useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Calendar,
  Copy,
  Download,
  User,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessage } from './PromptChat';

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationHistoryProps {
  conversations: SavedConversation[];
  onLoadConversation: (conversation: SavedConversation) => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationHistory({ 
  conversations, 
  onLoadConversation, 
  onDeleteConversation 
}: ConversationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedConversations = conversations
    .filter(conversation => 
      conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getLastMessage = (conversation: SavedConversation) => {
    const messages = conversation.messages;
    if (messages.length === 0) return '';
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content.length > 100 
      ? lastMessage.content.substring(0, 100) + '...' 
      : lastMessage.content;
  };

  const getMessageCount = (conversation: SavedConversation) => {
    return conversation.messages.filter(msg => msg.role === 'user').length;
  };

  const downloadConversation = (conversation: SavedConversation) => {
    const conversationText = `${conversation.title}\n${'='.repeat(50)}\n\nCreated: ${formatDate(conversation.createdAt)}\nLast Updated: ${formatDate(conversation.updatedAt)}\n\n${conversation.messages.map(m => `${m.role === 'user' ? '👤 User' : '🤖 Assistant'} - ${m.timestamp.toLocaleString()}\n${m.content}\n`).join('\n---\n\n')}`;
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation downloaded!');
  };

  const copyConversation = (conversation: SavedConversation) => {
    const conversationText = conversation.messages
      .map(m => `${m.role === 'user' ? '👤 User' : '🤖 Assistant'}:\n${m.content}`)
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(conversationText);
    toast.success('Conversation copied to clipboard!');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Conversation History
        </h2>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
            
            <button
              onClick={toggleSortOrder}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-muted transition-colors"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredAndSortedConversations.length} of {conversations.length} conversations
        </div>

        {/* Conversations Grid */}
        {filteredAndSortedConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No conversations found</p>
              <p className="text-sm">Try adjusting your search or start a new conversation</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedConversations.map(conversation => (
              <div
                key={conversation.id}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-300 card-hover group"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1 line-clamp-1">
                      {conversation.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(conversation.updatedAt)}</span>
                      <span>•</span>
                      <span>{getMessageCount(conversation)} messages</span>
                    </div>
                  </div>
                </div>

                {/* Last Message Preview */}
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getLastMessage(conversation)}
                  </p>
                </div>

                {/* Message Count Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{conversation.messages.filter(m => m.role === 'user').length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bot className="w-3 h-3" />
                    <span>{conversation.messages.filter(m => m.role === 'assistant').length}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onLoadConversation(conversation)}
                    className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => copyConversation(conversation)}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => downloadConversation(conversation)}
                    className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm hover:bg-accent/90 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}