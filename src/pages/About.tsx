import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import aboutBg from '@/assets/about.png';

const About = () => {
  useEffect(() => {
    // Scroll reveal animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    // Observe all elements with reveal class
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    // Handle hash scroll for policy sections
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    // Check for hash on initial load
    handleHashScroll();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden" style={{ backgroundImage: `url(${aboutBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/30 to-black/40"></div>
        
        {/* Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/10 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/20 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/10 float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-20 right-1/4 w-12 h-12 rounded-full bg-accent/20 float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-primary/5 float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-14 h-14 rounded-full bg-secondary/15 float" style={{ animationDelay: '2.5s' }}></div>
        
        <div className="container mx-auto text-center relative z-10 reveal">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm mb-6 shadow-lg">
            🔥 Our Story
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-6" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)' }}>
            About <span className="text-accent">FlameAI</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-white font-medium" style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)' }}>
            Your Personal AI Agent Workshop
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 backdrop-blur-sm">
                📅 Our Journey
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-8">
                From Developer's Frustration to <span className="text-accent">Global AI Solutions</span>
              </h2>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                FlameAI was born on September 20th, 2025, from a simple yet powerful realization.
                As a developer and content creator, I found myself constantly searching for small AI
                tools scattered across the internet—background removers, PDF editors, social media
                generators, email writers. Each task required jumping between different platforms,
                wasting precious hours that could be spent on actual creative work.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                That's when the "aha moment" struck: instead of searching everywhere for these tools,
                why not build them all in one place?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The FlameAI Story */}
      <section className="py-20 px-4 bg-gradient-to-r from-accent/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
                🚀 Our Growth
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-8">
                The <span className="text-accent">FlameAI</span> Story
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-secondary/20">
                <div className="text-3xl font-bold text-primary mb-2">6+</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-secondary/20">
                <div className="text-3xl font-bold text-accent mb-2">250+</div>
                <div className="text-sm text-muted-foreground">Businesses Helped</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center border border-secondary/20">
                <div className="text-3xl font-bold text-primary mb-2">100K+</div>
                <div className="text-sm text-muted-foreground">Tool Interactions</div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
              <p className="text-lg text-foreground/80 leading-relaxed">
                What started as a solo mission to solve my own daily pain points has grown into a
                6-person team dedicated to democratizing AI automation. Based in India but serving
                clients globally, we've already helped 250+ businesses streamline their workflows
                and processed over 100,000 tool interactions in our first month.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* What Makes Us Different */}
      <section className="py-20 px-4 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
                ✨ Our Difference
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
                What Makes <span className="text-accent">FlameAI Different</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary">
                    We Solve Small Problems
                  </h3>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  While others chase complex enterprise challenges, we focus on the daily friction
                  points that slow you down. Need to remove a background? Done in seconds. Want to
                  write the perfect email? Our AI has you covered.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
                    <span className="text-2xl">🛠️</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary">
                    Your AI Workshop
                  </h3>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  We don't just provide generic solutions. We notice, analyze, and solve your
                  specific pain points. Every tool is designed with real user struggles in mind,
                  because we've been there ourselves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto max-w-5xl">
          <div className="reveal text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 backdrop-blur-sm">
              🎯 Our Audience
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Who We <span className="text-accent">Serve</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="reveal p-8 bg-card/50 backdrop-blur-sm border border-secondary/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="font-display text-xl font-bold text-primary">
                  Growing Businesses
                </h3>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Transform your customer experience with our proven automation systems. Use our
                business card maker and email writer for professional communications, leverage our
                social media tools for consistent online presence, and scale up to custom automation
                solutions ($1K-$10K range).
              </p>
            </Card>

            <Card className="reveal p-8 bg-card/50 backdrop-blur-sm border border-secondary/20 hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <h3 className="font-display text-xl font-bold text-primary">
                  Professionals & Creators
                </h3>
              </div>
              <p className="text-foreground/80 leading-relaxed">
                Access our complete productivity suite: remove backgrounds instantly, edit PDFs
                seamlessly, generate social media content for Twitter and LinkedIn, create
                professional business cards, write compelling emails, and produce AI-powered video
                ads. Start free and scale with your success.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-primary/15 to-accent/15 overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/10 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/20 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/10 float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
              🎯 Our Purpose
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Our Mission: Making <span className="text-accent">AI Accessible</span> to Everyone
            </h2>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
              <p className="text-xl leading-relaxed text-foreground/80">
                We believe automation shouldn't require a computer science degree or a massive budget.
                Our vision extends far beyond just providing tools—we're building a future where AI
                automation is so intuitive and affordable that anyone, even a curious teenager, can
                start their own business using these technologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The FlameAI Advantage */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
                💎 Our Strengths
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
                The <span className="text-accent">FlameAI Advantage</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm border border-secondary/20">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🛠️</span>
                </div>
                <h3 className="font-bold text-xl text-primary mb-2">Complete Toolkit</h3>
                <p className="text-foreground/70">
                  8+ powerful AI tools covering design, writing, editing, and social media
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm border border-secondary/20">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="font-bold text-xl text-primary mb-2">Global Reach</h3>
                <p className="text-foreground/70">
                  Serving clients worldwide with personalized solutions
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm border border-secondary/20">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="font-bold text-xl text-primary mb-2">Rapid Innovation</h3>
                <p className="text-foreground/70">
                  Processing thousands of daily interactions with constant improvements
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm border border-secondary/20">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="font-bold text-xl text-primary mb-2">Accessible Pricing</h3>
                <p className="text-foreground/70">
                  Solutions for every budget, from free tools to enterprise automation
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 bg-card/50 backdrop-blur-sm border border-secondary/20">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="font-bold text-xl text-primary mb-2">Future-Focused</h3>
                <p className="text-foreground/70">
                  Constantly adding new tools and integrating the latest AI technologies
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Vision for Tomorrow */}
      <section className="py-20 px-4 bg-gradient-to-r from-accent/5 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 backdrop-blur-sm">
                🔮 Our Future
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
                Our Vision for <span className="text-accent">Tomorrow</span>
              </h2>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20">
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                We're building a world where powerful AI automation is as easy to use as sending a
                text message. Where small business owners have the same technological advantages as
                Fortune 500 companies. Where anyone with an idea and determination can build something
                amazing, regardless of their technical background.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Every tool we build—from our prompt writer to our AI video generator—and every problem
                we solve brings us closer to that future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-primary/15 to-accent/15 overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/10 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/20 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/10 float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-20 right-1/4 w-12 h-12 rounded-full bg-accent/20 float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-primary/5 float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-14 h-14 rounded-full bg-secondary/15 float" style={{ animationDelay: '2.5s' }}></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="reveal">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
              🚀 Get Started
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Ready to <span className="text-accent">Transform</span> Your Workflow?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explore our free AI tools or connect with us to discuss how custom automation can
              accelerate your business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="btn-hero"
              >
                Explore Free Tools
              </Button>
              <Button
                onClick={() => window.location.href = '/#contact'}
                className="btn-secondary"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Policies Section */}
      <section id="legal-policies" className="py-20 px-4 bg-gradient-to-br from-background via-primary/15 to-accent/15 overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/10 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/20 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/10 float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-20 right-1/4 w-12 h-12 rounded-full bg-accent/20 float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full bg-primary/5 float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/4 left-1/3 w-14 h-14 rounded-full bg-secondary/15 float" style={{ animationDelay: '2.5s' }}></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="reveal text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
              ⚖️ Legal Information
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Our <span className="text-accent">Policies</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparency and trust are fundamental to our relationship with you.
              Learn about our commitment to protecting your data and rights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Privacy Policy */}
            <div id="privacy" className="reveal">
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20 hover:scale-105 transition-all duration-300 h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center mb-6">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-4">
                  Privacy Policy
                </h3>
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  We are committed to protecting your personal information. This policy outlines
                  how we collect, use, store, and safeguard your data when you use our AI tools
                  and services.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Data collection and usage transparency</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Your rights and control over your data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Security measures we implement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Third-party sharing practices</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Terms of Service */}
            <div id="terms" className="reveal" style={{ animationDelay: '0.1s' }}>
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20 hover:scale-105 transition-all duration-300 h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center mb-6">
                  <span className="text-3xl">📋</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-4">
                  Terms of Service
                </h3>
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  These terms govern your use of FlameAI's tools and services. By using our
                  platform, you agree to these guidelines that ensure a fair and secure
                  environment for all users.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Acceptable use of our AI tools</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">User responsibilities and conduct</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Intellectual property rights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Service limitations and disclaimers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Cookie Policy */}
            <div id="cookies" className="reveal" style={{ animationDelay: '0.2s' }}>
              <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-secondary/20 hover:scale-105 transition-all duration-300 h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center mb-6">
                  <span className="text-3xl">🍪</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-4">
                  Cookie Policy
                </h3>
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  We use cookies and similar technologies to enhance your experience on our
                  platform. This policy explains what cookies are, how we use them, and
                  how you can manage your preferences.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Types of cookies we use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Purpose of each cookie type</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Managing your cookie preferences</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span className="text-foreground/70">Third-party cookies on our platform</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
