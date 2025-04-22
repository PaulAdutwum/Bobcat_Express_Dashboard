"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaUser,
  FaUsers,
  FaClock,
  FaArrowRight,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { auth } from "@/lib/firebase";
import { createRide } from "@/lib/supabase";
import { User } from "firebase/auth";
import { locations } from "@/lib/constants";
import { Ride } from "@/lib/types";

export default function RideRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    student_name: "",
    student_id: "",
    pickup_location: "",
    destination: "",
    passengers: 1,
    pickup_time: "",
    special_instructions: "",
  });

  // Debug form state
  useEffect(() => {
    console.log("Current form state:", formData);
  }, [formData]);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (currentUser?.displayName) {
          setFormData((prev) => ({
            ...prev,
            student_name: currentUser.displayName || "",
          }));
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);

    setFormData((prev) => {
      if (name === "passengers") {
        const numValue = parseInt(value);
        return { ...prev, [name]: isNaN(numValue) ? 1 : numValue };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      console.log("Submitting form with data:", formData);

      // Basic validation - check fields match exactly what Ride type expects
      if (!formData.student_name) {
        throw new Error("Please enter your name");
      }

      if (!formData.pickup_location) {
        throw new Error("Please select a pickup location");
      }

      if (!formData.destination) {
        throw new Error("Please select a destination");
      }

      if (formData.pickup_location === formData.destination) {
        throw new Error("Pickup location and destination cannot be the same");
      }

      if (!formData.pickup_time) {
        throw new Error("Please select a pickup time");
      }

      if (!formData.passengers || formData.passengers < 1) {
        throw new Error("Please select number of passengers");
      }

      // Parse pickup time
      const pickupTimeDate = new Date(formData.pickup_time);

      // Check if the date is valid
      if (isNaN(pickupTimeDate.getTime())) {
        throw new Error("Please select a valid pickup time");
      }

      // Add back the future date check but as a confirmation/warning
      const now = new Date();
      if (pickupTimeDate < now) {
        // Ask for confirmation when requesting rides in the past
        const confirmPast = window.confirm(
          "You're requesting a ride for a time in the past. Continue anyway?"
        );
        if (!confirmPast) {
          setLoading(false);
          return; // Exit early without submitting
        }
      }

      console.log("Validation passed, creating ride...");

      // Create a composite name field that includes pickup time, student ID, and special instructions
      let compositeName = formData.student_name.trim();

      // Add student ID to the name if provided
      if (formData.student_id) {
        compositeName += ` (ID: ${formData.student_id.trim()})`;
      }

      // Add pickup time to the name
      compositeName += ` | Pickup: ${new Date(
        formData.pickup_time
      ).toLocaleString()}`;

      // Add special instructions if present
      if (formData.special_instructions) {
        compositeName += ` | Notes: ${formData.special_instructions.trim()}`;
      }

      // Create ride with minimal fields that exist in the database
      const rideData = {
        student_name: compositeName,
        pickup_location: formData.pickup_location,
        destination: formData.destination,
        passengers: formData.passengers,
        status: "active" as "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Submitting ride data:", rideData);
      try {
        const newRide = await createRide(rideData);
        console.log("Ride created successfully:", newRide);

        // Show success message
        setSuccess(true);

        // Reset form fields except student name (just the original name part)
        setFormData({
          student_name: formData.student_name.trim(),
          student_id: "",
          pickup_location: "",
          destination: "",
          passengers: 1,
          pickup_time: "",
          special_instructions: "",
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } catch (createError: any) {
        console.error("Error from createRide:", createError);
        const errorMsg = createError.message || "Database error";

        if (
          errorMsg.includes("special_instructions") ||
          errorMsg.includes("pickup_time") ||
          errorMsg.includes("student_id")
        ) {
          // Handle known database schema mismatch errors
          throw new Error(
            "The database schema doesn't match expected fields. Contact support if this persists."
          );
        } else {
          throw new Error(`Failed to create ride: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(
        err.message || "An error occurred while submitting your request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-card w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Request a Ride</h2>
        <p className="text-gray-400 text-sm">
          Fill out the form below to request a shuttle ride
        </p>
      </div>

      {/* Error Message - Show at the top */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md"
        >
          <div className="flex items-center">
            <FaExclamationCircle className="text-red-500 mr-2" />
            <span className="text-red-500 text-sm font-medium">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Success Message - Show at the top */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-md"
        >
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span className="text-green-500 text-sm font-medium">
              Ride request submitted successfully!
            </span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaUser className="inline mr-2 text-batesMaroon" />
              Full Name
            </label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="dark-input"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaUser className="inline mr-2 text-batesMaroon" />
              Student ID (optional)
            </label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              className="dark-input"
              placeholder="Your student ID"
            />
            <p className="text-xs text-gray-400 mt-1">
              Will be included with your name in the database
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaClock className="inline mr-2 text-batesMaroon" />
              Pickup Time
            </label>
            <input
              type="datetime-local"
              name="pickup_time"
              value={formData.pickup_time}
              onChange={handleChange}
              className="dark-input"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Select your preferred pickup time (can be any date/time)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaUsers className="inline mr-2 text-batesMaroon" />
              Number of Passengers
            </label>
            <select
              name="passengers"
              value={formData.passengers}
              onChange={handleChange}
              className="dark-input"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "passenger" : "passengers"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaMapMarkerAlt className="inline mr-2 text-batesMaroon" />
              Pickup Location
            </label>
            <select
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              className="dark-input"
            >
              <option value="">Select pickup location</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <FaMapMarkerAlt className="inline mr-2 text-batesMaroon" />
              Destination
            </label>
            <select
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              className="dark-input"
            >
              <option value="">Select destination</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Notes (not stored separately in database)
          </label>
          <textarea
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleChange}
            className="dark-input"
            rows={3}
            placeholder="Any notes will be added to your name field in the database"
          />
          <p className="text-xs text-gray-400 mt-1">
            Due to database limitations, this will be added to your name
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-batesMaroon hover:bg-batesMaroon/80 text-white rounded-md flex items-center justify-center transition-colors duration-300"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              Request Ride
              <FaArrowRight className="ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
