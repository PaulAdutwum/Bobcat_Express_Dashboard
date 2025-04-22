# Messages Table Setup Instructions

This document explains how to set up the required `messages` table in your Supabase database to enable the chat functionality.

## Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Navigate to the SQL Editor in the left sidebar
4. Click "New Query"
5. Paste the following SQL code:

```sql
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
```

6. Click "Run" to execute the SQL

## Option 2: Using the Setup Script

If you prefer using the command line:

1. Make sure you have the `create_messages_table.sql` file in your project root
2. Make sure your `.env` file contains the Supabase URL and API key
3. Run the setup script:

```bash
./setup-messages-table.sh
```

## Verifying the Setup

To confirm that your messages table was created correctly:

1. In the Supabase Dashboard, go to the "Table Editor" in the left sidebar
2. You should see a table named "messages" with the correct columns
3. Try sending a test message in your application

## Troubleshooting

If you're still seeing errors:

1. Make sure the UUID extension is enabled in your database
2. Check that your application has the correct Supabase URL and key
3. Ensure realtime features are enabled in your Supabase project settings
4. Check the browser console for more detailed error messages

## Table Schema Reference

| Column Name     | Type        | Description                          |
| --------------- | ----------- | ------------------------------------ |
| id              | UUID        | Primary key, auto-generated          |
| sender_email    | TEXT        | Email of the message sender          |
| sender_name     | TEXT        | Display name of the sender           |
| recipient_email | TEXT        | Email of the message recipient       |
| content         | TEXT        | The message content                  |
| is_admin        | BOOLEAN     | Whether the message is from an admin |
| read            | BOOLEAN     | Whether the message has been read    |
| created_at      | TIMESTAMPTZ | When the message was created         |
| updated_at      | TIMESTAMPTZ | When the message was last updated    |
