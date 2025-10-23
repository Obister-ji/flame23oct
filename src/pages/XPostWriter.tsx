import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ArrowLeft, Copy, Twitter, Shield, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { xpostWebhookService } from '@/services/xpostWebhookService';
import xpostwriter from '@/assets/xpostwriter-2.png';

// Security configuration reference
const SECURITY_CONFIG = {
  RATE_LIMIT_MAX_REQUESTS: 15,
};

interface XPostData {
  topic: string;
  cta: string;
  audience: string;
  mediaDescription: string;
  hashtags: string;
  tone: string;
  length: string;
}

interface GeneratedPost {
  content: string;
  hashtags: string[];
  cta: string;
  timestamp: Date;
}

const XPostWriter = () => {
  const { isSignedIn, user } = useUser();
  const [currentView, setCurrentView] = useState<'generator' | 'history' | 'security'>('generator');
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [formData, setFormData] = useState<XPostData>({
    topic: '',
    cta: '',
    audience: '',
    mediaDescription: '',
    hashtags: '',
    tone: 'professional',
    length: 'medium'
  });

  // Check if user has access to security features
  const hasSecurityAccess = user?.primaryEmailAddress?.emailAddress === 'sarvaxgupta@gmail.com';

  const handleInputChange = (field: keyof XPostData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields = ['topic', 'audience', 'tone', 'length'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof XPostData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const generateSecurePost = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const result = await xpostWebhookService.generateSecurePost({
        topic: formData.topic,
        cta: formData.cta || 'Engage with this post',
        audience: formData.audience,
        mediaDescription: formData.mediaDescription || '',
        hashtags: formData.hashtags || '',
        tone: formData.tone,
        length: formData.length,
      });

      if (result.success && result.data) {
        const newPost: GeneratedPost = {
          content: result.data.content,
          hashtags: result.data.hashtags,
          cta: result.data.cta,
          timestamp: new Date()
        };

        setGeneratedPosts(prev => [newPost, ...prev]);
        toast.success('X post generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate post');
      }
      
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyFullPost = (post: GeneratedPost) => {
    const fullPost = `${post.content}\n\n${post.hashtags.join(' ')}\n\n${post.cta}`;
    copyToClipboard(fullPost);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute top-32 left-10 w-32 h-32 rounded-full bg-accent/5 float"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 rounded-full bg-secondary/10 float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 rounded-full bg-primary/5 float" style={{ animationDelay: '2s' }}></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent font-medium text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              X POST WRITER
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight">
              Cross-Platform <span className="text-accent">Post Writer</span>
            </h1>

            {/* Tagline */}
            <h2 className="font-display text-2xl md:text-3xl text-secondary-foreground mb-6">
              AI-Powered Social Media Content
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate engaging social media posts with AI. Perfect for Twitter/X and other platforms 
              with customizable tone, length, and targeted content.
            </p>

            {/* Rating Badge */}
            <div className="flex justify-center items-center gap-2 mb-8">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
              <Badge variant="secondary" className="text-sm">4.9/5.0</Badge>
              <Badge variant="outline" className="text-sm">UTILITY</Badge>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                <Button
                  variant={currentView === 'generator' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('generator')}
                  className="flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Generator
                </Button>
                <Button
                  variant={currentView === 'history' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('history')}
                  className="flex items-center gap-2"
                >
                  <span>History</span>
                  {generatedPosts.length > 0 && <Badge variant="secondary">{generatedPosts.length}</Badge>}
                </Button>
                {hasSecurityAccess && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentView('security')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Security
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {currentView === 'generator' ? (
            <div className="max-w-4xl mx-auto">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-accent" />
                    Create Your X Post
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Topic */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Topic *</label>
                    <Input
                      placeholder="What's your post about?"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* CTA */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Call to Action</label>
                    <Input
                      placeholder="What do you want people to do? (e.g., 'Share your thoughts', 'Learn more')"
                      value={formData.cta}
                      onChange={(e) => handleInputChange('cta', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Audience */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Target Audience *</label>
                    <Input
                      placeholder="Who are you talking to? (e.g., 'Tech professionals', 'Marketing teams')"
                      value={formData.audience}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Media Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Media Description</label>
                    <Textarea
                      placeholder="Describe any images, videos, or media you'll include"
                      value={formData.mediaDescription}
                      onChange={(e) => handleInputChange('mediaDescription', e.target.value)}
                      className="w-full min-h-[80px]"
                    />
                  </div>

                  {/* Hashtags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Hashtags</label>
                    <Input
                      placeholder="Add hashtags separated by spaces (e.g., '#AI #Tech #Innovation')"
                      value={formData.hashtags}
                      onChange={(e) => handleInputChange('hashtags', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Tone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tone *</label>
                    <Select value={formData.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Length */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Length *</label>
                    <Select value={formData.length} onValueChange={(value) => handleInputChange('length', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (under 100 characters)</SelectItem>
                        <SelectItem value="medium">Medium (100-200 characters)</SelectItem>
                        <SelectItem value="long">Long (200-280 characters)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={generateSecurePost} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Posts */}
              {generatedPosts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">Generated Posts</h3>
                  {generatedPosts.map((post, index) => (
                    <Card key={index} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Twitter className="w-4 h-4 text-accent" />
                              <span className="text-sm text-muted-foreground">
                                {post.timestamp.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.content)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyFullPost(post)}
                            >
                              Copy All
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="whitespace-pre-wrap text-sm">{post.content}</div>
                          {post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.hashtags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {post.cta && (
                            <div className="text-sm font-medium text-accent">
                              CTA: {post.cta}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'history' ? (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">Post History</h2>
              {generatedPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Twitter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-xl font-bold text-primary mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Generate your first post to see it here</p>
                    <Button onClick={() => setCurrentView('generator')}>
                      Go to Generator
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {generatedPosts.map((post, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Twitter className="w-4 h-4 text-accent" />
                              <span className="text-sm text-muted-foreground">
                                {post.timestamp.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(post.content)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyFullPost(post)}
                            >
                              Copy All
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Separator className="mb-4" />
                        <div className="space-y-3">
                          <div className="whitespace-pre-wrap text-sm">{post.content}</div>
                          {post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.hashtags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {post.cta && (
                            <div className="text-sm font-medium text-accent">
                              CTA: {post.cta}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    Security Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/10 rounded-lg">
                      <h4 className="font-semibold mb-2">Webhook Security Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Endpoint:</span>
                          <span className="font-mono text-xs">Secure (HTTPS)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Authentication:</span>
                          <span className="text-green-600">API Key Protected</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Request Signing:</span>
                          <span className="text-green-600">Enabled</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate Limiting:</span>
                          <span className="text-green-600">Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Recent Activity</h4>
                      <p className="text-sm text-muted-foreground">
                        All webhook requests are logged and monitored for security purposes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default XPostWriter;