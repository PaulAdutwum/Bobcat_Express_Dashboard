#!/bin/bash

# Setup for messages table in Supabase database
echo "Setting up messages table in Supabase..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Create a .env file with SUPABASE_URL and SUPABASE_KEY."
  exit 1
fi

# Source the environment variables
export $(grep -v '^#' .env | xargs)

# Check if keys are available
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase URL or key not found in .env file."
  echo "Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set."
  exit 1
fi

# Check if create_messages_table.sql exists
if [ ! -f create_messages_table.sql ]; then
  echo "Error: create_messages_table.sql not found."
  exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI not found. Installing..."
  # This installs the Supabase CLI
  npm install -g supabase
fi

echo "Running SQL script to create messages table..."

# Option 1: Using supabase CLI (preferred if authenticated)
# supabase db execute -f create_messages_table.sql

# Option 2: Using curl to call Supabase REST API
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat create_messages_table.sql | tr -d '\n' | sed 's/"/\\"/g')\"}"

echo ""
echo "Messages table setup complete! You should now be able to use the chat functionality."
echo "If you're still seeing errors, make sure your Supabase database has the UUID extension enabled." 