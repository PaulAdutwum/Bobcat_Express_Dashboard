import { createClient } from '@supabase/supabase-js';

// Ensure we have valid supabase URL and key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing - messages functionality will not work');
}

// Create a singleton supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Message {
  id: string;
  sender_email: string;
  sender_name: string;
  recipient_email: string;
  content: string;
  is_admin: boolean;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch messages for a specific user (either as sender or recipient)
 */
export async function fetchMessagesForUser(email: string): Promise<Message[]> {
  console.log(`Fetching messages for user: ${email}`);
  
  if (!email) {
    console.error('No email provided to fetchMessagesForUser');
    return [];
  }

  try {
    // Fix OR query syntax with proper filter format
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages for user:', JSON.stringify(error));
      return [];
    }

    console.log(`Found ${data.length} messages for ${email}`);
    return data;
  } catch (error) {
    console.error('Error fetching messages for user:', error);
    return [];
  }
}

/**
 * Send a message from one user to another
 */
export async function sendMessage(
  sender_email: string,
  sender_name: string,
  recipient_email: string,
  content: string,
  is_admin: boolean
): Promise<boolean> {
  if (!sender_email || !recipient_email) {
    console.error('Missing sender or recipient email');
    return false;
  }

  try {
    const newMessage = {
      sender_email,
      sender_name,
      recipient_email,
      content,
      is_admin,
      read: false,
    };

    console.log('Sending message:', newMessage);
    
    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', JSON.stringify(error));
      return false;
    }

    console.log('Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending message:', JSON.stringify(error));
    return false;
  }
}

/**
 * Mark messages as read for a specific recipient
 */
export async function markMessagesAsRead(userEmail: string): Promise<{ success: boolean; error?: any }> {
  if (!userEmail) {
    console.error('Missing user email');
    return { success: false, error: 'Missing user email' };
  }

  try {
    console.log(`Marking messages as read for recipient: ${userEmail}`);
    
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_email', userEmail)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error };
    }

    console.log('Successfully marked messages as read');
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
}

/**
 * Subscribe to messages for a specific user
 */
export function subscribeToUserMessages(
  email: string,
  callback: (message: Message) => void
): () => void {
  if (!email) {
    console.error('No email provided to subscribeToUserMessages');
    return () => {};
  }

  console.log(`Setting up subscription for messages for: ${email}`);

  // Use correct filter format for real-time subscriptions
  const channel = supabase.channel('messages-changes');
  
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_email=eq.${email}`
      },
      (payload) => {
        console.log('Received new message for recipient:', payload);
        callback(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_email=eq.${email}`
      },
      (payload) => {
        console.log('Received new message from sender:', payload);
        callback(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for ${email}: ${status}`);
    });

  return () => {
    console.log(`Unsubscribing from messages for ${email}`);
    channel.unsubscribe();
  };
}

/**
 * Get all users who have conversations with admin
 */
export async function getAllChatUsers(): Promise<{
  email: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}[]> {
  try {
    const adminEmail = 'admin@bates.edu';
    
    console.log('Fetching all users with conversations with admin');
    
    // Fixed: Using proper filter expressions
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_email.eq.${adminEmail},recipient_email.eq.${adminEmail}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat users:', JSON.stringify(error));
      return [];
    }

    console.log(`Found ${data?.length || 0} total messages involving admin`);

    // Create a map of users with their latest message and unread count
    const userMap = new Map<string, {
      email: string;
      name: string;
      lastMessage: string;
      lastMessageTime: string;
      unreadCount: number;
    }>();
    
    // Process messages to get unique users and their last message
    data?.forEach(message => {
      // Skip admin-to-admin messages
      if (message.sender_email === adminEmail && 
          message.recipient_email === adminEmail) {
        return;
      }
      
      // The student email is either the sender or recipient
      const studentEmail = message.sender_email === adminEmail 
        ? message.recipient_email 
        : message.sender_email;
        
      const studentName = message.sender_email === adminEmail
        ? message.recipient_email // We don't know their name in this case
        : message.sender_name;
        
      if (!userMap.has(studentEmail)) {
        userMap.set(studentEmail, {
          email: studentEmail,
          name: studentName || studentEmail,
          lastMessage: message.content,
          lastMessageTime: message.created_at,
          unreadCount: (message.recipient_email === adminEmail && !message.read) ? 1 : 0
        });
      } else if (message.recipient_email === adminEmail && !message.read) {
        // Update unread count if message is unread
        const user = userMap.get(studentEmail)!;
        user.unreadCount += 1;
        userMap.set(studentEmail, user);
      }
    });

    // Convert map to array and sort by latest message
    const userList = Array.from(userMap.values()).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
    
    console.log(`Processed ${userList.length} unique users with conversations`);
    return userList;
  } catch (error) {
    console.error('Error getting chat users:', JSON.stringify(error));
    return [];
  }
}

/**
 * Test the connection to the messages table
 * @returns Object with connection test results
 */
export async function testMessageConnection() {
  console.log('Testing message database connection...');
  
  try {
    // Test connection to messages table with simple query
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Message connection test failed:', JSON.stringify(error));
      
      return {
        connected: false,
        message: `Connection failed: ${error.message}`,
        details: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }
      };
    }
    
    return {
      connected: true,
      message: 'Successfully connected to messages table',
      details: { count: Array.isArray(data) ? data.length : 0 }
    };
  } catch (err: any) {
    console.error('Unexpected error testing message connection:', JSON.stringify(err));
    
    return {
      connected: false,
      message: `Unexpected error: ${err.message || 'Unknown error'}`,
      details: err
    };
  }
}

export async function fetchMessages(userEmail: string): Promise<{ success: boolean; data?: Message[]; error?: any }> {
  if (!userEmail) {
    console.error('Missing user email');
    return { success: false, error: 'Missing user email' };
  }

  try {
    console.log(`Fetching messages for user: ${userEmail}`);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`recipient_email.eq.${userEmail},sender_email.eq.${userEmail}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', JSON.stringify(error));
      return { success: false, error };
    }

    // Ensure data is an array and typed as Message[]
    const messages: Message[] = data || [];
    console.log(`Successfully fetched ${messages.length} messages`);
    return { success: true, data: messages };
  } catch (error) {
    console.error('Error fetching messages:', JSON.stringify(error));
    return { success: false, error };
  }
} 