import { Heart, Linkedin, Twitter, Github, Mail } from 'lucide-react';
import flameLogo from '@/assets/flame-logo-new.png';

const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={flameLogo} 
                alt="Flame AI Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="font-display text-2xl font-bold">Flame AI</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Bridging everyday productivity tools with enterprise-grade business solutions. 
              Transform your workflows with the power of AI automation.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://linkedin.com/company/flame-ai" 
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/flame_ai" 
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/flame-ai" 
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:flameai.in@gmail.com"
                className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold mb-4">Solutions</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToSection('solutions')}
                  className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                >
                  Custom Automation
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('tools')}
                  className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                >
                  Free Tools
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#about" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                >
                  About Us
                </a>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-primary-foreground/60 text-sm">
              © 2024 Flame AI. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a
                href="/about#privacy"
                className="text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="/about#terms"
                className="text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="/about#cookies"
                className="text-primary-foreground/60 hover:text-accent transition-colors duration-200"
              >
                Cookie Policy
              </a>
            </div>
            <div className="flex items-center text-primary-foreground/60 text-sm">
              Made by Flame AI Team
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;