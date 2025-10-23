import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw, 
  Wand2, 
  Tag, 
  BookOpen,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Prompt, PromptTemplate } from '@/pages/PromptWriter';
import { securePromptApiService, checkSecureApiAvailability } from '@/services/securePromptApi';

interface PromptGeneratorProps {
  onPromptGenerated: (prompt: Omit<Prompt, 'id' | 'createdAt'>) => void;
  existingPrompts: Prompt[];
}

const promptTemplates: PromptTemplate[] = [
  {
    id: '1',
    name: 'Creative Writing',
    description: 'Generate creative story prompts',
    category: 'Writing',
    template: 'Write a {genre} story about {character} who {conflict}. The setting is {setting} and the tone should be {tone}.',
    variables: ['genre', 'character', 'conflict', 'setting', 'tone']
  },
  {
    id: '2',
    name: 'Marketing Copy',
    description: 'Create compelling marketing content',
    category: 'Marketing',
    template: 'Create a {type} marketing copy for {product} targeting {audience}. The key benefits are {benefits} and the call-to-action should be {cta}.',
    variables: ['type', 'product', 'audience', 'benefits', 'cta']
  },
  {
    id: '3',
    name: 'Technical Documentation',
    description: 'Generate technical documentation prompts',
    category: 'Technical',
    template: 'Write {doc_type} documentation for {feature} explaining {concept}. Include {details} and target {skill_level} developers.',
    variables: ['doc_type', 'feature', 'concept', 'details', 'skill_level']
  },
  {
    id: '4',
    name: 'Educational Content',
    description: 'Create educational prompts',
    category: 'Education',
    template: 'Explain {topic} to {audience} using {method}. Include {examples} and cover {key_points}.',
    variables: ['topic', 'audience', 'method', 'examples', 'key_points']
  },
  {
    id: '5',
    name: 'Code Generation',
    description: 'Generate programming prompts',
    category: 'Development',
    template: 'Write {language} code to {task}. The code should be {quality} and include {features}. Use {paradigm} approach.',
    variables: ['language', 'task', 'quality', 'features', 'paradigm']
  }
];

const categories = ['All', 'Writing', 'Marketing', 'Technical', 'Education', 'Development'];

export function PromptGenerator({ onPromptGenerated, existingPrompts }: PromptGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredTemplates = selectedCategory === 'All' 
    ? promptTemplates 
    : promptTemplates.filter(template => template.category === selectedCategory);

  useEffect(() => {
    if (selectedTemplate) {
      const initialVariables = selectedTemplate.variables.reduce((acc, variable) => {
        acc[variable] = '';
        return acc;
      }, {} as Record<string, string>);
      setVariables(initialVariables);
    }
  }, [selectedTemplate]);

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({ ...prev, [variable]: value }));
  };

  const generatePromptFromTemplate = () => {
    if (!selectedTemplate) return;
    
    let prompt = selectedTemplate.template;
    selectedTemplate.variables.forEach(variable => {
      prompt = prompt.replace(`{${variable}}`, variables[variable] || `[${variable}]`);
    });
    
    setGeneratedPrompt(prompt);
  };

  const generateAIPrompt = async () => {
    let promptText: string;
    
    if (selectedTemplate) {
      generatePromptFromTemplate();
      promptText = generatedPrompt || customPrompt;
    } else {
      promptText = customPrompt;
    }
    
    if (!promptText.trim()) {
      toast.error('Please enter a prompt or select a template');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use n8n webhook for AI generation
      const response = await securePromptApiService.generateOptimizedPrompt({
        prompt: promptText,
        context: selectedTemplate?.description,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      });

      if (response.success && response.data) {
        const optimizedPrompt = response.data.optimizedPrompt || response.data.prompt || response.data.output || 'Prompt optimization completed';
        const suggestions = response.data.suggestions || [];
        const improvements = response.data.improvements || [];
        
        let enhancedPrompt = `Optimized AI Prompt:\n\n${optimizedPrompt}`;
        
        if (suggestions.length > 0) {
          enhancedPrompt += `\n\n💡 AI Suggestions:\n${suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}`;
        }
        
        if (improvements.length > 0) {
          enhancedPrompt += `\n\n🔧 Improvements Applied:\n${improvements.map((improvement, index) => `${index + 1}. ${improvement}`).join('\n')}`;
        }
        
        setGeneratedPrompt(enhancedPrompt);
        toast.success('Prompt optimized with AI via n8n!');
      } else {
        throw new Error(response.error || 'Failed to generate prompt via n8n webhook');
      }
    } catch (error) {
      console.error('Prompt generation error:', error);
      toast.error(`Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your n8n webhook configuration.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadPrompt = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedPrompt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `prompt-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Prompt downloaded!');
  };

  const savePrompt = () => {
    if (!generatedPrompt.trim() || !title.trim()) {
      toast.error('Please generate a prompt and add a title');
      return;
    }

    onPromptGenerated({
      title,
      content: generatedPrompt,
      category: selectedTemplate?.category || 'Custom',
      tags,
      isFavorite: false
    });

    // Reset form
    setTitle('');
    setTags([]);
    setGeneratedPrompt('');
    setCustomPrompt('');
    setSelectedTemplate(null);
    setVariables({});
    
    toast.success('Prompt saved to history!');
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
      {/* Template Selection */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          <Wand2 className="w-6 h-6" />
          Prompt Generator
        </h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                selectedTemplate?.id === template.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <h3 className="font-semibold text-primary mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-accent" />
                <span className="text-xs text-accent">{template.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Prompt Input */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Or create a custom prompt:</span>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt here..."
              className="mt-2 w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
            />
          </label>
        </div>
      </div>

      {/* Template Variables */}
      {selectedTemplate && (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-slide-up">
          <h3 className="text-xl font-semibold text-primary mb-4">Template Variables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedTemplate.variables.map(variable => (
              <div key={variable} className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={variables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  placeholder={`Enter ${variable}...`}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            ))}
          </div>
          
          <button
            onClick={generatePromptFromTemplate}
            className="mt-4 btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Preview Template
          </button>
        </div>
      )}

      {/* Generated Prompt */}
      {(generatedPrompt || customPrompt) && (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-primary">Generated Prompt</h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generatedPrompt || customPrompt)}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={downloadPrompt}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                title="Download prompt"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="prompt-text relative group">
            <pre className="whitespace-pre-wrap text-sm">
              {generatedPrompt || customPrompt}
            </pre>
            <button
              onClick={() => copyToClipboard(generatedPrompt || customPrompt)}
              className="copy-btn"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateAIPrompt}
          disabled={isGenerating || (!customPrompt.trim() && !selectedTemplate)}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Prompt
            </>
          )}
        </button>
      </div>

      {/* Save Prompt Section */}
      {generatedPrompt && (
        <div className="bg-card rounded-lg p-6 shadow-sm border border-border animate-slide-up">
          <h3 className="text-xl font-semibold text-primary mb-4">Save Prompt</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                  className="flex-1 p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-accent-foreground/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={savePrompt}
              disabled={!title.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Save to History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}