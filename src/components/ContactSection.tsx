import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    projectType: 'custom'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: '', email: '', company: '', message: '', projectType: 'custom' });
    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="path-card reveal">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold text-primary mb-2">
                Send us a message
              </h3>
              <p className="text-muted-foreground">
                Tell us about your project and we'll get back to you within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Company Name
                </label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-foreground mb-2">
                  I'm interested in *
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  required
                  value={formData.projectType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="custom">Custom AI Solutions ($1K-$10K)</option>
                  <option value="tools">Free Tools & Support</option>
                  <option value="consultation">Free Consultation</option>
                  <option value="partnership">Partnership Opportunities</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Project Details *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full min-h-[120px]"
                  placeholder="Tell us about your project, goals, and how we can help..."
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-hero w-full text-lg"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8 reveal">
            <Card className="path-card">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mr-4 mt-1">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-primary mb-1">Email Us</h4>
                  <p className="text-muted-foreground mb-2">Get in touch via email</p>
                  <a href="mailto:flameai.in@gmail.com" className="text-accent hover:underline">
                    flameai.in@gmail.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="path-card">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center mr-4 mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-primary mb-1">Response Time</h4>
                  <p className="text-muted-foreground mb-2">We respond quickly</p>
                  <p className="text-foreground">Within 24 hours</p>
                </div>
              </div>
            </Card>

            <Card className="path-card coral-gradient text-accent-foreground">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mr-4 mt-1">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold mb-1">Free Consultation</h4>
                  <p className="mb-2 opacity-90">
                    Book a 30-minute strategy session to discuss your automation needs.
                  </p>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    Schedule Call
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;