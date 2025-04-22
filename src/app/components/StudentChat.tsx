import { useState, useEffect, useRef } from "react";
import { FaRegPaperPlane, FaSpinner } from "react-icons/fa";
import {
  fetchMessagesForUser,
  sendMessage,
  markMessagesAsRead,
  subscribeToUserMessages,
  Message,
  testMessageConnection,
} from "@/lib/messages";

interface StudentChatProps {
  userEmail: string;
  userName: string;
}

export default function StudentChat({ userEmail, userName }: StudentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Test database connection when component mounts
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testMessageConnection();
        if (!result.connected) {
          console.log("Message table does not exist:", result.message);
          setTableExists(false);
          setError(
            "Chat system is currently being set up. Please try again later."
          );
        } else {
          setTableExists(true);
        }
      } catch (error) {
        console.error("Error testing message connection:", error);
        setTableExists(false);
        setError("Unable to connect to chat system.");
      }
    };

    testConnection();
  }, []);

  // Fetch previous messages
  useEffect(() => {
    if (!userEmail || !tableExists) return;

    const loadMessages = async () => {
      try {
        const messages = await fetchMessagesForUser(userEmail);
        setMessages(messages);
      } catch (error) {
        console.error("Error loading messages:", error);

        // Check if the error is about missing table
        if (
          error instanceof Error &&
          error.message?.includes("does not exist")
        ) {
          setTableExists(false);
          setError(
            "Chat system is currently being set up. Please try again later."
          );
        } else {
          setError("Failed to load messages");
        }
      }
    };

    loadMessages();
  }, [userEmail, tableExists]);

  // Subscribe to new messages
  useEffect(() => {
    if (!userEmail || !tableExists) return;

    const unsubscribe = subscribeToUserMessages(userEmail, (newMessage) => {
      // When a new message comes in, refresh all messages
      const loadMessages = async () => {
        const messages = await fetchMessagesForUser(userEmail);
        setMessages(messages);
      };
      loadMessages();
    });

    return () => {
      unsubscribe();
    };
  }, [userEmail, tableExists]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isChatOpen && userEmail) {
      markMessagesAsRead(userEmail);
    }
  }, [isChatOpen, userEmail, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !userEmail || !tableExists) return;

    setLoading(true);
    setError(null);
    setStatus("Sending message...");

    try {
      const success = await sendMessage(
        userEmail,
        userName || userEmail,
        "admin@bates.edu", // Default admin email
        newMessage.trim(),
        false // Not an admin message
      );

      if (success) {
        setNewMessage("");
        setStatus("Message sent successfully!");

        // Reload messages to see the sent message
        const messages = await fetchMessagesForUser(userEmail);
        setMessages(messages);

        // Clear status after 3 seconds
        setTimeout(() => setStatus(null), 3000);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);

      // Check for table not existing
      if (error instanceof Error && error.message?.includes("does not exist")) {
        setTableExists(false);
        setError(
          "Chat system is currently being set up. Please try again later."
        );
      } else {
        setError("An error occurred while sending the message.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getUnreadCount = () => {
    return messages.filter((msg) => msg.is_admin && !msg.read).length;
  };

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-batesMaroon text-white p-4 rounded-full shadow-lg hover:bg-red-800 transition-all z-50"
        aria-label="Chat with admin"
      >
        {!isChatOpen ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {getUnreadCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {getUnreadCount()}
              </span>
            )}
          </>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
          <div className="bg-batesMaroon text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Chat with Admin</h3>
            <button onClick={() => setIsChatOpen(false)} className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
            style={{ maxHeight: "40vh" }}
          >
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

            {!tableExists && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 p-3 rounded text-sm mb-2">
                <p className="font-semibold mb-1">
                  Chat System Under Construction
                </p>
                <p>
                  Our messaging system is currently being set up. Please check
                  back later to send messages to administrators.
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
                      <div className="text-center text-xs text-gray-500 my-2">
                        {formatDate(message.created_at)}
                      </div>
                    )}
                    <div
                      className={`flex ${
                        !message.is_admin ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          !message.is_admin
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

          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-700 flex flex-col gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                tableExists
                  ? "Type a message..."
                  : "Chat system under maintenance..."
              }
              className="flex-1 rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
              disabled={loading || !tableExists}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim() || !tableExists}
              className="bg-batesMaroon hover:bg-red-800 text-white rounded-md p-2 disabled:opacity-50 w-full flex justify-center items-center"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaRegPaperPlane className="mr-2" /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
