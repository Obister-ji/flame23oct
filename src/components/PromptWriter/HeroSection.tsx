import React from 'react';
import { Sparkles, MessageSquare, Target, Zap } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 mb-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-primary mb-4">
          IDEA-WEAVER Prompt Writer
        </h1>
        
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          Transform your ideas into powerful, optimized prompts with AI assistance. 
          Create, refine, and perfect your prompts for better AI interactions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <MessageSquare className="w-6 h-6 text-accent mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Interactive Chat</h3>
            <p className="text-sm text-muted-foreground">Refine prompts through conversation</p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <Target className="w-6 h-6 text-accent mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Structured Input</h3>
            <p className="text-sm text-muted-foreground">Organized prompt creation framework</p>
          </div>
          
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <Zap className="w-6 h-6 text-accent mb-2" />
            <h3 className="font-semibold text-foreground mb-1">AI Optimization</h3>
            <p className="text-sm text-muted-foreground">Enhanced prompts with AI suggestions</p>
          </div>
        </div>
      </div>
    </div>
  );
}