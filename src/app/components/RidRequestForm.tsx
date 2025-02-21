"use client";

import { useState } from "react";
import { FaMapMarkerAlt, FaCarSide, FaCheckCircle } from "react-icons/fa";

const destinations = [
  "Dorms",
  "Walmart",
  "Target",
  "CVS",
  "CMMC Hospital",
  "Tree Street",
  "Flagship Cinema",
  "Connors Elementary School",
  "Lewiston High School",
  "Auburn Mall",
];

export default function RideRequestForm() {
  const [destination, setDestination] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const origin = "Bates College"; // Static Origin

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    setSuccessMessage(
      `🚀 Your ride request to ${destination} has been submitted successfully!`
    );

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
      setDestination(""); // Reset form
    }, 5000);
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4 hover:shadow-lg transition duration-300"
      >
        {/* 🔹 Origin Field (Static) */}
        <div className="flex items-center bg-gray-100 px-4 py-3 rounded-md shadow-sm w-full">
          <FaMapMarkerAlt className="text-blue-500 mr-3" />
          <input
            type="text"
            value={origin}
            disabled
            className="w-full bg-transparent outline-none text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* 🔹 Destination Field (Dropdown) */}
        <div className="relative w-full">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-gray-100 px-4 py-3 rounded-md shadow-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select Destination
            </option>
            {destinations.map((dest, index) => (
              <option key={index} value={dest}>
                {dest}
              </option>
            ))}
          </select>
        </div>

        {/* 🔹 Submit Button */}
        <button
          type="submit"
          disabled={!destination}
          className={`w-full flex justify-center items-center space-x-2 px-4 py-3 rounded-md text-white font-semibold text-lg transition 
          ${
            destination
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          <FaCarSide />
          <span>Submit Request</span>
        </button>
      </form>

      {/* ✅ Success Message (Green Box) */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-3 mt-2 bg-green-100 text-green-700 rounded-md shadow-sm border border-green-500 transition">
          <FaCheckCircle className="text-green-600" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
