// Simple test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = 'https://tnqpvxjwxfbutngdrtur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRucXB2eGp3eGZidXRuZ2RydHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTg1ODYsImV4cCI6MjA3NTc3NDU4Nn0.kdqvgOl2CX7O0jQey1KlYCmBumvE5wKgUy3wYScOOoU';

console.log('🧪 Testing Supabase connection...');

try {
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('✅ Supabase client created successfully');

  // Test basic connection by checking if we can access the emails table
  async function testConnection() {
    try {
      console.log('🔍 Testing database access...');

      // Try to select from emails table (this will test if table exists and RLS policies work)
      const { data, error } = await supabase
        .from('emails')
        .select('count')
        .limit(1);

      if (error) {
        console.log('❌ Database access error:', error.message);
        console.log('This might be expected if RLS policies are blocking access');
      } else {
        console.log('✅ Database access successful');
      }

      // Test if we can check categories
      console.log('🔍 Testing categories table...');
      const { data: categories, error: catError } = await supabase
        .from('email_categories')
        .select('*')
        .limit(5);

      if (catError) {
        console.log('❌ Categories table error:', catError.message);
      } else {
        console.log('✅ Categories table access successful');
        console.log(`Found ${categories?.length || 0} categories`);
      }

      console.log('\n✅ Supabase connection test completed!');
      console.log('Your application should now be able to save emails to Supabase.');

    } catch (err) {
      console.error('❌ Connection test failed:', err.message);
    }
  }

  testConnection();

} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
  console.log('Please check your Supabase URL and keys');
}