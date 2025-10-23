import React, { useState } from 'react';
import { Navigation } from '@/components/PromptWriter/Navigation';
import Footer from '@/components/Footer';
import { PromptHistory } from '@/components/PromptWriter/PromptHistory';
import { StructuredPromptForm } from '@/components/PromptWriter/StructuredPromptForm';
import { Toaster } from '@/components/ui/toaster';
import { SignedIn, SignedOut, SignInButton } from '@/components/ClerkAuthWrapper';
import { MockAuthProvider, MockSignedIn, MockSignedOut, MockSignInButton } from '@/components/MockAuth';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  isFavorite: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: string[];
}

const PromptWriter = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentView, setCurrentView] = useState<'history' | 'structured'>('structured');

  // Check if Clerk is configured
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
                           import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'pk_live_your_actual_publishable_key_here' &&
                           import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'pk_test_YOUR_ACTUAL_CLERK_KEY_HERE';

  const addPrompt = (prompt: Omit<Prompt, 'id' | 'createdAt'>) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const deletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(prompt => prompt.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setPrompts(prev =>
      prev.map(prompt =>
        prompt.id === id
          ? { ...prompt, isFavorite: !prompt.isFavorite }
          : prompt
      )
    );
  };

  // Login protection wrapper
  const ProtectedContent = () => (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        promptCount={prompts.length}
      />

      <main className="container mx-auto px-4 pt-20 pb-8 flex-1">
        {currentView === 'history' ? (
          <PromptHistory
            prompts={prompts}
            onDeletePrompt={deletePrompt}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="h-full">
            <StructuredPromptForm />
          </div>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );

  // Login required message component
  const LoginRequired = () => (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Login Required</h1>
            <p className="text-muted-foreground text-lg mb-2">
              Please sign in to access the Prompt Writer tool
            </p>
            <p className="text-muted-foreground">
              Create, optimize, and manage your AI prompts with our advanced tools
            </p>
          </div>

          <div className="space-y-4">
            {isClerkConfigured ? (
              <SignInButton mode="modal">
                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg rounded-md px-6 py-3 transition-colors">
                  Sign In to Continue
                </button>
              </SignInButton>
            ) : (
              <MockAuthProvider>
                <MockSignInButton
                  mode="modal"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg rounded-md px-6 py-3 transition-colors"
                >
                  Sign In to Continue
                </MockSignInButton>
              </MockAuthProvider>
            )}
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Why sign in?</h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• Save and organize your prompts</li>
              <li>• Access prompt history</li>
              <li>• Use AI-powered optimization</li>
              <li>• Sync across devices</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );

  return (
    <>
      {isClerkConfigured ? (
        <>
          <SignedIn>
            <ProtectedContent />
          </SignedIn>
          <SignedOut>
            <LoginRequired />
          </SignedOut>
        </>
      ) : (
        <MockAuthProvider>
          <MockSignedIn>
            <ProtectedContent />
          </MockSignedIn>
          <MockSignedOut>
            <LoginRequired />
          </MockSignedOut>
        </MockAuthProvider>
      )}
    </>
  );

};

export default PromptWriter;