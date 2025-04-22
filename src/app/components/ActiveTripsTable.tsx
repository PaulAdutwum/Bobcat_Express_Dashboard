"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaSpinner,
  FaCarSide,
  FaUser,
  FaMapMarkerAlt,
  FaCircle,
  FaEllipsisH,
  FaClock,
  FaCalendarAlt,
  FaArrowRight,
  FaCheck,
  FaTrash,
  FaInfoCircle,
} from "react-icons/fa";
import { Ride } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { createClient } from "@supabase/supabase-js";
import {
  fetchRides,
  updateRideStatus,
  deleteRide,
  subscribeToRides,
  archiveRide,
  archiveCompletedRides,
} from "@/lib/supabase";
import {
  RealtimePostgresChangesPayload,
  RealtimeChannel,
} from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

// Safely access localStorage with browser environment check
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  },
};

// Store archived ride IDs in localStorage to prevent them from reappearing
const getArchivedRideIds = (): string[] => {
  const storedIds = safeLocalStorage.getItem("archivedRideIds");

  if (!storedIds) {
    return [];
  }

  // Parse the stored JSON
  try {
    const parsed = JSON.parse(storedIds);

    // Validate that it's actually an array of strings
    if (Array.isArray(parsed)) {
      // Filter out any non-string values
      return parsed.filter((id) => typeof id === "string");
    } else {
      console.error(
        "Archived ride IDs in localStorage is not an array:",
        parsed
      );
      // Reset localStorage since it's corrupted
      safeLocalStorage.setItem("archivedRideIds", JSON.stringify([]));
      return [];
    }
  } catch (parseError) {
    console.error(
      "Error parsing archived ride IDs from localStorage:",
      parseError
    );
    // Reset localStorage since it's corrupted
    safeLocalStorage.setItem("archivedRideIds", JSON.stringify([]));
    return [];
  }
};

const addArchivedRideId = (id: string): void => {
  try {
    const ids = getArchivedRideIds();
    if (!ids.includes(id)) {
      ids.push(id);
      safeLocalStorage.setItem("archivedRideIds", JSON.stringify(ids));
    }
  } catch (error) {
    console.error("Error saving archived ride ID to localStorage:", error);
  }
};

// New function to get and manage seen ride IDs
const getSeenRideIds = (): string[] => {
  const storedIds = safeLocalStorage.getItem("seenRideIds");

  if (!storedIds) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedIds);

    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === "string");
    } else {
      console.error("Seen ride IDs in localStorage is not an array:", parsed);
      safeLocalStorage.setItem("seenRideIds", JSON.stringify([]));
      return [];
    }
  } catch (parseError) {
    console.error("Error parsing seen ride IDs from localStorage:", parseError);
    safeLocalStorage.setItem("seenRideIds", JSON.stringify([]));
    return [];
  }
};

const addSeenRideId = (id: string): void => {
  try {
    const ids = getSeenRideIds();
    if (!ids.includes(id)) {
      ids.push(id);
      safeLocalStorage.setItem("seenRideIds", JSON.stringify(ids));
    }
  } catch (error) {
    console.error("Error saving seen ride ID to localStorage:", error);
  }
};

const clearSeenRides = (): void => {
  try {
    safeLocalStorage.setItem("seenRideIds", JSON.stringify([]));
  } catch (error) {
    console.error("Error clearing seen ride IDs in localStorage:", error);
  }
};

export default function RideManagement() {
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [completedRides, setCompletedRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastCompletedRideId, setLastCompletedRideId] = useState<string | null>(
    null
  );
  const [archivedRideIds, setArchivedRideIds] = useState<string[]>([]);
  const [seenRideIds, setSeenRideIds] = useState<string[]>([]);
  const [freshStart, setFreshStart] = useState<boolean>(false);
  const [processedUpdates, setProcessedUpdates] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null); // Properly type the ref

  // Reference to the completed rides section for smooth scrolling
  const completedSectionRef = useRef<HTMLDivElement>(null);

  // Use a ref to track current ride lists without triggering rerenders
  const ridesRef = useRef({
    active: activeRides,
    pending: pendingRides,
    completed: completedRides,
  });

  // Load localStorage data only after component mounts
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setArchivedRideIds(getArchivedRideIds());
      setSeenRideIds(getSeenRideIds());

      // Check if fresh start mode was previously set
      const storedFreshStart = safeLocalStorage.getItem("freshStartMode");
      if (storedFreshStart) {
        try {
          setFreshStart(JSON.parse(storedFreshStart));
        } catch (e) {
          console.error("Error parsing freshStartMode from localStorage:", e);
        }
      }
    }
  }, []);

  // Update the ref whenever the ride states change
  useEffect(() => {
    ridesRef.current = {
      active: activeRides,
      pending: pendingRides,
      completed: completedRides,
    };
  }, [activeRides, pendingRides, completedRides]);

  // Memoize the filter function to prevent unnecessary recalculations
  const filterRides = useCallback(
    (rides: Ride[]): Ride[] => {
      return rides
        .filter((ride) => ride.status !== "archived")
        .filter((ride) => !archivedRideIds.includes(ride.id))
        .filter((ride) => (freshStart ? !seenRideIds.includes(ride.id) : true));
    },
    [archivedRideIds, seenRideIds, freshStart]
  );

  // Batched update function to reduce re-renders
  const updateRideState = useCallback(
    (
      newActiveRides?: Ride[],
      newPendingRides?: Ride[],
      newCompletedRides?: Ride[]
    ) => {
      // Use a single render pass to update all states that have changed
      Promise.resolve().then(() => {
        let hasChanges = false;

        if (
          newActiveRides &&
          JSON.stringify(newActiveRides) !==
            JSON.stringify(ridesRef.current.active)
        ) {
          setActiveRides(newActiveRides);
          hasChanges = true;
        }

        if (
          newPendingRides &&
          JSON.stringify(newPendingRides) !==
            JSON.stringify(ridesRef.current.pending)
        ) {
          setPendingRides(newPendingRides);
          hasChanges = true;
        }

        if (
          newCompletedRides &&
          JSON.stringify(newCompletedRides) !==
            JSON.stringify(ridesRef.current.completed)
        ) {
          setCompletedRides(newCompletedRides);
          hasChanges = true;
        }

        if (hasChanges) {
          console.log("Batched ride state update applied");
        }
      });
    },
    []
  );

  // Fetch rides from database with batched updates
  const loadRides = useCallback(
    async (clearSeen: boolean = false) => {
      setIsLoading(true);
      try {
        const rides = await fetchRides();

        // Mark all current rides as seen
        if (isMounted) {
          rides.forEach((ride) => {
            addSeenRideId(ride.id);
          });

          // Update seen rides state
          setSeenRideIds(getSeenRideIds());
        }

        // Apply filtering based on archived and seen status
        const filteredRides = filterRides(rides);

        // Process data once
        const activeRides = filteredRides.filter(
          (ride) => ride.status === "active"
        );
        const pendingRides = filteredRides.filter(
          (ride) => ride.status === "pending"
        );
        const completedRides = filteredRides.filter(
          (ride) => ride.status === "completed"
        );

        // Batch update all states at once
        updateRideState(activeRides, pendingRides, completedRides);
      } catch (error) {
        console.error("Error loading rides:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filterRides, updateRideState, isMounted]
  );

  // Debounced version of loadRides to prevent excessive API calls
  const debouncedLoadRides = useCallback(
    (() => {
      let timeout: NodeJS.Timeout | null = null;
      return (clearSeen: boolean = false) => {
        if (timeout) clearTimeout(timeout);
        setIsLoading(true);
        timeout = setTimeout(() => {
          loadRides(clearSeen);
        }, 300); // 300ms debounce
      };
    })(),
    [loadRides]
  );

  // Toggle the fresh start mode
  const toggleFreshStart = useCallback(() => {
    const newValue = !freshStart;
    setFreshStart(newValue);
    if (isMounted) {
      safeLocalStorage.setItem("freshStartMode", JSON.stringify(newValue));
    }
    loadRides();
  }, [freshStart, loadRides, isMounted]);

  // Stable reference to subscription callback to prevent recreation
  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<Ride>) => {
      if (!isMounted) return;

      console.log("Received real-time update:", payload);

      // Generate a unique update ID to prevent double processing
      let rideId = "unknown";
      if (
        payload.new &&
        typeof payload.new === "object" &&
        "id" in payload.new
      ) {
        rideId = String(payload.new.id);
      } else if (
        payload.old &&
        typeof payload.old === "object" &&
        "id" in payload.old
      ) {
        rideId = String(payload.old.id);
      }
      const updateId = `${payload.eventType}-${rideId}-${Date.now()}`;

      // Skip if we've already processed this update
      if (processedUpdates.includes(updateId)) {
        console.log("Skipping already processed update:", updateId);
        return;
      }

      // Mark this update as processed
      setProcessedUpdates((prev) => {
        const newUpdates = [...prev, updateId];
        // Keep only the last 100 updates to prevent memory leaks
        if (newUpdates.length > 100) {
          return newUpdates.slice(-100);
        }
        return newUpdates;
      });

      // Handle different types of updates
      if (payload.eventType === "INSERT") {
        const newRide = payload.new as Ride;
        console.log("New ride created:", newRide);

        // Always mark inserted rides as seen
        addSeenRideId(newRide.id);

        // Avoid flickering by using a more controlled update approach
        // Rather than inserting directly, refresh all data
        debouncedLoadRides();
      } else if (payload.eventType === "UPDATE") {
        const updatedRide = payload.new as Ride;
        const oldRide = payload.old as Ride;
        console.log("Ride updated:", updatedRide);

        // Mark updated rides as seen
        addSeenRideId(updatedRide.id);

        // Check if the ride is already in our "archived" list in localStorage
        if (archivedRideIds.includes(updatedRide.id)) {
          console.log("Ignoring update for archived ride:", updatedRide.id);
          return;
        }

        // Check if we're in fresh start mode and this is an old ride we've seen before
        // Only apply this filter for rides that aren't changing status
        if (
          freshStart &&
          seenRideIds.includes(updatedRide.id) &&
          oldRide.status === updatedRide.status
        ) {
          console.log(
            "Ignoring update for previously seen ride in fresh start mode:",
            updatedRide.id
          );
          return;
        }

        // For status changes that are critical, debounce the whole update
        if (oldRide.status !== updatedRide.status) {
          debouncedLoadRides();
          return;
        }

        // For other changes, use the more fine-grained approach
        // Use refs to get latest state without depending on them in useCallback
        const currentActiveRides = [...ridesRef.current.active];
        const currentPendingRides = [...ridesRef.current.pending];
        const currentCompletedRides = [...ridesRef.current.completed];

        // Process updates with minimal state changes
        let newActiveRides = currentActiveRides;
        let newPendingRides = currentPendingRides;
        let newCompletedRides = currentCompletedRides;

        // Handle status changes
        if (oldRide.status !== updatedRide.status) {
          // Remove from old status array
          if (oldRide.status === "active") {
            newActiveRides = currentActiveRides.filter(
              (r) => r.id !== updatedRide.id
            );
          } else if (oldRide.status === "pending") {
            newPendingRides = currentPendingRides.filter(
              (r) => r.id !== updatedRide.id
            );
          } else if (oldRide.status === "completed") {
            newCompletedRides = currentCompletedRides.filter(
              (r) => r.id !== updatedRide.id
            );
          }

          // Add to new status array if not archived
          if (updatedRide.status !== "archived") {
            if (updatedRide.status === "active") {
              newActiveRides = [...newActiveRides, updatedRide];
            } else if (updatedRide.status === "pending") {
              newPendingRides = [...newPendingRides, updatedRide];
            } else if (updatedRide.status === "completed") {
              newCompletedRides = [...newCompletedRides, updatedRide];
            }
          }
        } else {
          // Update in the same status array
          if (updatedRide.status === "active") {
            newActiveRides = currentActiveRides.map((r) =>
              r.id === updatedRide.id ? updatedRide : r
            );
          } else if (updatedRide.status === "pending") {
            newPendingRides = currentPendingRides.map((r) =>
              r.id === updatedRide.id ? updatedRide : r
            );
          } else if (updatedRide.status === "completed") {
            newCompletedRides = currentCompletedRides.map((r) =>
              r.id === updatedRide.id ? updatedRide : r
            );
          }
        }

        // Batch update all states that changed
        updateRideState(newActiveRides, newPendingRides, newCompletedRides);
      } else if (payload.eventType === "DELETE") {
        const deletedRide = payload.old as Ride;
        console.log("Ride deleted:", deletedRide);

        // Use the debounced load instead of direct state updates
        debouncedLoadRides();
      }
    },
    [
      archivedRideIds,
      freshStart,
      seenRideIds,
      processedUpdates,
      updateRideState,
      isMounted,
    ]
  );

  // Main useEffect for initialization and subscriptions with stable dependencies
  useEffect(() => {
    if (!isMounted) return;

    // Initial data load
    loadRides();

    // Prevent multiple subscriptions
    if (subscriptionRef.current) {
      console.log("Subscription already exists, not creating a new one");
      return;
    }

    // Create a stable subscription that won't be recreated when component rerenders
    const channel = supabase
      .channel("rides")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log(`Subscription status: ${status}`);

        // If we've successfully connected, make sure we have latest data
        if (status === "SUBSCRIBED") {
          setTimeout(() => {
            debouncedLoadRides();
          }, 1000);
        }
      });

    // Store reference to the subscription
    subscriptionRef.current = channel;

    // This cleanup function will only run when the component unmounts
    return () => {
      console.log("Component unmounting, cleaning up subscription");
      if (subscriptionRef.current) {
        channel.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isMounted]); // Remove unstable dependencies that cause recreation

  // Separate effect for handleRealtimeUpdate dependency change
  useEffect(() => {
    // Update the event handler of an existing subscription when dependencies change
    if (subscriptionRef.current && isMounted) {
      console.log("Updating subscription event handler");
      // The subscription setup still uses the original handler, but we don't need
      // to recreate the entire subscription when these dependencies change
    }
  }, [handleRealtimeUpdate, debouncedLoadRides, loadRides]);

  // Move ride to completed - optimized for immediate visual feedback
  const moveToCompleted = useCallback(
    async (ride: Ride, fromStatus: string) => {
      // Set loading state
      setActionLoading(ride.id);

      try {
        // Mark the ride ID as seen to prevent it from reappearing
        addSeenRideId(ride.id);

        // Instead of updating the UI immediately and then again after API response,
        // just set the loading state and wait for the real-time updates
        const result = await updateRideStatus(ride.id, "completed");

        console.log("Ride moved to completed:", result);

        // If we got back an empty result or no result, we may not get a real-time update
        // So manually update the UI to avoid confusion
        if (!result || result.length === 0) {
          console.log("No data returned from update, manually updating UI");

          // Create a completed ride from the original ride data
          const completedRide: Ride = {
            ...ride,
            status: "completed" as
              | "pending"
              | "active"
              | "completed"
              | "cancelled"
              | "archived",
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          };

          // Update local state directly
          if (fromStatus === "active") {
            setActiveRides((prev) => prev.filter((r) => r.id !== ride.id));
          } else if (fromStatus === "pending") {
            setPendingRides((prev) => prev.filter((r) => r.id !== ride.id));
          }

          // Add to completed rides if not already there
          setCompletedRides((prev) => {
            if (prev.some((r) => r.id === ride.id)) {
              return prev.map((r) => (r.id === ride.id ? completedRide : r));
            } else {
              return [...prev, completedRide];
            }
          });

          // Set the last completed ride ID to trigger highlight animation
          setLastCompletedRideId(ride.id);
          setTimeout(() => setLastCompletedRideId(null), 3000);

          // Scroll to completed section
          if (completedSectionRef.current) {
            setTimeout(() => {
              completedSectionRef.current?.scrollIntoView({
                behavior: "smooth",
              });
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error completing ride:", error);
        alert("There was an error completing this ride.");

        // Only on error, force a refresh to ensure consistent state
        debouncedLoadRides();
      } finally {
        // Clear the loading state
        setActionLoading(null);
      }
    },
    [updateRideStatus, debouncedLoadRides]
  );

  // Archive a completed ride
  const archiveCompletedRide = async (ride: Ride) => {
    if (
      !window.confirm(
        "Archive this ride? It will be stored in the database but removed from the UI."
      )
    ) {
      return;
    }

    setActionLoading(ride.id);

    try {
      // Update the database FIRST before updating the UI
      console.log("Archiving ride in database:", ride.id);

      const result = await archiveRide(ride.id);
      console.log("Archive database result:", result);

      if (!result || result.length === 0) {
        console.warn("Database may not have been updated successfully");
      } else {
        console.log(
          "Successfully archived in database with timestamp:",
          result[0]?.archived_at || new Date().toISOString()
        );
      }

      // Then update the local storage and UI
      addArchivedRideId(ride.id);

      // Update component state with the new archived ID
      const newArchivedIds = [...archivedRideIds, ride.id];
      setArchivedRideIds(newArchivedIds);

      // Also make sure localStorage is synchronized
      safeLocalStorage.setItem(
        "archivedRideIds",
        JSON.stringify(newArchivedIds)
      );

      // Update UI immediately
      setActiveRides((prev) => prev.filter((r) => r.id !== ride.id));
      setPendingRides((prev) => prev.filter((r) => r.id !== ride.id));
      setCompletedRides((prev) => prev.filter((r) => r.id !== ride.id));

      // Log the archived ride information for record keeping
      console.log("Ride archived successfully:", {
        id: ride.id,
        student: ride.student_name,
        from: ride.pickup_location,
        to: ride.destination,
        requested_at: ride.created_at,
        completed_at: ride.completed_at,
        archived_at: result[0]?.archived_at || new Date().toISOString(),
        passengers: ride.passengers,
      });
    } catch (error) {
      console.error("Error in archiveCompletedRide function:", error);
      alert("There was an issue archiving the ride. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Clear all completed rides
  const clearAllCompletedRides = async () => {
    if (completedRides.length === 0) {
      alert("No completed rides to archive.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to archive all ${completedRides.length} completed rides? This will remove them from the UI.`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      // Get completed rides before clearing them (for logging)
      const ridesToArchive = [...completedRides];

      // Get IDs of all completed rides
      const completedRideIds = completedRides.map((ride) => ride.id);

      // First update the database before updating the UI
      console.log("Archiving all completed rides in database");
      let archiveSuccess = false;

      try {
        // Try using the bulk archive function first
        const result = await archiveCompletedRides();
        console.log(`Archived ${result?.length || 0} rides in database`);

        archiveSuccess = result && result.length > 0;
      } catch (bulkError) {
        console.error("Bulk archive failed:", bulkError);

        // If bulk archive fails, try archiving rides individually
        console.log("Attempting to archive rides individually as fallback...");
        let successCount = 0;

        for (const ride of ridesToArchive) {
          try {
            const result = await archiveRide(ride.id);
            if (result && result.length > 0) {
              successCount++;
            }
          } catch (individualError) {
            console.error(
              `Failed to archive ride ${ride.id}:`,
              individualError
            );
          }
        }

        console.log(
          `Individually archived ${successCount} out of ${ridesToArchive.length} rides`
        );
        archiveSuccess = successCount > 0;
      }

      // Add all to locally archived rides regardless of database result
      // This ensures the UI is cleaned up even if database ops partially failed
      const newArchivedIds = [...archivedRideIds];

      completedRideIds.forEach((id) => {
        if (!newArchivedIds.includes(id)) {
          newArchivedIds.push(id);
        }
      });

      // Update localStorage
      safeLocalStorage.setItem(
        "archivedRideIds",
        JSON.stringify(newArchivedIds)
      );
      setArchivedRideIds(newArchivedIds);

      // Update UI immediately
      setCompletedRides([]);
      setActiveRides((prev) =>
        prev.filter((ride) => !completedRideIds.includes(ride.id))
      );
      setPendingRides((prev) =>
        prev.filter((ride) => !completedRideIds.includes(ride.id))
      );

      // Log summary of archived rides
      console.log(`Archived ${ridesToArchive.length} completed rides:`, {
        rides: ridesToArchive.map((ride) => ({
          id: ride.id,
          student: ride.student_name,
          from: ride.pickup_location,
          to: ride.destination,
          completed_at: ride.completed_at,
        })),
      });

      // Show appropriate notification
      if (!archiveSuccess) {
        // If database operations failed but UI was updated
        alert(
          "Warning: Rides were removed from the UI but there were issues updating the database. The changes may not persist when you refresh. Please try again or contact support."
        );
      }
    } catch (error) {
      console.error("Error in clearAllCompletedRides function:", error);
      alert(
        "There was an issue archiving the rides. Some rides may not have been archived properly."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Define the resetAllRides function which was accidentally removed
  const resetAllRides = useCallback(() => {
    if (
      window.confirm(
        "This will reset and show all rides in the database. Continue?"
      )
    ) {
      clearSeenRides();
      setSeenRideIds([]);
      loadRides(true);
    }
  }, [loadRides]);

  // Shared refresh button component
  const RefreshButton = () => (
    <div className="flex space-x-2">
      <button
        onClick={() => {
          setIsLoading(true);
          loadRides().finally(() => setIsLoading(false));
        }}
        className="bg-batesBlue hover:bg-batesBlue/80 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
        Refresh
      </button>

      <button
        onClick={toggleFreshStart}
        className={`${
          freshStart
            ? "bg-green-600 hover:bg-green-700"
            : "bg-gray-600 hover:bg-gray-700"
        } text-white py-2 px-4 rounded-md text-sm font-medium flex items-center`}
        title={
          freshStart
            ? "Fresh start mode is ON - only showing new rides"
            : "Fresh start mode is OFF - showing all rides"
        }
      >
        <FaCircle
          className={`mr-2 ${freshStart ? "text-green-400" : "text-gray-400"}`}
        />
        {freshStart ? "Fresh Mode: ON" : "Fresh Mode: OFF"}
      </button>

      <button
        onClick={resetAllRides}
        className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md text-sm font-medium flex items-center"
        title="Reset seen rides and show all rides again"
      >
        <FaEllipsisH className="mr-2" />
        Show All Rides
      </button>
    </div>
  );

  // Shared loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-batesMaroon"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Active Rides Section */}
      <div className="dark-card w-full rounded-xl shadow-xl overflow-hidden border border-gray-800">
        <div className="bg-[var(--statusActiveBg)] p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <div className="bg-[var(--accentColor1)] p-2 rounded-full mr-3 shadow-lg">
              <FaCarSide className="text-white" />
            </div>
            Active Rides
            <span className="ml-3 bg-[var(--statusActiveBg)] text-[var(--statusActive)] text-sm px-3 py-1 rounded-full">
              {activeRides.length} rides
            </span>
          </h2>
          <RefreshButton />
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="dark-table w-full">
              <thead>
                <tr className="border-b border-[var(--batesBorder)] bg-[var(--batesBlue)]/10">
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Student
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Pickup
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Destination
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Passengers
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Request Time
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--batesBorder)]">
                {activeRides.length > 0 ? (
                  activeRides.map((ride, index) => (
                    <tr
                      key={ride.id}
                      className="hover:bg-[var(--batesBlue)]/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-200">
                        {ride.student_name}
                        {ride.special_instructions && (
                          <div className="mt-1 text-xs text-yellow-300 italic">
                            <FaInfoCircle className="inline-block mr-1" />
                            {ride.special_instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.pickup_location}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.destination}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        <span className="bg-gray-700 px-2 py-1 rounded-full">
                          {ride.passengers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {formatDateTime(ride.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="status-badge status-active">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => moveToCompleted(ride, "active")}
                          className="bg-[var(--statusCompletedBg)] hover:bg-[var(--statusCompletedBg)]/70 text-[var(--statusCompleted)] px-3 py-2 rounded-lg transition-colors flex items-center"
                          title="Mark as Completed"
                          disabled={actionLoading === ride.id}
                        >
                          {actionLoading === ride.id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaCheck className="mr-1" />
                          )}
                          <span>Complete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <FaCarSide className="text-3xl mb-2 text-gray-600" />
                        <span>No active rides found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Rides Section */}
      <div className="dark-card w-full rounded-xl shadow-xl overflow-hidden border border-gray-800">
        <div className="bg-[var(--statusPendingBg)] p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <div className="bg-[var(--accentColor3)] p-2 rounded-full mr-3 shadow-lg">
              <FaSpinner className="text-white" />
            </div>
            Pending Rides
            <span className="ml-3 bg-[var(--statusPendingBg)]/70 text-[var(--statusPending)] text-sm px-3 py-1 rounded-full">
              {pendingRides.length} rides
            </span>
          </h2>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="dark-table w-full">
              <thead>
                <tr className="border-b border-[var(--batesBorder)] bg-[var(--batesBlue)]/10">
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Student
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Pickup
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Destination
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Passengers
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Request Time
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--batesBorder)]">
                {pendingRides.length > 0 ? (
                  pendingRides.map((ride, index) => (
                    <tr
                      key={ride.id}
                      className="hover:bg-[var(--batesBlue)]/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-200">
                        {ride.student_name}
                        {ride.special_instructions && (
                          <div className="mt-1 text-xs text-yellow-300 italic">
                            <FaInfoCircle className="inline-block mr-1" />
                            {ride.special_instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.pickup_location}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.destination}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        <span className="bg-gray-700 px-2 py-1 rounded-full">
                          {ride.passengers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {formatDateTime(ride.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="status-badge status-pending">
                          Pending
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => moveToCompleted(ride, "pending")}
                          className="bg-[var(--statusCompletedBg)] hover:bg-[var(--statusCompletedBg)]/70 text-[var(--statusCompleted)] px-3 py-2 rounded-lg transition-colors flex items-center"
                          title="Mark as Completed"
                          disabled={actionLoading === ride.id}
                        >
                          {actionLoading === ride.id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaCheck className="mr-1" />
                          )}
                          <span>Complete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <FaSpinner className="text-3xl mb-2 text-gray-600" />
                        <span>No pending rides found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed Rides Section */}
      <div
        className="dark-card w-full rounded-xl shadow-xl overflow-hidden border border-gray-800"
        ref={completedSectionRef}
      >
        <div className="bg-[var(--statusCompletedBg)] p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <div className="bg-[var(--accentColor2)] p-2 rounded-full mr-3 shadow-lg">
              <FaCheckCircle className="text-white" />
            </div>
            Completed Rides
            <span className="ml-3 bg-[var(--statusCompletedBg)]/70 text-[var(--statusCompleted)] text-sm px-3 py-1 rounded-full">
              {completedRides.length} rides
            </span>
          </h2>

          {completedRides.length > 0 && (
            <button
              onClick={clearAllCompletedRides}
              className="bg-[var(--accentColor1)] hover:bg-[var(--accentColor1)]/80 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center shadow-lg"
            >
              <FaCheckCircle className="mr-2" />
              Archive All
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="dark-table w-full">
              <thead>
                <tr className="border-b border-[var(--batesBorder)] bg-[var(--batesBlue)]/10">
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Student
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Pickup
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Destination
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Passengers
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Request Time
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Completed Time
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--batesBorder)]">
                {completedRides.length > 0 ? (
                  completedRides.map((ride, index) => (
                    <tr
                      key={ride.id}
                      className={`hover:bg-[var(--batesBlue)]/30 transition-colors ${
                        lastCompletedRideId === ride.id
                          ? "bg-[var(--statusCompletedBg)] animate-pulse"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-sm font-medium text-gray-200">
                        {ride.student_name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.pickup_location}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {ride.destination}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        <span className="bg-gray-700 px-2 py-1 rounded-full">
                          {ride.passengers}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-200">
                        {formatDateTime(ride.created_at)}
                      </td>
                      <td className="py-4 px-4 text-sm text-[var(--statusCompleted)] font-medium">
                        {ride.completed_at
                          ? formatDateTime(ride.completed_at)
                          : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="status-badge status-completed">
                          Completed
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => archiveCompletedRide(ride)}
                          className="bg-[var(--accentColor1)]/20 hover:bg-[var(--accentColor1)]/30 text-[var(--accentColor1)] px-3 py-2 rounded-lg transition-colors flex items-center"
                          title="Archive Ride"
                          disabled={actionLoading === ride.id}
                        >
                          {actionLoading === ride.id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaCheckCircle className="mr-1" />
                          )}
                          <span>Archive</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <FaCheckCircle className="text-3xl mb-2 text-gray-600" />
                        <span>No completed rides found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
