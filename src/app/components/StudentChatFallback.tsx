import { useState, useEffect } from "react";
import { FaInfoCircle, FaDatabase } from "react-icons/fa";
import { testMessageConnection } from "@/lib/messages";

interface StudentChatFallbackProps {
  userEmail: string;
  userName: string;
}

export default function StudentChatFallback({
  userEmail,
  userName,
}: StudentChatFallbackProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [checkingTable, setCheckingTable] = useState(true);

  // Test database connection when component mounts
  useEffect(() => {
    const testConnection = async () => {
      try {
        setCheckingTable(true);
        const result = await testMessageConnection();
        setTableExists(result.connected);
      } catch (error) {
        console.error("Error testing message connection:", error);
        setTableExists(false);
      } finally {
        setCheckingTable(false);
      }
    };

    testConnection();
  }, []);

  const isAdmin =
    typeof document !== "undefined" && document.cookie.includes("admin=true");

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-batesMaroon text-white p-4 rounded-full shadow-lg hover:bg-red-800 transition-all z-50"
        aria-label="Chat with admin"
      >
        {!isChatOpen ? (
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
        <div className="fixed bottom-20 right-6 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 flex flex-col">
          <div className="bg-batesMaroon text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Chat System</h3>
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

          <div className="p-4 flex flex-col">
            {checkingTable ? (
              <div className="flex flex-col items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-batesMaroon mb-3"></div>
                <p className="text-gray-300">Checking chat system status...</p>
              </div>
            ) : (
              <>
                {tableExists === false && (
                  <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <FaDatabase className="text-yellow-500 mr-2" />
                      <h3 className="font-medium text-white">
                        Chat System Setup Required
                      </h3>
                    </div>

                    {isAdmin ? (
                      <>
                        <p className="text-gray-300 mb-3">
                          The chat system needs to be set up. Please follow
                          these steps:
                        </p>
                        <ol className="list-decimal pl-5 text-gray-300 space-y-2 mb-4">
                          <li>
                            Log in to your{" "}
                            <a
                              href="https://app.supabase.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              Supabase dashboard
                            </a>
                          </li>
                          <li>Go to the SQL Editor</li>
                          <li>Create a new query</li>
                          <li>
                            Copy and run the SQL from the{" "}
                            <code className="bg-gray-700 px-1 rounded">
                              create-messages-table.sql
                            </code>{" "}
                            file
                          </li>
                          <li>Refresh this page after completing setup</li>
                        </ol>
                        <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded text-sm text-yellow-200">
                          <p className="flex items-center">
                            <FaInfoCircle className="mr-2 flex-shrink-0" />
                            <span>
                              This message is only visible to administrators.
                            </span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-300">
                        Chat functionality is currently being set up. Please
                        check back later.
                      </p>
                    )}
                  </div>
                )}

                {tableExists === true && (
                  <div className="bg-green-800/30 border border-green-800 p-4 rounded-lg">
                    <p className="text-green-200 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Chat system is properly configured!
                    </p>
                    <p className="text-gray-300 mt-2">
                      Please refresh the page to load the full chat
                      functionality.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
