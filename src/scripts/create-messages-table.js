// Create messages table script
const { createClient } = require('@supabase/supabase-js');

// Get environment variables from .env.local if available
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the messages table
const createTableSQL = `
-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
DROP INDEX IF EXISTS messages_sender_index;
CREATE INDEX IF NOT EXISTS messages_sender_index ON public.messages (sender_email);

DROP INDEX IF EXISTS messages_recipient_index;
CREATE INDEX IF NOT EXISTS messages_recipient_index ON public.messages (recipient_email);

DROP INDEX IF EXISTS messages_created_at_index;
CREATE INDEX IF NOT EXISTS messages_created_at_index ON public.messages (created_at);

-- Enable realtime subscription for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
`;

async function createMessagesTable() {
  try {
    console.log('Starting table creation process...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
    
    if (error) {
      console.error('Error creating messages table:', error);
      
      // Fallback approach: Try directly through REST API
      console.log('Trying alternative approach...');
      
      // First, check if the table already exists
      const { data, error: checkError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);
        
      if (checkError && checkError.code === '42P01') {
        console.log('Confirmed messages table does not exist.');
        
        // Create a simple test message to initialize the table
        console.log('Attempting to create the table by inserting a test record...');
        const { error: createError } = await supabase
          .from('messages')
          .insert({
            sender_email: 'system@bates.edu',
            sender_name: 'System',
            recipient_email: 'admin@bates.edu',
            content: 'Test message to initialize the table',
            is_admin: true,
            read: true
          });
          
        if (createError) {
          console.error('Failed to initialize table via insertion:', createError);
          process.exit(1);
        } else {
          console.log('Successfully created messages table!');
        }
      } else if (checkError) {
        console.error('Error checking if table exists:', checkError);
        process.exit(1);
      } else {
        console.log('Messages table already exists!');
      }
    } else {
      console.log('Successfully created messages table!');
    }
    
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
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createMessagesTable(); 