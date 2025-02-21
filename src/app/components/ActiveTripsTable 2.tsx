"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Firebase integration
import { collection, query, onSnapshot, where } from "firebase/firestore";

// Table styling class
const tableStyles =
  "border border-gray-300 p-3 text-gray-700 text-center text-sm md:text-base";

// TypeScript Interface for Active Trips
type ActiveTrip = {
  id: string;
  driver: string;
  user: string;
  origin: string;
  destination: string;
  passengers: number;
  status: string; // "Active" or "Completed"
};

export default function ActiveTripsTable() {
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);

  //  Fetch active trips from Firebase
  useEffect(() => {
    const q = query(
      collection(db, "ride_logs"),
      where("status", "==", "Active")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActiveTrip[]; //  Cast to ActiveTrip[]
      setActiveTrips(tripData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6 border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Active Shuttle Rides
      </h2>

      {/*  Active Trips Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200 text-gray-800">
            <tr>
              <th className={tableStyles}>Driver</th>
              <th className={tableStyles}>User</th>
              <th className={tableStyles}>Origin</th>
              <th className={tableStyles}>Destination</th>
              <th className={tableStyles}>Passengers</th>
              <th className={tableStyles}>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeTrips.length > 0 ? (
              activeTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-100">
                  <td className={tableStyles}>{trip.driver}</td>
                  <td className={tableStyles}>{trip.user}</td>
                  <td className={tableStyles}>{trip.origin || "Campus"}</td>
                  <td className={tableStyles}>{trip.destination}</td>
                  <td className={tableStyles}>{trip.passengers}</td>
                  <td className={tableStyles}>
                    <span
                      className={`px-2 py-1 rounded-lg text-white font-bold ${
                        trip.status === "Active"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No active trips at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
