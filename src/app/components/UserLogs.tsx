"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  Firestore,
} from "firebase/firestore";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

type UserLog = {
  id: string;
  userName: string;
  email: string;
  origin: string;
  destination: string;
  requestTime: Timestamp;
  status: string;
  totalRides: number;
};

// Table Styles
const tableStyles =
  "border border-gray-300 p-3 text-gray-700 text-center text-sm md:text-base";

export default function UserLogs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch ride logs from Firestore
  useEffect(() => {
    // Check if db is initialized
    if (!db) {
      console.warn("Firebase Firestore is not initialized.");
      setError("Database connection unavailable");
      return () => {}; // Return empty cleanup function
    }

    // Proceed with Firestore query if db is available
    try {
      const q = query(
        collection(db as Firestore, "ride_logs"),
        orderBy("requestTime", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const rideData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<UserLog, "id">),
          }));
          setLogs(rideData);
          setError(null); // Clear any previous errors
        },
        (err) => {
          console.error("Firestore snapshot error:", err);
          setError("Unable to load ride logs");
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up Firestore query:", err);
      setError("An error occurred while connecting to the database");
      return () => {}; // Return empty cleanup function
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-[#881124] text-white py-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-6">
          <h1 className="text-3xl font-bold">User Ride Logs</h1>

          <Link
            href="/dashboard"
            className="flex items-center bg-white text-[#881124] px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md mt-6 border flex-1">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          📜 Recent Ride Requests
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200 text-gray-800">
              <tr>
                <th className={tableStyles}>User Name</th>
                <th className={tableStyles}>Email</th>
                <th className={tableStyles}>Origin</th>
                <th className={tableStyles}>Destination</th>
                <th className={tableStyles}>Request Time</th>
                <th className={tableStyles}>Status</th>
                <th className={tableStyles}>Total Rides Today</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className={tableStyles}>{log.userName}</td>
                    <td className={tableStyles}>{log.email}</td>
                    <td className={tableStyles}>{log.origin || "Campus"}</td>
                    <td className={tableStyles}>{log.destination}</td>
                    <td className={tableStyles}>
                      {log.requestTime?.toDate
                        ? log.requestTime.toDate().toLocaleString()
                        : "N/A"}
                    </td>
                    <td className={tableStyles}>
                      <span
                        className={`px-2 py-1 rounded-lg text-white font-bold ${
                          log.status === "Completed"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className={tableStyles}>{log.totalRides || 1}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    {error ? "Error loading data" : "No ride logs available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="bg-black text-white py-8 mt-auto">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 px-6">
          {/* 🚍 Shuttle Info */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Bobcat Express Shuttle</h3>
            <p className="mt-2 text-gray-400">
              Providing safe and reliable transportation for Bates College
              students.
            </p>
            <p className="mt-2 text-gray-400 flex justify-center md:justify-start items-center">
              📞 Bobcat Express Phone: (207) 786-8300
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              {[
                { label: "Community Engaged Learning Shuttle", href: "#" },
                { label: "Accessible Support", href: "#" },
                { label: "Medical Appointments", href: "#" },
                { label: "L/A Express Shuttle", href: "#" },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href as any}
                    className="text-blue-400 hover:text-white transition duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Bobcat Express Shuttle. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
