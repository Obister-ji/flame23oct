/**
 * Database Schema Types for Flame AI Email Generator
 * These types correspond to the Supabase database schema
 */

// =============================================
// 1. CORE TABLE TYPES
// =============================================

export interface EmailCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTag {
  id: string;
  name: string;
  description: string | null;
  color: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  template_text: string;
  variables: string[];
  subject_template: string | null;
  tone: string | null;
  purpose: string | null;
  length_preference: string;
  is_public: boolean;
  is_active: boolean;
  usage_count: number;
  rating: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserEmailPreferences {
  id: string;
  user_id: string;
  default_tone: string;
  default_length: string;
  default_category_id: string | null;
  favorite_templates: string[];
  auto_save: boolean;
  signature: string | null;
  company_name: string | null;
  default_recipient_language: string;
  notification_preferences: {
    new_email: boolean;
    template_updates: boolean;
  };
  ui_preferences: {
    theme: 'light' | 'dark' | 'system';
    compact_view: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  user_id: string;
  subject: string;
  content: string;
  recipient_name: string | null;
  recipient_email: string | null;
  sender_name: string | null;
  sender_email: string | null;
  category_id: string | null;
  purpose: string | null;
  tone: string | null;
  length_preference: string | null;
  template_id: string | null;
  key_points: string | null;
  additional_context: string | null;
  generation_metadata: {
    ai_model?: string;
    generation_time?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    webhook_response?: any;
    [key: string]: any;
  };
  status: 'draft' | 'sent' | 'scheduled' | 'archived';
  is_favorite: boolean;
  is_archived: boolean;
  read_receipt: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTagsJunction {
  email_id: string;
  tag_id: string;
  created_at: string;
}

export interface EmailAnalytics {
  id: string;
  email_id: string;
  user_id: string;
  event_type: 'generated' | 'viewed' | 'copied' | 'sent' | 'opened' | 'replied' | 'forwarded';
  event_data: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface EmailUsageStats {
  id: string;
  user_id: string;
  date: string;
  total_emails_generated: number;
  total_emails_sent: number;
  favorite_category_id: string | null;
  most_used_tone: string | null;
  average_email_length: number;
  unique_recipients: number;
  template_usage_counts: Record<string, number>;
  created_at: string;
  updated_at: string;
}

// =============================================
// 2. VIEW TYPES
// =============================================

export interface EmailDetails extends Email {
  category_name: string | null;
  category_color: string | null;
  template_name: string | null;
  tags: string[];
  priority_status: 'archived' | 'sent' | 'favorite' | 'normal';
}

export interface UserEmailStats {
  user_id: string;
  total_emails: number;
  favorite_count: number;
  sent_count: number;
  draft_count: number;
  emails_this_week: number;
  emails_this_month: number;
  last_email_date: string | null;
  categories_used: string[];
}

export interface PopularTemplate extends EmailTemplate {
  category_name: string | null;
  actual_usage_count: number;
  avg_rating: number | null;
  unique_users: number;
}

// =============================================
// 3. INPUT TYPES FOR DATABASE OPERATIONS
// =============================================

export interface CreateEmailInput {
  user_id: string;
  subject: string;
  content: string;
  recipient_name?: string;
  recipient_email?: string;
  sender_name?: string;
  sender_email?: string;
  category_id?: string;
  purpose?: string;
  tone?: string;
  length_preference?: string;
  template_id?: string;
  key_points?: string;
  additional_context?: string;
  generation_metadata?: Record<string, any>;
  status?: 'draft' | 'sent' | 'scheduled' | 'archived';
  is_favorite?: boolean;
  is_archived?: boolean;
  scheduled_at?: string;
  sent_at?: string;
}

export interface UpdateEmailInput {
  subject?: string;
  content?: string;
  recipient_name?: string;
  recipient_email?: string;
  category_id?: string;
  purpose?: string;
  tone?: string;
  length_preference?: string;
  key_points?: string;
  additional_context?: string;
  generation_metadata?: Record<string, any>;
  status?: 'draft' | 'sent' | 'scheduled' | 'archived';
  is_favorite?: boolean;
  is_archived?: boolean;
  scheduled_at?: string;
  sent_at?: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  description?: string;
  category_id?: string;
  template_text: string;
  variables: string[];
  subject_template?: string;
  tone?: string;
  purpose?: string;
  length_preference?: string;
  is_public?: boolean;
  is_active?: boolean;
}

export interface CreateEmailAnalyticsInput {
  email_id: string;
  user_id: string;
  event_type: 'generated' | 'viewed' | 'copied' | 'sent' | 'opened' | 'replied' | 'forwarded';
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// =============================================
// 4. API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  has_more: boolean;
  page: number;
  per_page: number;
}

export interface SearchEmailsParams {
  query: string;
  limit?: number;
  offset?: number;
  category_id?: string;
  tags?: string[];
  is_favorite?: boolean;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface SearchEmailsResponse {
  results: EmailDetails[];
  total_count: number;
  search_time: number;
}

// =============================================
// 5. UTILITY TYPES
// =============================================

export type EmailStatus = Email['status'];
export type EmailTone = string; // Will be defined by available tones
export type EmailPurpose = string; // Will be defined by available purposes
export type EmailLength = 'short' | 'medium' | 'long';
export type AnalyticsEventType = EmailAnalytics['event_type'];

// =============================================
// 6. DATABASE FUNCTION RETURN TYPES
// =============================================

export interface SearchResult {
  id: string;
  subject: string;
  content: string;
  recipient_name: string | null;
  category_name: string | null;
  tags: string[];
  created_at: string;
  is_favorite: boolean;
  relevance: number;
}

export interface UserStatistics {
  total_emails: number;
  favorite_count: number;
  sent_count: number;
  draft_count: number;
  this_week_count: number;
  this_month_count: number;
  last_email_date: string | null;
  most_used_category: string | null;
  most_used_tone: string | null;
}

// =============================================
// 7. ERROR TYPES
// =============================================

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// =============================================
// 8. CONFIGURATION TYPES
// =============================================

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  realtimeEnabled: boolean;
  connectionTimeout: number;
}

export interface EmailGenerationConfig {
  maxRetries: number;
  timeoutMs: number;
  enableAnalytics: boolean;
  autoSave: boolean;
}

// =============================================
// 9. MIGRATION HELPER TYPES
// =============================================

export interface MigrationScript {
  version: string;
  name: string;
  up: string;
  down: string;
  dependencies?: string[];
}

export interface DatabaseVersion {
  version: string;
  applied_at: string;
  success: boolean;
}

// =============================================
// 10. TYPE GUARDS
// =============================================

export function isValidEmailStatus(status: string): status is EmailStatus {
  return ['draft', 'sent', 'scheduled', 'archived'].includes(status);
}

export function isValidAnalyticsEventType(type: string): type is AnalyticsEventType {
  return ['generated', 'viewed', 'copied', 'sent', 'opened', 'replied', 'forwarded'].includes(type);
}

export function isValidEmailLength(length: string): length is EmailLength {
  return ['short', 'medium', 'long'].includes(length);
}

export function isEmail(obj: any): obj is Email {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isEmailDetails(obj: any): obj is EmailDetails {
  return (
    isEmail(obj) &&
    Array.isArray(obj.tags) &&
    typeof obj.priority_status === 'string'
  );
}

// =============================================
// 11. EXPORT ALL TYPES
// =============================================

export type {
  // Core types
  EmailCategory,
  EmailTag,
  EmailTemplate,
  UserEmailPreferences,
  Email,
  EmailTagsJunction,
  EmailAnalytics,
  EmailUsageStats,

  // View types
  EmailDetails,
  UserEmailStats,
  PopularTemplate,

  // Input types
  CreateEmailInput,
  UpdateEmailInput,
  CreateEmailTemplateInput,
  CreateEmailAnalyticsInput,

  // Response types
  ApiResponse,
  PaginatedResponse,
  SearchEmailsParams,
  SearchEmailsResponse,

  // Function return types
  SearchResult,
  UserStatistics,

  // Error types
  DatabaseError,
  ValidationError,

  // Configuration types
  DatabaseConfig,
  EmailGenerationConfig,

  // Migration types
  MigrationScript,
  DatabaseVersion,
};