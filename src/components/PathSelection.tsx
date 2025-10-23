import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Zap, Wrench } from 'lucide-react';

const PathSelection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="paths" className="py-20 subtle-gradient">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 reveal">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
            Choose Your Path
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you need custom business solutions or free productivity tools, 
            we have the perfect AI automation path for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Custom Solutions Path */}
          <Card className="path-card group relative overflow-hidden reveal">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mr-4">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary">Custom Solutions</h3>
                  <p className="text-muted-foreground">For growing businesses</p>
                </div>
              </div>

              <p className="text-lg text-foreground mb-6 leading-relaxed">
                Tailored AI automation solutions designed specifically for your business needs. 
                From lead response systems to revenue recovery automation.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Automated lead response & nurturing
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Revenue recovery campaigns
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Customer communication workflows
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Integration with existing systems
                </div>
              </div>

              <div className="bg-accent/10 rounded-lg p-4 mb-6">
                <div className="font-display text-2xl font-bold text-accent">$1K - $10K</div>
                <div className="text-sm text-muted-foreground">Investment range</div>
              </div>

              <Button 
                onClick={() => scrollToSection('contact')}
                className="btn-hero w-full group-hover:scale-105 transition-transform duration-300"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Free Tools Path */}
          <Card className="path-card group relative overflow-hidden reveal">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary">Free Tools</h3>
                  <p className="text-muted-foreground">For daily productivity</p>
                </div>
              </div>

              <p className="text-lg text-foreground mb-6 leading-relaxed">
                Access a comprehensive suite of free AI-powered tools for everyday tasks. 
                Perfect for individuals and small teams looking to boost productivity.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  File conversion & document editing
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Social media content generation
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Text analysis & summarization
                </div>
                <div className="flex items-center text-foreground">
                  <div className="w-2 h-2 rounded-full bg-accent mr-3"></div>
                  Image processing & optimization
                </div>
              </div>

              <div className="bg-secondary/20 rounded-lg p-4 mb-6">
                <div className="font-display text-2xl font-bold text-primary">Free</div>
                <div className="text-sm text-muted-foreground">Start Free, Scale as Needed</div>
              </div>

              <Button 
                onClick={() => scrollToSection('tools')}
                className="btn-secondary w-full group-hover:scale-105 transition-transform duration-300"
              >
                Try Free Tools <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PathSelection;