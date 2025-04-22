import { useState, useEffect, useRef } from "react";
import {
  FaRegPaperPlane,
  FaSpinner,
  FaChevronLeft,
  FaCircle,
  FaExclamationTriangle,
  FaTools,
} from "react-icons/fa";
import {
  fetchMessagesForUser,
  sendMessage,
  markMessagesAsRead,
  getAllChatUsers,
  subscribeToUserMessages,
  testMessageConnection,
  Message,
} from "@/lib/messages";

interface ChatUser {
  email: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function AdminChat() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Test database connection when component mounts
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testMessageConnection();
        if (!result.connected) {
          console.log("Message table does not exist:", result.message);
          setTableExists(false);
          setError(
            "Chat system is currently being set up. Database tables need to be created."
          );
        } else {
          setTableExists(true);
        }
      } catch (error) {
        console.error("Error testing message connection:", error);
        setTableExists(false);
        setError("Unable to connect to chat system database.");
      }
    };

    testConnection();
  }, []);

  // Fetch all users with chat history
  useEffect(() => {
    if (!tableExists) return;

    const fetchChatUsers = async () => {
      try {
        const userList = await getAllChatUsers();
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching chat users:", error);

        // Check if the error is about missing table
        if (
          error instanceof Error &&
          error.message?.includes("does not exist")
        ) {
          setTableExists(false);
          setError("Chat system database tables need to be created.");
        }
      }
    };

    fetchChatUsers();

    // Set up subscription to messages table for admin
    const adminEmail = "admin@bates.edu";
    try {
      const unsubscribe = subscribeToUserMessages(adminEmail, (newMessage) => {
        // Refresh user list when messages change
        fetchChatUsers();

        // Also refresh current conversation if active
        if (activeChat) {
          fetchMessages(activeChat);
        }
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up message subscription:", error);
      if (error instanceof Error && error.message?.includes("does not exist")) {
        setTableExists(false);
        setError("Chat system database tables need to be created.");
      }
      return () => {};
    }
  }, [activeChat, tableExists]);

  // Fetch messages for active chat
  const fetchMessages = async (userEmail: string) => {
    if (!tableExists) return;

    try {
      setLoading(true);
      setError(null);
      setStatus("Loading messages...");

      // Get all messages where either the sender or recipient is this user
      const messages = await fetchMessagesForUser(userEmail);
      setMessages(messages);

      // Mark messages as read
      await markMessagesAsRead("admin@bates.edu");

      // Update unread count in users list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.email === userEmail ? { ...user, unreadCount: 0 } : user
        )
      );

      setStatus(null);
    } catch (error) {
      console.error("Error in fetchMessages:", error);

      // Check if the error is about missing table
      if (error instanceof Error && error.message?.includes("does not exist")) {
        setTableExists(false);
        setError("Chat system database tables need to be created.");
      } else {
        setError("Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  };

  // Set active chat and fetch messages
  const selectChat = (userEmail: string) => {
    if (!tableExists) return;

    setActiveChat(userEmail);
    fetchMessages(userEmail);
  };

  // Send message to user
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !activeChat || !tableExists) return;

    setLoading(true);
    setError(null);
    setStatus("Sending message...");

    try {
      // Find user details
      const user = users.find((u) => u.email === activeChat);

      if (!user) {
        setError("User not found");
        return;
      }

      const success = await sendMessage(
        "admin@bates.edu",
        "Bates Admin",
        activeChat,
        newMessage.trim(),
        true // This is an admin message
      );

      if (success) {
        setNewMessage("");
        setStatus("Message sent successfully!");
        // Refresh messages to see the sent message
        fetchMessages(activeChat);

        // Clear status after 3 seconds
        setTimeout(() => setStatus(null), 3000);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);

      // Check if the error is about missing table
      if (error instanceof Error && error.message?.includes("does not exist")) {
        setTableExists(false);
        setError("Chat system database tables need to be created.");
      } else {
        setError("An error occurred while sending the message.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format utilities
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getActiveUser = () => {
    return users.find((user) => user.email === activeChat);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      <div className="bg-gray-800 text-white p-4 font-semibold text-lg border-b border-gray-700 flex justify-between items-center">
        <span>Admin Message Center</span>
        {!tableExists && (
          <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded flex items-center">
            <FaTools className="mr-1" /> Setup Required
          </div>
        )}
      </div>

      {!tableExists && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4 text-yellow-300">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">
                Database Setup Required
              </h3>
              <p className="mb-2">
                The messaging system database tables need to be created. Please
                run the SQL script to create the necessary tables.
              </p>
              <ol className="list-decimal ml-5 text-sm space-y-1 text-yellow-400">
                <li>
                  Create a table named 'messages' in your Supabase database
                </li>
                <li>
                  Make sure it includes fields for: id, sender_email,
                  sender_name, recipient_email, content, is_admin, read,
                  created_at, updated_at
                </li>
                <li>Set up proper indexes and permissions</li>
                <li>Enable realtime subscriptions for the table</li>
              </ol>
              <p className="mt-2 text-sm">
                See the SQL script in your project for detailed setup
                instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* User list sidebar */}
        <div
          className={`w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0 ${
            activeChat ? "hidden md:block" : "block"
          }`}
        >
          <div className="p-3 text-gray-300 border-b border-gray-700">
            <h3 className="font-medium">Student Conversations</h3>
          </div>
          <div className="overflow-y-auto h-[calc(100%-3rem)]">
            {!tableExists ? (
              <div className="p-4 text-gray-400 text-center">
                <FaTools className="mx-auto mb-2 text-xl text-gray-500" />
                <p>Database setup required</p>
                <p className="text-xs mt-2 text-gray-500">
                  Run the SQL script to create necessary tables
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                No conversations yet
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.email}
                  onClick={() => selectChat(user.email)}
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700 ${
                    activeChat === user.email ? "bg-gray-700" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-white">{user.name}</div>
                    {user.unreadCount > 0 && (
                      <div className="bg-batesMaroon rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {user.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 truncate mt-1">
                    {user.lastMessage}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(user.lastMessageTime)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center">
                <button
                  className="md:hidden mr-2 text-gray-400 hover:text-white"
                  onClick={() => setActiveChat(null)}
                >
                  <FaChevronLeft />
                </button>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-white">
                      {getActiveUser()?.name}
                    </span>
                    <span className="ml-2 flex items-center text-green-500 text-xs">
                      <FaCircle className="w-2 h-2 mr-1" /> Online
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{activeChat}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-2 rounded text-sm mb-2">
                    {error}
                  </div>
                )}

                {status && (
                  <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 p-2 rounded text-sm mb-2">
                    {status}
                  </div>
                )}

                {loading && !status && (
                  <div className="flex justify-center py-4">
                    <FaSpinner className="animate-spin text-white" />
                  </div>
                )}

                {!tableExists && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 p-3 rounded text-sm my-4">
                    <p className="font-semibold mb-1">
                      Database Setup Required
                    </p>
                    <p>
                      The messaging system database needs to be configured
                      before you can chat with students.
                    </p>
                  </div>
                )}

                {messages.length === 0 && !loading && tableExists ? (
                  <div className="text-gray-400 text-center py-8">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  tableExists &&
                  messages.map((message, index) => {
                    // Check if we need to show date separator
                    const showDate =
                      index === 0 ||
                      formatDate(message.created_at) !==
                        formatDate(messages[index - 1].created_at);

                    return (
                      <div key={message.id || index}>
                        {showDate && (
                          <div className="text-center text-xs text-gray-500 my-4">
                            {formatDate(message.created_at)}
                          </div>
                        )}
                        <div
                          className={`flex ${
                            message.is_admin ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 ${
                              message.is_admin
                                ? "bg-batesMaroon text-white rounded-br-none"
                                : "bg-gray-700 text-white rounded-bl-none"
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            <div className="text-xs text-gray-300 text-right mt-1">
                              {formatTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-700 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    tableExists
                      ? "Type a message..."
                      : "Database setup required..."
                  }
                  className="flex-1 rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2"
                  disabled={loading || !tableExists}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim() || !tableExists}
                  className="bg-batesMaroon hover:bg-red-800 text-white rounded-md px-4 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaRegPaperPlane /> Send
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                {!tableExists ? (
                  <div>
                    <FaTools className="text-4xl text-yellow-500 mx-auto mb-4" />
                    <div className="text-yellow-300 mb-2 font-semibold">
                      Database Setup Required
                    </div>
                    <div className="text-sm text-gray-400 mb-6 max-w-md">
                      The messaging system database needs to be configured.
                      Check the console for errors and run the SQL script to
                      create the necessary tables.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 mb-2">
                      Select a conversation to start chatting
                    </div>
                    <div className="text-sm text-gray-500">
                      All student messages will appear here
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
