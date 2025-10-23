import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { EmailGenerator } from '@/components/EmailGenerator';
import { SecurityMonitor } from '@/components/SecurityMonitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Sparkles, ArrowLeft, History, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { Email } from '@/types/email';
import { supabaseEmailService } from '@/services/supabaseEmailService';
import type { CreateEmailInput } from '@/types/database';
import emailwriter from '@/assets/emailwriter.png';

const EmailWriter = () => {
  const { isSignedIn, user } = useUser();
  const [searchParams] = useSearchParams();
  const [emails, setEmails] = useState<Email[]>([]);
  const [currentView, setCurrentView] = useState<'generator' | 'history' | 'security'>('generator');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user has access to security features
  const hasSecurityAccess = user?.primaryEmailAddress?.emailAddress === 'sarvaxgupta@gmail.com';

  // Load emails from Supabase
  const loadEmails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await supabaseEmailService.getUserEmails(userId, {
        pageSize: 50,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (result.success && result.data) {
        // Convert Supabase emails to our Email format
        const convertedEmails: Email[] = result.data.data.map(email => ({
          id: email.id,
          subject: email.subject,
          content: email.content,
          recipient: email.recipient_email || email.recipient_name || undefined,
          category: email.purpose || 'other',
          tags: [], // Tags would need to be loaded separately
          isFavorite: email.is_favorite || false,
          createdAt: new Date(email.created_at),
          tone: email.tone || undefined
        }));

        setEmails(convertedEmails);
        console.log(`Loaded ${convertedEmails.length} emails from Supabase`);
      } else {
        console.error('Failed to load emails:', result.error);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Monitor authentication state using Clerk
  useEffect(() => {
    if (isSignedIn && user) {
      setUserId(user.id);
      console.log('Authentication state check - User ID:', user.id);
      // Load emails when user signs in
      loadEmails();
    } else {
      setUserId(null);
      setEmails([]); // Clear emails when user signs out
      console.log('Authentication state check - User not signed in');
    }
  }, [isSignedIn, user, userId]);

  // Save email using Supabase
  const addEmail = async (email: Omit<Email, 'id' | 'createdAt'>) => {
    console.log('Adding email to Supabase:', email);

    if (!userId) {
      console.error('Cannot add email: User not authenticated');
      toast.error('Please log in to save emails');
      return;
    }

    try {
      // Create email data for Supabase
      const emailData: CreateEmailInput = {
        user_id: userId,
        subject: email.subject,
        content: email.content,
        recipient_name: email.recipient || undefined,
        recipient_email: email.recipient || undefined,
        category_id: undefined, // We'll need to map category to category_id
        purpose: email.category,
        tone: email.tone || undefined,
        key_points: undefined, // Extract from content or add as separate field
        template_id: undefined,
        status: 'draft',
        is_favorite: email.isFavorite || false,
        is_archived: false,
      };

      // Save to Supabase
      const result = await supabaseEmailService.createEmail(emailData);

      if (result.success && result.data) {
        console.log('Email saved successfully to Supabase:', result.data.id);

        // Refresh emails list
        await loadEmails();

        toast.success('Email saved to history successfully!');
      } else {
        throw new Error(result.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('Failed to save email to Supabase:', error);
      toast.error('Failed to save email. Please try again.');
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!userId) return;

    try {
      const result = await supabaseEmailService.deleteEmail(id, userId);

      if (result.success) {
        await loadEmails(); // Refresh the list
        toast.success('Email deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete email');
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast.error('Failed to delete email. Please try again.');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!userId) return;

    try {
      const result = await supabaseEmailService.toggleEmailFavorite(id, userId);

      if (result.success) {
        await loadEmails(); // Refresh the list
        toast.success('Email favorite status updated');
      } else {
        throw new Error(result.error || 'Failed to update favorite status');
      }
    } catch (error) {
      console.error('Failed to update favorite status:', error);
      toast.error('Failed to update favorite status. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
              MAIL-MAGE EMAIL WRITER
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight">
              Professional <span className="text-accent">Email Writer</span>
            </h1>

            {/* Tagline */}
            <h2 className="font-display text-2xl md:text-3xl text-secondary-foreground mb-6">
              AI-Powered Email Generation
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate professional emails in seconds with our advanced AI technology. 
              Choose your tone, purpose, and key points to create perfectly crafted emails every time.
            </p>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                <Button
                  variant={currentView === 'generator' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('generator')}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Generator
                </Button>
                <Button
                  variant={currentView === 'history' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('history')}
                  className="flex items-center gap-2"
                  data-testid="history-tab"
                >
                  <History className="w-4 h-4" />
                  History {emails.length > 0 && <Badge variant="secondary">{emails.length}</Badge>}
                </Button>
                {hasSecurityAccess && (
                  <Button
                    variant={currentView === 'security' ? 'default' : 'ghost'}
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
          {!userId ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-center">Authentication Required</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">Please log in to save and view your email history</p>
                  <p className="text-sm text-muted-foreground">Authentication is required for this feature</p>
                </CardContent>
              </Card>
            </div>
          ) : currentView === 'generator' ? (
            <EmailGenerator onEmailGenerated={addEmail} />
          ) : currentView === 'security' && hasSecurityAccess ? (
            <SecurityMonitor />
          ) : (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-primary mb-6">Email History</h2>
              {emails.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-xl font-bold text-primary mb-2">No emails yet</h3>
                    <p className="text-muted-foreground mb-4">Generate your first email to see it here</p>
                    <Button onClick={() => setCurrentView('generator')}>
                      Go to Generator
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <Card key={email.id} className="hover:shadow-md transition-shadow" data-testid="email-history-item">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-primary" data-testid="email-subject">{email.subject}</h3>
                              {email.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span data-testid="email-recipient">To: {email.recipient || 'Not specified'}</span>
                              <span>•</span>
                              <span data-testid="email-purpose">{email.category}</span>
                              <span>•</span>
                              <span>{email.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(email.content)}
                            >
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFavorite(email.id)}
                              data-testid="favorite-btn"
                              className={email.isFavorite ? 'favorited' : ''}
                            >
                              <Star className={`w-4 h-4 ${email.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmail(email.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Separator className="mb-4" />
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto" data-testid="email-content-detail">
                          {email.content}
                        </div>
                        {email.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {email.tags.map(tag => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EmailWriter;