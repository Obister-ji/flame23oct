/**
 * React Hook for Email Database Operations
 * Provides easy integration with Supabase email database
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { emailDatabaseService } from '@/services/emailDatabaseService';
import type { Email } from '@/types/email';
import type { EmailTemplate, EmailCategory, UserEmailStats } from '@/types/database';
import { toast } from 'sonner';

interface UseEmailDatabaseOptions {
  autoLoad?: boolean;
  pageSize?: number;
}

interface UseEmailDatabaseReturn {
  // State
  emails: Email[];
  templates: EmailTemplate[];
  categories: EmailCategory[];
  statistics: UserEmailStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;

  // Actions
  createEmail: (emailData: Omit<Email, 'id' | 'createdAt'>) => Promise<Email | null>;
  updateEmail: (id: string, updates: Partial<Email>) => Promise<boolean>;
  deleteEmail: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  searchEmails: (query: string) => Promise<Email[]>;
  loadMoreEmails: () => Promise<void>;
  refreshEmails: () => Promise<void>;

  // Templates
  loadTemplates: (category?: string) => Promise<void>;
  createTemplate: (templateData: any) => Promise<EmailTemplate | null>;

  // Categories
  loadCategories: () => Promise<void>;

  // Utilities
  isReady: boolean;
  userId: string | null;
}

export function useEmailDatabase(options: UseEmailDatabaseOptions = {}): UseEmailDatabaseReturn {
  const { autoLoad = true, pageSize = 20 } = options;
  const { isSignedIn, user } = useUser();

  // State
  const [emails, setEmails] = useState<Email[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailCategory[]>([]);
  const [statistics, setStatistics] = useState<UserEmailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isReady, setIsReady] = useState(false);

  // Refs to prevent duplicate requests
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  // Initialize database service
  useEffect(() => {
    const initialize = async () => {
      if (!isSignedIn || !user || initializedRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const success = await emailDatabaseService.initialize(user.id);
        if (success) {
          setIsReady(true);
          initializedRef.current = true;

          if (autoLoad) {
            await Promise.all([
              loadEmails(1),
              loadCategories(),
              loadStatistics()
            ]);
          }
        } else {
          setError('Failed to initialize database service');
          toast.error('Failed to connect to email database');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast.error('Database initialization failed');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [isSignedIn, user, autoLoad]);

  // Reset on logout
  useEffect(() => {
    if (!isSignedIn && initializedRef.current) {
      emailDatabaseService.reset();
      setEmails([]);
      setTemplates([]);
      setCategories([]);
      setStatistics(null);
      setIsReady(false);
      initializedRef.current = false;
      setPage(1);
      setHasMore(true);
      setError(null);
    }
  }, [isSignedIn]);

  // Load emails
  const loadEmails = useCallback(async (pageNum: number = page, append: boolean = false) => {
    if (!isReady || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const result = await emailDatabaseService.getUserEmails(pageNum, pageSize);

      if (append) {
        setEmails(prev => [...prev, ...result.emails]);
      } else {
        setEmails(result.emails);
      }

      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load emails';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [isReady, page, pageSize]);

  // Load more emails (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (hasMore && !loading) {
      await loadEmails(page + 1, true);
    }
  }, [hasMore, loading, page, loadEmails]);

  // Refresh emails (reset to first page)
  const refreshEmails = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await loadEmails(1, false);
  }, [loadEmails]);

  // Create email
  const createEmail = useCallback(async (emailData: Omit<Email, 'id' | 'createdAt'>): Promise<Email | null> => {
    if (!isReady) {
      toast.error('Database not ready');
      return null;
    }

    setLoading(true);

    try {
      const newEmail = await emailDatabaseService.createEmail(emailData);

      if (newEmail) {
        setEmails(prev => [newEmail, ...prev]);
        toast.success('Email saved successfully');
        return newEmail;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create email';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isReady]);

  // Update email
  const updateEmail = useCallback(async (id: string, updates: Partial<Email>): Promise<boolean> => {
    if (!isReady) {
      toast.error('Database not ready');
      return false;
    }

    try {
      // Note: Update functionality would need to be implemented in the service
      toast.info('Email update functionality coming soon');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update email';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isReady]);

  // Delete email
  const deleteEmail = useCallback(async (id: string): Promise<boolean> => {
    if (!isReady) {
      toast.error('Database not ready');
      return false;
    }

    try {
      const success = await emailDatabaseService.deleteEmail(id);

      if (success) {
        setEmails(prev => prev.filter(email => email.id !== id));
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete email';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isReady]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    if (!isReady) {
      toast.error('Database not ready');
      return false;
    }

    try {
      const success = await emailDatabaseService.toggleFavorite(id);

      if (success) {
        setEmails(prev =>
          prev.map(email =>
            email.id === id ? { ...email, isFavorite: !email.isFavorite } : email
          )
        );
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update favorite';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [isReady]);

  // Search emails
  const searchEmails = useCallback(async (query: string): Promise<Email[]> => {
    if (!isReady || !query.trim()) {
      return [];
    }

    try {
      const results = await emailDatabaseService.searchEmails(query);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search emails';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, [isReady]);

  // Load templates
  const loadTemplates = useCallback(async (category?: string) => {
    if (!isReady) {
      return;
    }

    try {
      const templates = await emailDatabaseService.getPublicTemplates(category);
      setTemplates(templates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [isReady]);

  // Create template
  const createTemplate = useCallback(async (templateData: any): Promise<EmailTemplate | null> => {
    if (!isReady) {
      toast.error('Database not ready');
      return null;
    }

    try {
      const newTemplate = await emailDatabaseService.createTemplate(templateData);

      if (newTemplate) {
        setTemplates(prev => [newTemplate, ...prev]);
      }

      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [isReady]);

  // Load categories
  const loadCategories = useCallback(async () => {
    if (!isReady) {
      return;
    }

    try {
      const categories = await emailDatabaseService.getCategories();
      setCategories(categories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [isReady]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!isReady) {
      return;
    }

    try {
      const stats = await emailDatabaseService.getUserStatistics();
      setStatistics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [isReady]);

  return {
    // State
    emails,
    templates,
    categories,
    statistics,
    loading,
    error,
    hasMore,
    page,

    // Actions
    createEmail,
    updateEmail,
    deleteEmail,
    toggleFavorite,
    searchEmails,
    loadMoreEmails,
    refreshEmails,

    // Templates
    loadTemplates,
    createTemplate,

    // Categories
    loadCategories,

    // Utilities
    isReady,
    userId: user?.id || null
  };
}

/**
 * Hook for real-time email updates
 */
export function useEmailRealtime(emailId?: string) {
  const [update, setUpdate] = useState<number>(0);
  const { isReady, userId } = useEmailDatabase({ autoLoad: false });

  useEffect(() => {
    if (!isReady || !userId) {
      return;
    }

    // Subscribe to email changes
    const subscription = emailDatabaseService.subscribeToEmails(userId, (payload) => {
      setUpdate(prev => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isReady, userId]);

  return update;
}

export default useEmailDatabase;