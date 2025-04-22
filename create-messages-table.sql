-- HOW TO USE THIS FILE:
-- 1. Log in to your Supabase dashboard at https://app.supabase.com/
-- 2. Select your project
-- 3. Go to "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy the contents of this entire file and paste it into the query editor
-- 6. Click "Run" to execute the SQL and create the messages table

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

-- Temporarily disable Row Level Security for easier testing
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS messages_sender_index ON public.messages (sender_email);
CREATE INDEX IF NOT EXISTS messages_recipient_index ON public.messages (recipient_email);
CREATE INDEX IF NOT EXISTS messages_created_at_index ON public.messages (created_at);

-- Enable realtime subscription for the messages table
-- This is required for real-time chat functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Insert a test message to verify the table works
INSERT INTO public.messages (
    sender_email,
    sender_name,
    recipient_email,
    content,
    is_admin,
    read
) VALUES (
    'system@bates.edu',
    'System',
    'admin@bates.edu',
    'Welcome to the Bates Shuttle chat system! This message was created during table setup.',
    true,
    true
);

-- Verify the table exists and message was inserted
SELECT * FROM public.messages; 