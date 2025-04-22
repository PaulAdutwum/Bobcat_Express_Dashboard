# Chat Feature Setup Guide

This guide explains how to set up the real-time chat feature between students and admins in the Bates Shuttle application.

## Prerequisites

1. Make sure your Supabase project is properly set up.
2. Update your `.env.local` file with proper Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Setup

1. Run the database migration to create the messages table:

   ```bash
   # Install dependencies if you haven't already
   npm install

   # Set environment variables (use your actual Supabase credentials)
   export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   export SUPABASE_SERVICE_KEY=your_supabase_service_key

   # Run the migration script
   node src/scripts/run-migrations.js
   ```

   If you prefer, you can also manually run the SQL in `src/database/migrations/messages.sql` in the Supabase SQL Editor.

2. Verify that the `messages` table has been created in your Supabase dashboard.

3. Make sure Realtime is enabled for the messages table in Supabase.

## Troubleshooting

If you encounter issues with the chat functionality, try the following steps:

1. **Check Console Errors**: Look for specific error messages in the browser console.

2. **Empty/Undefined Error Objects**: If you see `Error sending message: {}` or similar errors with empty objects:

   - This usually means the RLS (Row-Level Security) policies are preventing the operation.
   - Check that the SQL migration has been properly applied
   - Verify your authentication is working properly
   - Make sure the Supabase client is initialized before use

3. **Messages Not Updating in Real-time**:

   - Make sure Realtime is enabled for the messages table
   - Verify the channel subscription is working properly
   - Check that your Supabase plan supports the number of realtime connections you're using

4. **Database Schema Issues**:

   If you need to manually create or update the messages table, use this SQL:

   ```sql
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
   ```

## How It Works

The chat feature consists of two main components:

1. **StudentChat**: A floating chat button on the student dashboard that allows students to send messages to admins and view admin responses.

2. **AdminChat**: A message center in the admin dashboard where admins can see all student conversations and respond to them.

Messages are stored in the Supabase `messages` table and synchronized in real-time using Supabase's Realtime functionality. This enables instant message delivery without page refreshes.

## Key Files

- `src/app/components/StudentChat.tsx`: The student-facing chat component
- `src/app/components/AdminChat.tsx`: The admin-facing chat dashboard
- `src/lib/messages.ts`: Utility functions for message handling
- `src/database/migrations/messages.sql`: SQL schema for the messages table
- `src/app/dashboard/chat/page.tsx`: Admin chat page
- `src/lib/supabase.ts`: Supabase client initialization
- `src/scripts/run-migrations.js`: Migration script
