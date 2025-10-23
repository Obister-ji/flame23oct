import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-flame-ai.jpg';

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-accent/10 float"></div>
      <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-secondary/20 float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 rounded-full bg-primary/10 float" style={{ animationDelay: '2s' }}></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto reveal">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-accent mr-2 flame-pulse"></div>
            AI-Powered Automation Platform
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight">
            Welcome to <span className="text-accent">Flame AI</span>
          </h1>

          {/* Tagline */}
          <h2 className="font-display text-2xl md:text-3xl text-secondary-foreground mb-6">
            The World of AI Tools & AI Solutions
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Bridge the gap between everyday productivity tools and enterprise-grade business solutions. 
            From simple daily tasks to complex automation workflows, we've got you covered.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => scrollToSection('paths')}
              className="btn-hero min-w-[200px]"
            >
              Explore Solutions
            </Button>
            <Button 
              onClick={() => scrollToSection('tools')}
              className="btn-secondary min-w-[200px]"
            >
              Try Free Tools
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">1K+</div>
              <div className="text-muted-foreground">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">50+</div>
              <div className="text-muted-foreground">AI Tools</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;