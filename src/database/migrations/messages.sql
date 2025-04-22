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

-- TEMPORARILY DISABLE Row Level Security for development purposes
-- This allows all operations without authentication
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Create policies but don't enable them yet (for future reference)
DROP POLICY IF EXISTS "Anyone can add messages" ON public.messages;
CREATE POLICY "Anyone can add messages" ON public.messages
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view messages where they are the sender or recipient" ON public.messages;
CREATE POLICY "Users can view messages where they are the sender or recipient" ON public.messages
    FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update messages" ON public.messages
    FOR UPDATE
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Create an index for faster lookups
DROP INDEX IF EXISTS messages_sender_index;
CREATE INDEX IF NOT EXISTS messages_sender_index ON public.messages (sender_email);

DROP INDEX IF EXISTS messages_recipient_index;
CREATE INDEX IF NOT EXISTS messages_recipient_index ON public.messages (recipient_email);

DROP INDEX IF EXISTS messages_created_at_index;
CREATE INDEX IF NOT EXISTS messages_created_at_index ON public.messages (created_at);

-- Enable realtime subscription for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- COMMENT: When moving to production, you'll want to:
-- 1. ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- 2. Create more restrictive policies based on authenticated users 