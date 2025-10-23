/**
 * Supabase Email Service
 * Handles all database operations for the email generator
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Email,
  EmailDetails,
  EmailTemplate,
  EmailCategory,
  EmailTag,
  UserEmailPreferences,
  UserEmailStats,
  EmailAnalytics,
  CreateEmailInput,
  UpdateEmailInput,
  CreateEmailTemplateInput,
  CreateEmailAnalyticsInput,
  SearchEmailsParams,
  SearchEmailsResponse,
  UserStatistics,
  ApiResponse,
  PaginatedResponse
} from '@/types/database';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Supabase Email Service Class
 */
export class SupabaseEmailService {
  private static instance: SupabaseEmailService;

  private constructor() {}

  public static getInstance(): SupabaseEmailService {
    if (!SupabaseEmailService.instance) {
      SupabaseEmailService.instance = new SupabaseEmailService();
    }
    return SupabaseEmailService.instance;
  }

  // =============================================
  // 1. EMAIL OPERATIONS
  // =============================================

  /**
   * Create a new email
   */
  async createEmail(emailData: CreateEmailInput): Promise<ApiResponse<Email>> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert(emailData)
        .select()
        .single();

      if (error) {
        console.error('Error creating email:', error);
        return { success: false, error: error.message };
      }

      // Create analytics event for generation
      await this.createAnalyticsEvent({
        email_id: data.id,
        user_id: emailData.user_id,
        event_type: 'generated',
        event_data: { template_id: emailData.template_id }
      });

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error creating email:', error);
      return { success: false, error: 'Failed to create email' };
    }
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId: string, userId: string): Promise<ApiResponse<EmailDetails>> {
    try {
      const { data, error } = await supabase
        .from('email_details')
        .select('*')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching email:', error);
      return { success: false, error: 'Failed to fetch email' };
    }
  }

  /**
   * Get emails for a user with pagination and filtering
   */
  async getUserEmails(
    userId: string,
    options: {
      page?: number;
      perPage?: number;
      category?: string;
      isFavorite?: boolean;
      status?: string;
      sortBy?: 'created_at' | 'subject' | 'category_name';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<EmailDetails>>> {
    try {
      const {
        page = 1,
        perPage = 20,
        category,
        isFavorite,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from('email_details')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_archived', false);

      // Apply filters
      if (category) {
        query = query.eq('category_name', category);
      }
      if (isFavorite !== undefined) {
        query = query.eq('is_favorite', isFavorite);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching emails:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          count: count || 0,
          has_more: (count || 0) > to + 1,
          page,
          per_page: perPage
        }
      };
    } catch (error) {
      console.error('Unexpected error fetching emails:', error);
      return { success: false, error: 'Failed to fetch emails' };
    }
  }

  /**
   * Update an email
   */
  async updateEmail(emailId: string, userId: string, updates: UpdateEmailInput): Promise<ApiResponse<Email>> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .update(updates)
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating email:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating email:', error);
      return { success: false, error: 'Failed to update email' };
    }
  }

  /**
   * Delete an email
   */
  async deleteEmail(emailId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting email:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting email:', error);
      return { success: false, error: 'Failed to delete email' };
    }
  }

  /**
   * Toggle email favorite status
   */
  async toggleEmailFavorite(emailId: string, userId: string): Promise<ApiResponse<Email>> {
    try {
      // First get current favorite status
      const { data: currentEmail, error: fetchError } = await supabase
        .from('emails')
        .select('is_favorite')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Toggle the favorite status
      const { data, error } = await supabase
        .from('emails')
        .update({ is_favorite: !currentEmail.is_favorite })
        .eq('id', emailId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling email favorite:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error toggling email favorite:', error);
      return { success: false, error: 'Failed to toggle email favorite' };
    }
  }

  /**
   * Archive an email
   */
  async archiveEmail(emailId: string, userId: string): Promise<ApiResponse<Email>> {
    return this.updateEmail(emailId, userId, { is_archived: true });
  }

  /**
   * Search emails with full-text search
   */
  async searchEmails(params: SearchEmailsParams, userId: string): Promise<ApiResponse<SearchEmailsResponse>> {
    try {
      const { query: searchQuery, limit = 50, offset = 0 } = params;

      // Use the database function for full-text search
      const { data, error } = await supabase
        .rpc('search_emails', {
          search_query: searchQuery,
          user_id_param: userId,
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        console.error('Error searching emails:', error);
        return { success: false, error: error.message };
      }

      // Get total count for the search
      const { count, error: countError } = await supabase
        .from('email_details')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_archived', false)
        .textSearch('subject', searchQuery, { type: 'websearch' });

      const totalCount = countError ? 0 : (count || 0);

      return {
        success: true,
        data: {
          results: data || [],
          total_count: totalCount,
          search_time: 0 // Could add timing measurement
        }
      };
    } catch (error) {
      console.error('Unexpected error searching emails:', error);
      return { success: false, error: 'Failed to search emails' };
    }
  }

  // =============================================
  // 2. EMAIL TEMPLATES OPERATIONS
  // =============================================

  /**
   * Get public email templates
   */
  async getPublicTemplates(categoryId?: string): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .eq('is_public', true)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching public templates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching public templates:', error);
      return { success: false, error: 'Failed to fetch templates' };
    }
  }

  /**
   * Get user's private templates
   */
  async getUserTemplates(userId: string): Promise<ApiResponse<EmailTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user templates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching user templates:', error);
      return { success: false, error: 'Failed to fetch user templates' };
    }
  }

  /**
   * Create a new email template
   */
  async createTemplate(templateData: CreateEmailTemplateInput & { created_by: string }): Promise<ApiResponse<EmailTemplate>> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error creating template:', error);
      return { success: false, error: 'Failed to create template' };
    }
  }

  // =============================================
  // 3. CATEGORIES AND TAGS OPERATIONS
  // =============================================

  /**
   * Get all email categories
   */
  async getCategories(): Promise<ApiResponse<EmailCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('email_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching categories:', error);
      return { success: false, error: 'Failed to fetch categories' };
    }
  }

  /**
   * Get all email tags
   */
  async getTags(): Promise<ApiResponse<EmailTag[]>> {
    try {
      const { data, error } = await supabase
        .from('email_tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching tags:', error);
      return { success: false, error: 'Failed to fetch tags' };
    }
  }

  /**
   * Add tags to an email
   */
  async addEmailTags(emailId: string, tagIds: string[]): Promise<ApiResponse<void>> {
    try {
      const junctionData = tagIds.map(tagId => ({
        email_id: emailId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('email_tags_junction')
        .insert(junctionData);

      if (error) {
        console.error('Error adding email tags:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error adding email tags:', error);
      return { success: false, error: 'Failed to add email tags' };
    }
  }

  // =============================================
  // 4. USER PREFERENCES OPERATIONS
  // =============================================

  /**
   * Get user email preferences
   */
  async getUserPreferences(userId: string): Promise<ApiResponse<UserEmailPreferences>> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user preferences:', error);
        return { success: false, error: error.message };
      }

      // If no preferences exist, create default preferences
      if (!data) {
        const defaultPreferences = {
          user_id: userId,
          default_tone: 'professional',
          default_length: 'medium',
          favorite_templates: [],
          auto_save: true,
          default_recipient_language: 'en',
          notification_preferences: { new_email: true, template_updates: false },
          ui_preferences: { theme: 'light', compact_view: false }
        };

        const { data: newPreferences, error: createError } = await supabase
          .from('user_email_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (createError) {
          return { success: false, error: createError.message };
        }

        return { success: true, data: newPreferences };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching user preferences:', error);
      return { success: false, error: 'Failed to fetch user preferences' };
    }
  }

  /**
   * Update user email preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserEmailPreferences>): Promise<ApiResponse<UserEmailPreferences>> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .update(preferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating user preferences:', error);
      return { success: false, error: 'Failed to update user preferences' };
    }
  }

  // =============================================
  // 5. ANALYTICS OPERATIONS
  // =============================================

  /**
   * Create an analytics event
   */
  async createAnalyticsEvent(analyticsData: CreateEmailAnalyticsInput): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase
        .rpc('create_email_analytics', {
          email_id_param: analyticsData.email_id,
          user_id_param: analyticsData.user_id,
          event_type_param: analyticsData.event_type,
          event_data_param: analyticsData.event_data || {},
          ip_address_param: analyticsData.ip_address,
          user_agent_param: analyticsData.user_agent
        });

      if (error) {
        console.error('Error creating analytics event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error creating analytics event:', error);
      return { success: false, error: 'Failed to create analytics event' };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<ApiResponse<UserStatistics>> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_statistics', {
          user_id_param: userId
        });

      if (error) {
        console.error('Error fetching user statistics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching user statistics:', error);
      return { success: false, error: 'Failed to fetch user statistics' };
    }
  }

  // =============================================
  // 6. REALTIME SUBSCRIPTIONS
  // =============================================

  /**
   * Subscribe to email changes for a user
   */
  subscribeToEmails(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('emails')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emails',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to user preference changes
   */
  subscribeToUserPreferences(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_preferences')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_email_preferences',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // =============================================
  // 7. UTILITY METHODS
  // =============================================

  /**
   * Test database connection
   */
  async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('email_categories')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Database connection failed' };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return supabase.auth.getUser();
  }

  /**
   * Sign out current user
   */
  async signOut() {
    return supabase.auth.signOut();
  }
}

// Export singleton instance
export const supabaseEmailService = SupabaseEmailService.getInstance();

// Export the supabase client for direct access if needed
export { supabase };