"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import {
  FaHome,
  FaShuttleVan,
  FaHistory,
  FaSignOutAlt,
  FaMapMarkedAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const router = useRouter();

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

  const handleSignOut = async () => {
    try {
      if (auth) {
        await auth.signOut();
        router.push("/");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Close mobile sidebar when clicked outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black">
      {/* Mobile menu button - visible on small screens */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
          }}
          className="bg-batesMaroon p-2 rounded-lg text-white"
        >
          {isMobileSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar - desktop view */}
      <aside
        className={`
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
          transition-transform duration-300 ease-in-out
          fixed md:static top-0 left-0 h-full z-40
          w-64 bg-[var(--batesCard)] border-r border-[var(--batesBorder)]
          flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--batesBorder)] flex items-center justify-between">
          <div>
            <Image
              src="/bateslogo.png"
              width={150}
              height={50}
              alt="Bates College"
              priority
              onError={(e) => {
                // Fallback image if main logo fails to load
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://www.bates.edu/wordpress/files/2016/07/Bates-Logo-Horizontal-min.png";
              }}
            />
            <div className="text-white mt-2">Bobcat Express</div>
          </div>
          {/* Close button for mobile */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/student"
                  className="flex items-center p-2 text-white hover:bg-batesMaroon/20 rounded-lg transition-colors"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <FaHome className="mr-2" /> Home
                </Link>
              </li>
              <li>
                <Link
                  href="/student/request-ride"
                  className="flex items-center p-2 text-white hover:bg-batesMaroon/20 rounded-lg transition-colors"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <FaShuttleVan className="mr-2" /> Request Ride
                </Link>
              </li>
              <li>
                <Link
                  href="/student/my-rides"
                  className="flex items-center p-2 text-white hover:bg-batesMaroon/20 rounded-lg transition-colors"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <FaHistory className="mr-2" /> My Rides
                </Link>
              </li>
              <li>
                <Link
                  href="/student/shuttle-location"
                  className="flex items-center p-2 text-white hover:bg-batesMaroon/20 rounded-lg transition-colors"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <FaMapMarkedAlt className="mr-2" /> Shuttle Location
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* User profile section */}
        {user && (
          <div className="p-4 border-t border-[var(--batesBorder)]">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-batesMaroon flex items-center justify-center mr-2">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="text-white truncate">
                {user.displayName || user.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center p-2 text-white hover:bg-batesMaroon/20 rounded-lg w-full transition-colors"
            >
              <FaSignOutAlt className="mr-2" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Semi-transparent overlay when mobile sidebar is open */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-0 pt-16 md:pt-0">{children}</main>
    </div>
  );
}
