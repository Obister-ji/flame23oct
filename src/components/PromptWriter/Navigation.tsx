import React, { useState } from 'react';
import { Menu, X, History, Target, User } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@/components/ClerkAuthWrapper';

interface NavigationProps {
  currentView: 'history' | 'structured';
  onViewChange: (view: 'history' | 'structured') => void;
  promptCount: number;
}

export function Navigation({ currentView, onViewChange, promptCount }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'structured', label: 'Structured', icon: Target },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img
              src="https://flame-ai.vercel.app/assets/flame-logo-new-BWbP80Ln.png"
              alt="Flame AI Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-display text-2xl font-bold text-primary">Flame AI</span>
            <span className="text-muted-foreground">| Prompt Writer</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as 'history' | 'structured')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                    currentView === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'history' && promptCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                      {promptCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Authentication */}
            <SignedIn>
              <div className="flex items-center space-x-2">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                    },
                  }}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id as 'history' | 'structured');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      currentView === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.id === 'history' && promptCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                        {promptCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Mobile Authentication */}
              <SignedIn>
                <div className="flex items-center justify-center px-2 py-1 pt-2 border-t">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                      },
                    }}
                  />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors justify-center w-full"
                  >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}