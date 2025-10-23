import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Heart, DollarSign, Users, FileText, Share2, BarChart3, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SolutionsShowcase = () => {
  const navigate = useNavigate();
  const businessSolutions = [
    {
      icon: Building,
      title: "E-commerce Automation",
      description: "Streamline order processing, inventory management, and customer communications for online stores.",
      benefits: ["40% faster order processing", "24/7 customer support", "Inventory sync across platforms"],
      industry: "E-commerce"
    },
    {
      icon: Heart,
      title: "Healthcare Workflows",
      description: "HIPAA-compliant automation for patient scheduling, follow-ups, and administrative tasks.",
      benefits: ["Reduced no-shows by 60%", "Automated appointment reminders", "Secure patient data handling"],
      industry: "Healthcare"
    },
    {
      icon: DollarSign,
      title: "Financial Services",
      description: "Automate loan processing, client onboarding, and compliance reporting with AI precision.",
      benefits: ["50% faster loan approvals", "Automated compliance checks", "Enhanced fraud detection"],
      industry: "Finance"
    }
  ];

  const dailyTools = [
    {
      icon: FileText,
      title: "Document Suite",
      description: "Convert, edit, and optimize documents with AI-powered tools.",
      features: ["PDF conversion", "Text extraction", "Format optimization"]
    },
    {
      icon: Share2,
      title: "Social Media Generator",
      description: "Create engaging content for all your social platforms automatically.",
      features: ["Multi-platform posts", "Hashtag optimization", "Engagement analytics"]
    },
    {
      icon: BarChart3,
      title: "Data Analyzer",
      description: "Transform raw data into actionable insights with AI analysis.",
      features: ["Pattern recognition", "Automated reports", "Predictive modeling"]
    },
    {
      icon: ImageIcon,
      title: "Visual Tools",
      description: "Edit, optimize, and enhance images with professional-grade AI.",
      features: ["Background removal", "Image enhancement", "Batch processing"]
    }
  ];

  return (
    <div className="py-20">
      {/* Business Solutions */}
      <section id="solutions" className="mb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 reveal">
            <Badge className="mb-4 bg-primary/10 text-primary">Custom Solutions</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Industry-Specific AI Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Proven automation solutions tailored for your industry. Each implementation 
              is customized to your specific workflows and business requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {businessSolutions.map((solution, index) => (
              <Card key={index} className="path-card reveal">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mr-4">
                    <solution.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary">{solution.industry}</Badge>
                </div>
                
                <h3 className="font-display text-xl font-bold text-primary mb-3">
                  {solution.title}
                </h3>
                
                <p className="text-foreground mb-4 leading-relaxed">
                  {solution.description}
                </p>
                
                <div className="space-y-2">
                  {solution.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mr-2"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 reveal">
            <div className="bg-secondary/10 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="font-display text-2xl font-bold text-primary mb-4">
                Ready to Transform Your Business?
              </h3>
              <p className="text-muted-foreground mb-6">
                Schedule a free consultation to discuss your specific automation needs 
                and get a custom solution roadmap.
              </p>
              <div className="flex justify-center">
                <a 
                  href="#contact" 
                  className="btn-hero inline-flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Schedule Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section id="tools" className="subtle-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 reveal">
            <Badge className="mb-4 bg-secondary/20 text-secondary-foreground">Free Tools</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Powerful Tools for Everyone
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access professional-grade AI tools without any cost. Perfect for individuals, 
              freelancers, and small teams looking to boost productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {dailyTools.map((tool, index) => (
              <Card key={index} className="path-card hover:bg-accent/5 transition-colors duration-300 reveal">
                <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center mb-4">
                  <tool.icon className="w-5 h-5" />
                </div>
                
                <h3 className="font-display text-lg font-bold text-primary mb-2">
                  {tool.title}
                </h3>
                
                <p className="text-sm text-foreground mb-4 leading-relaxed">
                  {tool.description}
                </p>
                
                <div className="space-y-1">
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-accent mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 reveal">
            <p className="text-lg text-muted-foreground mb-6">
              All tools are free to use with optional premium features for advanced users.
            </p>
            <button
              className="btn-secondary inline-flex items-center"
              onClick={() => {
                navigate('/agents?filter=free');
              }}
            >
              Access Free Tools
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SolutionsShowcase;