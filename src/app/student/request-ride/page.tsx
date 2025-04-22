"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { AiOutlinePlus } from "react-icons/ai";
import { FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { createRide } from "@/lib/supabase";
import { Toaster } from "react-hot-toast";

export default function RequestRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [rideData, setRideData] = useState({
    student_name: "",
    pickup_location: "",
    destination: "",
    passengers: 1,
    notes: "",
    user_email: "",
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        setRideData((prev) => ({
          ...prev,
          student_name: currentUser.displayName || currentUser.email || "",
          user_email: currentUser.email || "",
        }));
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setRideData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Validate form data before submission
    if (
      !rideData.student_name ||
      !rideData.pickup_location ||
      !rideData.destination
    ) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Make sure we have user email
    if (!rideData.user_email && user?.email) {
      setRideData((prev) => ({
        ...prev,
        user_email: user.email || "",
      }));
    }

    try {
      // Create ride data with correct field mapping
      const rideSubmitData = {
        student_name: rideData.student_name,
        pickup_location: rideData.pickup_location,
        destination: rideData.destination,
        passengers: rideData.passengers,
        special_instructions: rideData.notes, // Map notes to special_instructions
        user_email: rideData.user_email,
        status: "pending" as const, // Always start as pending
      };

      console.log("Submitting ride request with data:", rideSubmitData);

      // Try to create the ride
      const result = await createRide(rideSubmitData);

      console.log("Ride created successfully:", result);

      // Show success toast
      toast.success("Ride requested successfully!");

      // Redirect to my rides page
      router.push("/student/my-rides?success=true");
    } catch (error: any) {
      console.error("Error creating ride:", error);

      // Provide a helpful error message based on the error
      let errorMessage = "Failed to request ride. Please try again.";

      if (error.message && error.message.includes("Database connection")) {
        errorMessage =
          "Connection to ride system failed. Please check your internet connection.";
      } else if (error.message && error.message.includes("timed out")) {
        errorMessage =
          "Request timed out. The server might be busy, please try again.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            duration: 5000,
            style: {
              background: "rgba(16, 185, 129, 0.2)",
              color: "rgb(134, 239, 172)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "rgba(239, 68, 68, 0.2)",
              color: "rgb(252, 165, 165)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            },
          },
        }}
      />
      <h1 className="text-2xl font-bold text-white mb-6">Request a Ride</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--batesCard)] rounded-lg p-6 border border-[var(--batesBorder)]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              name="student_name"
              value={rideData.student_name}
              onChange={handleChange}
              className="w-full p-3 bg-[var(--batesBlue)] border border-[var(--batesBorder)] rounded-lg text-white"
              required
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Number of Passengers
            </label>
            <select
              name="passengers"
              value={rideData.passengers}
              onChange={handleChange}
              className="w-full p-3 bg-[var(--batesBlue)] border border-[var(--batesBorder)] rounded-lg text-white"
              required
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Pickup Location</label>
            <input
              type="text"
              name="pickup_location"
              value={rideData.pickup_location}
              onChange={handleChange}
              className="w-full p-3 bg-[var(--batesBlue)] border border-[var(--batesBorder)] rounded-lg text-white"
              placeholder="e.g., Merrill Gym, Commons"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Destination</label>
            <input
              type="text"
              name="destination"
              value={rideData.destination}
              onChange={handleChange}
              className="w-full p-3 bg-[var(--batesBlue)] border border-[var(--batesBorder)] rounded-lg text-white"
              placeholder="e.g., Walmart, Auburn Mall"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-300 mb-2">Additional Notes</label>
            <textarea
              name="notes"
              value={rideData.notes}
              onChange={handleChange}
              className="w-full p-3 bg-[var(--batesBlue)] border border-[var(--batesBorder)] rounded-lg text-white"
              placeholder="Any special instructions or information"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6">
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: "#8a1538" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-batesMaroon text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300"
          >
            {loading ? (
              <>
                <span className="inline-block h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2"></span>
                Requesting...
              </>
            ) : (
              "Request Ride"
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
