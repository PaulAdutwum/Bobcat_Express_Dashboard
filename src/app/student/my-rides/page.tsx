"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaCar,
  FaShuttleVan,
} from "react-icons/fa";

// Define Ride type locally to avoid import issues
interface Ride {
  id: string;
  student_name: string;
  pickup_location: string;
  destination: string;
  passengers: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;
  special_instructions?: string;
  user_email?: string;
}

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MyRidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        loadRides(currentUser.email || "");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadRides = async (email: string) => {
    try {
      setLoading(true);

      // Validate email
      if (!email) {
        console.warn("No email provided to loadRides function");
        setRides([]);
        setLoading(false);
        return;
      }

      console.log(`Fetching rides for student with email: ${email}`);

      // Sanitize email
      const sanitizedEmail = email.trim().toLowerCase();

      // Query for rides that might contain this email in special_instructions
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .ilike("special_instructions", `%${sanitizedEmail}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rides:", error);
        console.log("Full error details:", JSON.stringify(error));
        setRides([]);
      } else if (!data || data.length === 0) {
        console.log(`No rides found for ${email}`);

        // For development purposes only, provide mock data for development
        if (process.env.NODE_ENV === "development") {
          console.log("Using mock ride data for development");
          const mockRides = [
            {
              id: "mock-1",
              student_name: "Test Student",
              pickup_location: "Commons",
              destination: "Library",
              passengers: 1,
              status: "pending",
              created_at: new Date().toISOString(),
              special_instructions: `User Email: ${sanitizedEmail}`,
            },
            {
              id: "mock-2",
              student_name: "Test Student",
              pickup_location: "Dorm",
              destination: "Commons",
              passengers: 2,
              status: "completed",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              special_instructions: `User Email: ${sanitizedEmail}`,
            },
          ] as Ride[];
          setRides(mockRides);
        } else {
          setRides([]);
        }
      } else {
        // Filter to ensure exact email match in special_instructions
        const filteredRides = data.filter((ride) =>
          ride.special_instructions?.includes(`User Email: ${sanitizedEmail}`)
        );

        console.log(`Found ${filteredRides.length} rides for ${email}`);
        setRides(filteredRides);
      }
    } catch (error) {
      console.error("Exception in loadRides:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for this student's rides
  useEffect(() => {
    if (!user?.email) return;

    const email = user.email.trim().toLowerCase();
    console.log(`Setting up subscription for rides (email: ${email})`);

    // Create a unique channel name based on the email (avoid special characters)
    const channelName = `rides-by-email-${email.replace(/[^a-zA-Z0-9]/g, "-")}`;

    try {
      // Since we can't use user_email filter (column doesn't exist),
      // we'll subscribe to all ride changes and filter in the loadRides function
      const subscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rides",
          },
          async (payload) => {
            console.log(
              `Received real-time update for rides, checking if relevant to ${email}`
            );

            // When changes occur, reload the rides to check for relevant updates
            await loadRides(email);
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${channelName}: ${status}`);
        });

      console.log(
        `Subscription active for rides (filtered by email: ${email})`
      );

      return () => {
        console.log(`Unsubscribing from ride updates`);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      // No need to throw, just log the error and continue
      return () => {}; // Empty cleanup function
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded flex items-center gap-1">
            <FaHourglassHalf className="text-xs" /> Pending
          </span>
        );
      case "active":
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded flex items-center gap-1">
            <FaCar className="text-xs" /> Active
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded flex items-center gap-1">
            <FaCheckCircle className="text-xs" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded flex items-center gap-1">
            <FaTimesCircle className="text-xs" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Rides</h1>

      {showSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6 flex items-center">
          <FaCheckCircle className="mr-2" />
          Your ride request has been submitted successfully!
        </div>
      )}

      {loading ? (
        <div className="text-center p-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-batesMaroon border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-white">Loading your rides...</p>
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-[var(--batesCard)] rounded-lg p-12 border border-[var(--batesBorder)] text-center">
          <FaCar className="mx-auto text-4xl text-gray-500 mb-4" />
          <h2 className="text-xl text-white mb-2">No Rides Yet</h2>
          <p className="text-gray-400 mb-4">
            You haven't requested any rides yet.
          </p>
          <button
            onClick={() => router.push("/student/request-ride")}
            className="bg-batesMaroon text-white px-4 py-2 rounded-lg hover:bg-batesMaroon/90 transition-colors"
          >
            Request a Ride
          </button>
        </div>
      ) : (
        <div className="bg-[var(--batesCard)] rounded-lg border border-[var(--batesBorder)] overflow-hidden">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-white">
              <thead className="bg-[var(--batesBlue)]">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">From</th>
                  <th className="p-4 text-left">To</th>
                  <th className="p-4 text-left">Passengers</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--batesBorder)]">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-[var(--batesBlue)]/20">
                    <td className="p-4">{formatDate(ride.created_at)}</td>
                    <td className="p-4">{ride.pickup_location}</td>
                    <td className="p-4">{ride.destination}</td>
                    <td className="p-4">{ride.passengers}</td>
                    <td className="p-4">{getStatusBadge(ride.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - card style */}
          <div className="md:hidden">
            <div className="divide-y divide-[var(--batesBorder)]">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className="p-4 hover:bg-[var(--batesBlue)]/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-gray-400 text-sm">
                      {formatDate(ride.created_at)}
                    </span>
                    {getStatusBadge(ride.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-gray-400 text-xs">From</p>
                      <p className="text-white">{ride.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">To</p>
                      <p className="text-white">{ride.destination}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Passengers</p>
                      <p className="text-white">{ride.passengers}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick action button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => router.push("/student/request-ride")}
          className="bg-batesMaroon text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          aria-label="Request new ride"
        >
          <FaShuttleVan size={24} />
        </button>
      </div>
    </div>
  );
}
