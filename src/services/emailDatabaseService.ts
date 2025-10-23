/**
 * Email Database Service
 * Bridge between existing email writer and Supabase database
 * Maintains backward compatibility while adding database persistence
 */

import { supabaseEmailService } from './supabaseEmailService';
import type { Email } from '@/types/email';
import type { CreateEmailInput, EmailDetails, UserEmailStats, EmailTemplate, EmailCategory } from '@/types/database';
import { toast } from 'sonner';

/**
 * Extended Email interface to match both existing and database types
 */
export interface EnhancedEmail extends Omit<Email, 'id' | 'createdAt'> {
  id: string;
  created_at: string;
  recipient_email?: string;
  category_name?: string;
  tags?: string[];
}

/**
 * Email Database Service
 * Integrates Supabase database with existing email writer functionality
 */
export class EmailDatabaseService {
  private static instance: EmailDatabaseService;
  private userId: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): EmailDatabaseService {
    if (!EmailDatabaseService.instance) {
      EmailDatabaseService.instance = new EmailDatabaseService();
    }
    return EmailDatabaseService.instance;
  }

  /**
   * Initialize the service with user ID
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      this.userId = userId;

      // Test database connection
      const connectionTest = await supabaseEmailService.testConnection();
      if (!connectionTest.success) {
        console.error('Database connection failed:', connectionTest.error);
        return false;
      }

      this.isInitialized = true;
      console.log('Email database service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize email database service:', error);
      return false;
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.userId !== null;
  }

  // =============================================
  // 1. EMAIL CRUD OPERATIONS
  // =============================================

  /**
   * Create a new email in the database
   */
  async createEmail(emailData: Omit<Email, 'id' | 'createdAt'>): Promise<Email | null> {
    if (!this.isReady()) {
      console.error('Email database service not initialized');
      return null;
    }

    try {
      const createData: CreateEmailInput = {
        user_id: this.userId!,
        subject: emailData.subject,
        content: emailData.content,
        recipient_name: emailData.recipient || undefined,
        category_id: emailData.category ? await this.getCategoryIdByName(emailData.category) : null,
        tags: emailData.tags,
        is_favorite: emailData.isFavorite,
        generation_metadata: {
          created_with: 'email_writer_v2',
          timestamp: new Date().toISOString()
        }
      };

      const response = await supabaseEmailService.createEmail(createData);

      if (response.success && response.data) {
        // Convert database email to legacy format
        return this.convertDatabaseEmailToLegacy(response.data);
      } else {
        console.error('Failed to create email:', response.error);
        toast.error('Failed to save email to database');
        return null;
      }
    } catch (error) {
      console.error('Unexpected error creating email:', error);
      toast.error('Failed to save email');
      return null;
    }
  }

  /**
   * Get user's emails with pagination
   */
  async getUserEmails(page = 1, perPage = 20): Promise<{ emails: Email[]; hasMore: boolean; totalCount: number }> {
    if (!this.isReady()) {
      return { emails: [], hasMore: false, totalCount: 0 };
    }

    try {
      const response = await supabaseEmailService.getUserEmails(this.userId!, {
        page,
        perPage,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (response.success && response.data) {
        const emails = response.data.data.map(email => this.convertDatabaseEmailToLegacy(email));
        return {
          emails,
          hasMore: response.data.has_more,
          totalCount: response.data.count
        };
      } else {
        console.error('Failed to fetch emails:', response.error);
        return { emails: [], hasMore: false, totalCount: 0 };
      }
    } catch (error) {
      console.error('Unexpected error fetching emails:', error);
      return { emails: [], hasMore: false, totalCount: 0 };
    }
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId: string): Promise<Email | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const response = await supabaseEmailService.getEmailById(emailId, this.userId!);

      if (response.success && response.data) {
        return this.convertDatabaseEmailToLegacy(response.data);
      } else {
        console.error('Failed to fetch email:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Unexpected error fetching email:', error);
      return null;
    }
  }

  /**
   * Delete an email
   */
  async deleteEmail(emailId: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const response = await supabaseEmailService.deleteEmail(emailId, this.userId!);

      if (response.success) {
        toast.success('Email deleted successfully');
        return true;
      } else {
        console.error('Failed to delete email:', response.error);
        toast.error('Failed to delete email');
        return false;
      }
    } catch (error) {
      console.error('Unexpected error deleting email:', error);
      toast.error('Failed to delete email');
      return false;
    }
  }

  /**
   * Toggle email favorite status
   */
  async toggleFavorite(emailId: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const response = await supabaseEmailService.toggleEmailFavorite(emailId, this.userId!);

      if (response.success) {
        return true;
      } else {
        console.error('Failed to toggle favorite:', response.error);
        toast.error('Failed to update favorite status');
        return false;
      }
    } catch (error) {
      console.error('Unexpected error toggling favorite:', error);
      toast.error('Failed to update favorite status');
      return false;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, limit = 20): Promise<Email[]> {
    if (!this.isReady() || !query.trim()) {
      return [];
    }

    try {
      const response = await supabaseEmailService.searchEmails({
        query,
        limit
      }, this.userId!);

      if (response.success && response.data) {
        return response.data.results.map(email => this.convertDatabaseEmailToLegacy(email));
      } else {
        console.error('Failed to search emails:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Unexpected error searching emails:', error);
      return [];
    }
  }

  // =============================================
  // 2. TEMPLATES OPERATIONS
  // =============================================

  /**
   * Get public email templates
   */
  async getPublicTemplates(category?: string): Promise<EmailTemplate[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      let categoryId: string | undefined;
      if (category) {
        categoryId = await this.getCategoryIdByName(category);
      }

      const response = await supabaseEmailService.getPublicTemplates(categoryId);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to fetch templates:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Unexpected error fetching templates:', error);
      return [];
    }
  }

  /**
   * Create a custom template
   */
  async createTemplate(templateData: {
    name: string;
    description?: string;
    templateText: string;
    subjectTemplate?: string;
    variables: string[];
    category?: string;
    tone?: string;
    purpose?: string;
  }): Promise<EmailTemplate | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const categoryId = templateData.category
        ? await this.getCategoryIdByName(templateData.category)
        : null;

      const createData = {
        name: templateData.name,
        description: templateData.description || null,
        template_text: templateData.templateText,
        subject_template: templateData.subjectTemplate || null,
        variables: templateData.variables,
        category_id: categoryId,
        tone: templateData.tone || null,
        purpose: templateData.purpose || null,
        created_by: this.userId!,
        is_public: false,
        is_active: true
      };

      const response = await supabaseEmailService.createTemplate(createData);

      if (response.success && response.data) {
        toast.success('Template created successfully');
        return response.data;
      } else {
        console.error('Failed to create template:', response.error);
        toast.error('Failed to create template');
        return null;
      }
    } catch (error) {
      console.error('Unexpected error creating template:', error);
      toast.error('Failed to create template');
      return null;
    }
  }

  // =============================================
  // 3. CATEGORIES OPERATIONS
  // =============================================

  /**
   * Get all email categories
   */
  async getCategories(): Promise<EmailCategory[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const response = await supabaseEmailService.getCategories();

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to fetch categories:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get category ID by name
   */
  private async getCategoryIdByName(categoryName: string): Promise<string | null> {
    const categories = await this.getCategories();
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.id : null;
  }

  // =============================================
  // 4. USER STATISTICS
  // =============================================

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<UserEmailStats | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const response = await supabaseEmailService.getUserStatistics(this.userId!);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Failed to fetch user statistics:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Unexpected error fetching user statistics:', error);
      return null;
    }
  }

  // =============================================
  // 5. ANALYTICS
  // =============================================

  /**
   * Track email generation event
   */
  async trackEmailGeneration(emailId: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await supabaseEmailService.createAnalyticsEvent({
        email_id: emailId,
        user_id: this.userId!,
        event_type: 'generated',
        event_data: metadata || {}
      });
    } catch (error) {
      console.error('Failed to track email generation:', error);
    }
  }

  /**
   * Track email copy event
   */
  async trackEmailCopy(emailId: string): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await supabaseEmailService.createAnalyticsEvent({
        email_id: emailId,
        user_id: this.userId!,
        event_type: 'copied'
      });
    } catch (error) {
      console.error('Failed to track email copy:', error);
    }
  }

  // =============================================
  // 6. UTILITY METHODS
  // =============================================

  /**
   * Convert database email to legacy email format
   */
  private convertDatabaseEmailToLegacy(dbEmail: EmailDetails | any): Email {
    return {
      id: dbEmail.id,
      subject: dbEmail.subject,
      content: dbEmail.content,
      recipient: dbEmail.recipient_name || '',
      category: dbEmail.category_name || 'Other',
      tags: dbEmail.tags || [],
      createdAt: new Date(dbEmail.created_at),
      isFavorite: dbEmail.is_favorite
    };
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Reset service (for logout)
   */
  reset(): void {
    this.userId = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const emailDatabaseService = EmailDatabaseService.getInstance();