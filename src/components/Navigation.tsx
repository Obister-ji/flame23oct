import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import flameLogo from '@/assets/flame-logo-new.png';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@/components/ClerkAuthWrapper';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-background/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src={flameLogo} 
              alt="Flame AI Logo" 
              className="w-12 h-12 object-contain hover:scale-105 transition-transform duration-300"
            />
            <span className="font-display text-2xl font-bold text-primary">Flame AI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-foreground hover:text-accent transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-foreground hover:text-accent transition-colors duration-200"
            >
              About
            </Link>
            <Link
              to="/agents"
              className="text-foreground hover:text-accent transition-colors duration-200"
            >
              Agents
            </Link>
            
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
                <button className="btn-nav">
                  Login
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-foreground my-1 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-card rounded-lg shadow-lg">
            <div className="flex flex-col space-y-4 px-4">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-left text-foreground hover:text-accent transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-left text-foreground hover:text-accent transition-colors duration-200"
              >
                About
              </Link>
              <Link
                to="/agents"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-left text-foreground hover:text-accent transition-colors duration-200"
              >
                Agents
              </Link>
              
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
                    className="btn-nav w-full"
                  >
                    Login
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
