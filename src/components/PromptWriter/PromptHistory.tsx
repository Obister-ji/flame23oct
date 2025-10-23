import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Download, 
  Trash2, 
  Star, 
  Filter,
  Calendar,
  Tag,
  Heart,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { toast } from 'sonner';
import { Prompt } from '@/pages/PromptWriter';

interface PromptHistoryProps {
  prompts: Prompt[];
  onDeletePrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function PromptHistory({ prompts, onDeletePrompt, onToggleFavorite }: PromptHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = ['All', ...Array.from(new Set(prompts.map(p => p.category)))];

  const filteredAndSortedPrompts = prompts
    .filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || prompt.isFavorite;
      
      return matchesSearch && matchesCategory && matchesFavorites;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadPrompt = (prompt: Prompt) => {
    const content = `Title: ${prompt.title}\nCategory: ${prompt.category}\nTags: ${prompt.tags.join(', ')}\nCreated: ${prompt.createdAt.toLocaleDateString()}\n\n${prompt.content}`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${prompt.title.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Prompt downloaded!');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Prompt History
        </h2>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Sort Options */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'category')}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="category">Sort by Category</option>
            </select>
            
            <button
              onClick={toggleSortOrder}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-muted transition-colors"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-2 border border-border rounded-lg transition-colors ${
              showFavoritesOnly 
                ? 'bg-accent text-accent-foreground border-accent' 
                : 'bg-background text-foreground hover:bg-muted'
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {filteredAndSortedPrompts.length} of {prompts.length} prompts
        </div>

        {/* Prompts Grid */}
        {filteredAndSortedPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No prompts found</p>
              <p className="text-sm">Try adjusting your filters or create some new prompts</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPrompts.map(prompt => (
              <div
                key={prompt.id}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-300 card-hover group"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1 line-clamp-1">
                      {prompt.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-muted rounded">{prompt.category}</span>
                      <span>{formatDate(prompt.createdAt)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onToggleFavorite(prompt.id)}
                    className="ml-2 p-1 rounded hover:bg-muted transition-colors"
                    title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${prompt.isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                  </button>
                </div>

                {/* Content Preview */}
                <div className="mb-3">
                  <p className="text-sm text-foreground line-clamp-3">
                    {prompt.content}
                  </p>
                </div>

                {/* Tags */}
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                      >
                        <Tag className="w-2 h-2" />
                        {tag}
                      </span>
                    ))}
                    {prompt.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{prompt.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => copyToClipboard(prompt.content)}
                    className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3 h-3 inline mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => downloadPrompt(prompt)}
                    className="flex-1 px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 transition-colors"
                  >
                    <Download className="w-3 h-3 inline mr-1" />
                    Download
                  </button>
                  <button
                    onClick={() => onDeletePrompt(prompt.id)}
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