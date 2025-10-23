import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CharacterCard from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, X } from 'lucide-react';
import mediamama1 from '@/assets/mediamama1.png';
import pathfindra2 from '@/assets/pathfindra2.png';
import pixwiz2 from '@/assets/pixwiz2.png';
import emailwriter from '@/assets/emailwriter.png';
import promptwriter from '@/assets/promptwriter.png';
import Taskmanagement from '@/assets/Taskmanagement.png';
import xpostwriter from '@/assets/xpostwriter-2.png';

const AIAgents = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'free' | 'limited' | 'premium'>('all');
  
  // AI Agent data based on the image
  const aiAgents = [
    {
      id: 1,
      name: 'PATHFINDRA',
      toolType: 'TOOL TYPE: IMAGE PATH CONVERTER',
      rating: 4.3,
      maxRating: 5,
      category: 'UTILITY' as const,
      tier: 'free',
      description: 'Advanced image path conversion and optimization tool for seamless file management',
      image: pathfindra2
    },
    {
      id: 2,
      name: 'MAIL-MAGE',
      toolType: 'TOOL TYPE: EMAIL MAGIC',
      rating: 4.9,
      maxRating: 5,
      category: 'UTILITY' as const,
      tier: 'premium',
      description: 'Intelligent email automation and management system with advanced filtering',
      image: emailwriter
    },
    {
      id: 3,
      name: 'IDEA-WEAVER',
      toolType: 'TOOL TYPE: PROMPT WRITER',
      rating: 4.9,
      maxRating: 5,
      category: 'ABILITY' as const,
      tier: 'limited',
      description: 'Creative prompt generation and idea synthesis for content creators',
      image: promptwriter
    },
    {
      id: 4,
      name: 'MEDIA-MAMA',
      toolType: 'TOOL TYPE: VIDEO PATH CONVERTER',
      rating: 4.9,
      maxRating: 5,
      category: 'UTILITY' as const,
      tier: 'free',
      description: 'Professional video file conversion and media optimization platform',
      image: mediamama1
    },
    {
      id: 5,
      name: 'PIX-WIZ',
      toolType: 'TOOL TYPE: BACKGROUND REMOVER',
      rating: 4.9,
      maxRating: 5,
      category: 'ABILITY' as const,
      tier: 'limited',
      description: 'Advanced background removal and image editing with precision AI',
      image: pixwiz2
    },
    {
      id: 6,
      name: 'TASK-FORCE',
      toolType: 'TOOL TYPE: TASK MANAGEMENT TOOL',
      rating: 4.9,
      maxRating: 5,
      category: 'UTILITY' as const,
      tier: 'premium',
      description: 'Intelligent task management and workflow automation system for enhanced productivity',
      image: Taskmanagement
    },
    {
      id: 7,
      name: 'X POST WRITER',
      toolType: 'TOOL TYPE: CROSS-PLATFORM PUBLISHER',
      rating: 4.9,
      maxRating: 5,
      category: 'UTILITY' as const,
      tier: 'premium',
      description: 'AI-powered social media content generator for Twitter/X and cross-platform publishing',
      image: xpostwriter
    }
  ];

  const [filteredAgents, setFilteredAgents] = useState(aiAgents);

  useEffect(() => {
    // Check for filter parameter in URL
    const filterParam = searchParams.get('filter');
    if (filterParam && ['free', 'limited', 'premium'].includes(filterParam)) {
      setSelectedCategory(filterParam as 'free' | 'limited' | 'premium');
    }
  }, [searchParams]);

  useEffect(() => {
    // Scroll reveal animation with performance optimizations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    let observer: IntersectionObserver | null = null;
    
    // Use requestAnimationFrame to batch DOM operations
    const rafId = requestAnimationFrame(() => {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Stop observing once element is revealed to improve performance
            observer?.unobserve(entry.target);
          }
        });
      }, observerOptions);

      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach((el) => observer?.observe(el));
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  // Update filtered agents whenever search or category changes
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    
    const filtered = aiAgents.filter(agent => {
      const matchesSearch = !trimmedQuery ||
                           agent.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
                           agent.toolType.toLowerCase().includes(trimmedQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || agent.tier === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    setFilteredAgents(filtered);
  }, [searchQuery, selectedCategory]);

  const scrollToContact = useCallback(() => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Reduced Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/5 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/10 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/5 float" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto reveal">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              7+ AI-Powered Agents
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight">
              Meet Our <span className="text-accent">AI Agents</span>
            </h1>

            {/* Tagline */}
            <h2 className="font-display text-2xl md:text-3xl text-secondary-foreground mb-6">
              Your Digital Workforce Awaits
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover our collection of specialized AI agents, each designed to excel at specific tasks. 
              From content creation to file conversion, find the perfect digital assistant for your needs.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search agents by name or tool type..."
                className="w-full pl-12 pr-12 py-4 bg-card/30 border border-secondary/20 rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[
                { key: 'all', label: 'All Agents', color: 'bg-primary text-primary-foreground' },
                { key: 'free', label: 'Free', color: 'bg-secondary text-secondary-foreground' },
                { key: 'limited', label: 'Limited', color: 'bg-accent/20 text-accent' },
                { key: 'premium', label: 'Premium', color: 'bg-accent text-accent-foreground' }
              ].map(({ key, label, color }) => (
                <Button
                  key={key}
                  onClick={() => setSelectedCategory(key as any)}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === key
                      ? color + ' shadow-md scale-102'
                      : 'bg-card/30 text-muted-foreground hover:bg-card/50 hover:text-foreground'
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Search Results Info */}
          {(searchQuery.trim() || selectedCategory !== 'all') && (
            <div className="mb-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim() && `Searching for "${searchQuery.trim()}"`}
                {searchQuery.trim() && selectedCategory !== 'all' && ' • '}
                {selectedCategory !== 'all' && `Filter: ${selectedCategory}`}
                {filteredAgents.length === 0 && ' • No results found'}
                {filteredAgents.length > 0 && ` • ${filteredAgents.length} agent${filteredAgents.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredAgents.map((agent, index) => (
              <div key={`${agent.id}-${searchQuery}-${selectedCategory}`} className="h-full">
                <CharacterCard
                  name={agent.name}
                  toolType={agent.toolType}
                  rating={agent.rating}
                  maxRating={agent.maxRating}
                  category={agent.category}
                  description={agent.description}
                  image={agent.image}
                  className="h-full"
                  animationDelay={`${index * 0.1}s`}
                  onClick={() => {
                    if (agent.name === 'PIX-WIZ') {
                      navigate('/background-remover');
                    } else if (agent.name === 'PATHFINDRA') {
                      navigate('/pathfindra');
                    } else if (agent.name === 'MAIL-MAGE') {
                      navigate('/email-writer');
                    } else if (agent.name === 'IDEA-WEAVER') {
                      navigate('/prompt-writer');
                    } else if (agent.name === 'TASK-FORCE') {
                      navigate('/task-force');
                    } else if (agent.name === 'MEDIA-MAMA') {
                      navigate('/media-mama');
                    } else if (agent.name === 'X POST WRITER') {
                      navigate('/xpost-writer');
                    }
                  }}
                />
              </div>
            ))}
          </div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-4">No agents found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
              <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="btn-secondary">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto reveal">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Partner with us to create custom AI agents tailored to your specific business needs, 
              or get a personalized tool built just for you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={scrollToContact} className="btn-hero min-w-[200px]">
                Partner with Us
              </Button>
              <Button onClick={scrollToContact} className="btn-secondary min-w-[200px]">
                Get a Custom Tool
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIAgents;
