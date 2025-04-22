"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaShuttleVan, FaHistory, FaMapMarkedAlt } from "react-icons/fa";
import StudentChat from "../components/StudentChat";

export default function StudentHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, {user?.displayName || "Student"}
        </h1>
        <p className="text-gray-400 mb-8">What would you like to do today?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-[var(--batesCard)] rounded-lg p-6 border border-[var(--batesBorder)] hover:border-batesMaroon transition-colors"
          >
            <Link href="/student/request-ride" className="flex flex-col h-full">
              <div className="rounded-full bg-batesMaroon/20 p-4 w-16 h-16 flex items-center justify-center mb-4">
                <FaShuttleVan className="text-batesMaroon text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Request a Ride
              </h2>
              <p className="text-gray-400 mb-4 flex-grow">
                Need a ride somewhere? Submit a request and we'll pick you up.
              </p>
              <span className="text-batesMaroon font-medium">
                Get started →
              </span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-[var(--batesCard)] rounded-lg p-6 border border-[var(--batesBorder)] hover:border-batesMaroon transition-colors"
          >
            <Link href="/student/my-rides" className="flex flex-col h-full">
              <div className="rounded-full bg-blue-500/20 p-4 w-16 h-16 flex items-center justify-center mb-4">
                <FaHistory className="text-blue-500 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">My Rides</h2>
              <p className="text-gray-400 mb-4 flex-grow">
                View the status of your current and past ride requests.
              </p>
              <span className="text-blue-500 font-medium">View rides →</span>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-[var(--batesCard)] rounded-lg p-6 border border-[var(--batesBorder)] hover:border-batesMaroon transition-colors"
          >
            <Link href="/shuttle-location" className="flex flex-col h-full">
              <div className="rounded-full bg-green-500/20 p-4 w-16 h-16 flex items-center justify-center mb-4">
                <FaMapMarkedAlt className="text-green-500 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Shuttle Tracker
              </h2>
              <p className="text-gray-400 mb-4 flex-grow">
                See where the shuttle is in real-time and estimated arrival
                times.
              </p>
              <span className="text-green-500 font-medium">View map →</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {user && (
        <StudentChat
          userEmail={user.email || ""}
          userName={user.displayName || user.email || ""}
        />
      )}
    </div>
  );
}
