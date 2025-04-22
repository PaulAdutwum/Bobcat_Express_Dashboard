/**
 * Supabase Migration Script
 * 
 * This script can be used to apply SQL migrations to your Supabase project.
 * 
 * Usage:
 * 1. Set your SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment
 * 2. Run: node src/scripts/run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to migration files
const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

async function runMigration() {
  try {
    console.log('Starting migration process...');
    
    // Read the messages.sql file
    const messagesPath = path.join(migrationsDir, 'messages.sql');
    
    if (!fs.existsSync(messagesPath)) {
      console.error(`Migration file not found: ${messagesPath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(messagesPath, 'utf8');
    
    // Execute the SQL
    console.log('Applying messages.sql migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('Migration successfully applied!');
    
    // Verify that the table exists
    const { data, error: tableError } = await supabase
      .from('messages')
      .select('count(*)', { count: 'exact', head: true });
      
    if (tableError) {
      console.error('Error verifying messages table:', tableError);
    } else {
      console.log('Messages table verified: Ready to use');
    }
    
  } catch (err) {
    console.error('Unexpected error during migration:', err);
    process.exit(1);
  }
}

runMigration(); 