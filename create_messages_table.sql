-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_email ON public.messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_email ON public.messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow reading messages where user is either sender or recipient
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        auth.email() = sender_email OR 
        auth.email() = recipient_email
    );

-- Policy to allow inserting messages
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.email() = sender_email
    );

-- Policy to allow updating read status on messages
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (
        auth.email() = recipient_email
    );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add comment to describe the table
COMMENT ON TABLE public.messages IS 'Stores chat messages between users and administrators'; 