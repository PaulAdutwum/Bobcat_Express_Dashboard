import { useState } from "react";
import { testMessageConnection, supabase } from "@/lib/messages";

export default function MessageConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    connectionTest?: {
      connected: boolean;
      message: string;
      details?: any;
    };
    directInsert?: {
      success: boolean;
      message: string;
      details?: any;
    };
  } | null>(null);

  async function runTest() {
    setLoading(true);
    setResults(null);

    try {
      console.log("MessageConnectionTest: Running test...");
      console.log("Supabase client details:", {
        authenticated: !!(await supabase.auth.getUser())?.data?.user,
        authUid:
          (await supabase.auth.getUser())?.data?.user?.id ||
          "not authenticated",
      });

      // Try the standard connection test first
      const testResult = await testMessageConnection();
      console.log("MessageConnectionTest: Test result:", testResult);

      if (testResult.connected) {
        setResults({ connectionTest: testResult });
        setLoading(false);
        return;
      }

      // If standard test fails, try a direct insert
      console.log(
        "MessageConnectionTest: Standard test failed, trying direct insert..."
      );

      // Attempt direct insert
      const { error } = await supabase.from("messages").insert({
        sender_id: "test-connection",
        recipient_id: "test-connection",
        content: "Test message from connection test",
        timestamp: new Date().toISOString(),
      });

      setResults((prev) => ({
        ...(prev || {}),
        connectionTest: testResult,
        directInsert: {
          success: !error,
          message: error
            ? `Direct insert failed: ${error.message}`
            : "Direct insert succeeded",
          details: error ? error : undefined,
        },
      }));
    } catch (err: any) {
      console.error("Error in message connection test:", err);
      setResults((prev) => ({
        ...(prev || {}),
        connectionTest: {
          connected: false,
          message: `Test failed with exception: ${
            err?.message || "Unknown error"
          }`,
        },
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <h3 className="text-lg font-semibold mb-4">
        Message Database Connection Test
      </h3>

      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Run Test"}
      </button>

      {results && (
        <div className="mt-4">
          <h4 className="font-medium">Results:</h4>

          {results.connectionTest && (
            <div className="mt-2 p-3 border rounded bg-gray-50">
              <p
                className={
                  results.connectionTest.connected
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                <strong>Connection Test:</strong>{" "}
                {results.connectionTest.message}
              </p>
              {results.connectionTest.details && (
                <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {JSON.stringify(results.connectionTest.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {results.directInsert && (
            <div className="mt-2 p-3 border rounded bg-gray-50">
              <p
                className={
                  results.directInsert.success
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                <strong>Direct Insert:</strong> {results.directInsert.message}
              </p>
              {results.directInsert.details && (
                <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {JSON.stringify(results.directInsert.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {results.connectionTest && !results.connectionTest.connected && (
            <div className="mt-4 p-3 border border-yellow-300 rounded bg-yellow-50">
              <h5 className="font-medium text-yellow-800">Possible fixes:</h5>
              <ul className="list-disc ml-5 mt-2 text-sm text-yellow-800">
                <li>
                  Check that Supabase environment variables are correctly set
                </li>
                <li>
                  Verify the messages table exists in your Supabase project
                </li>
                <li>
                  Check Row Level Security (RLS) policies for the messages table
                </li>
                <li>
                  Ensure your Supabase client is authenticated if required by
                  RLS
                </li>
                <li>Check network connectivity to Supabase</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
