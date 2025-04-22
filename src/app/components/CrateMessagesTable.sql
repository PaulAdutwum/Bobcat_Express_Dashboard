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

-- Add RLS policies for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow all users to insert messages (for students to contact admin)
CREATE POLICY "Anyone can add messages" ON public.messages
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy to allow users to read their own messages
CREATE POLICY "Users can view messages where they are the sender or recipient" ON public.messages
    FOR SELECT
    TO public
    USING (sender_email = current_user OR recipient_email = current_user);

-- Policy to allow users to update only their own messages (mark as read)
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE
    TO public
    USING (recipient_email = current_user);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS messages_sender_index ON public.messages (sender_email);
CREATE INDEX IF NOT EXISTS messages_recipient_index ON public.messages (recipient_email);
CREATE INDEX IF NOT EXISTS messages_created_at_index ON public.messages (created_at);

-- Enable realtime subscription for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; 