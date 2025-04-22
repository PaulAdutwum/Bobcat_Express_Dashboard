"use client";

import { useState, useEffect } from "react";
import RideManagementPanel from "../components/RideManagementPanel";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaMapMarkerAlt,
  FaBars,
  FaArrowLeft,
  FaTimes,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaUser,
  FaChartBar,
  FaUserTie,
  FaShuttleVan,
  FaComments,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import { User } from "firebase/auth";

const links = [
  { label: "Dashboard", icon: FaChartLine, href: "/dashboard" },
  { label: "Ride Management", icon: FaShuttleVan, href: "/ride-management" },
  {
    label: "Shuttle Location",
    icon: FaMapMarkerAlt,
    href: "/shuttle-location",
  },
  { label: "Chat Center", icon: FaComments, href: "/chat-center" },
  { label: "Driver Status", icon: FaUserTie, href: "/driver-status" },
  { label: "Analytics", icon: FaChartBar, href: "/analytics" },
  { label: "User Logs", icon: FaUser, href: "/user-logs" },
];

export default function RideManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    try {
      if (auth) {
        await auth.signOut();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:relative bg-[var(--batesCard)] text-white w-72 flex flex-col justify-between shadow-lg transition-all duration-300 ease-in-out z-50 h-full ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:block md:relative absolute inset-y-0 left-0 border-r border-[var(--batesBorder)]`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[var(--batesBorder)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image
                  src="/bateslogo.png"
                  width={140}
                  height={60}
                  priority
                  className="drop-shadow-lg"
                  alt="Bates College"
                  sizes="(max-width: 768px) 100vw, 140px"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://www.bates.edu/wordpress/files/2016/07/Bates_Icon_White.png";
                  }}
                />
              </div>

              {/* Close Button for Sidebar (Mobile) */}
              <div className="md:hidden">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white p-2 rounded-full hover:bg-batesMaroon/20 transition"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-[var(--batesBorder)]">
              <div className="flex items-center space-x-3 p-3 bg-[var(--batesBlue)] rounded-lg">
                <div className="h-10 w-10 rounded-full bg-batesMaroon flex items-center justify-center">
                  <FaUserCircle className="text-xl text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="text-xs uppercase text-gray-500 font-semibold tracking-wider mb-3 pl-4">
              Navigation
            </div>
            <nav className="flex flex-col space-y-1">
              {links.map(({ label, icon: Icon, href }, index) => (
                <Link
                  key={index}
                  href={href as any}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    pathname === href
                      ? "bg-batesMaroon text-white font-medium"
                      : "hover:bg-[var(--batesBlue)] text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon className="text-lg" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-[var(--batesBorder)]">
            <div className="space-y-2">
              <Link
                href={"/" as any}
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 bg-[var(--batesBlue)] hover:bg-batesMaroon/90 text-gray-300 hover:text-white"
              >
                <FaArrowLeft className="text-lg" />
                <span>Back to Homepage</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 bg-batesMaroon/80 hover:bg-batesMaroon text-white"
              >
                <FaSignOutAlt className="text-lg" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black">
        {/* Top Navigation */}
        <div className="bg-[var(--batesCard)] shadow-md px-5 py-4 sticky top-0 z-10 border-b border-[var(--batesBorder)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-white p-2 rounded-lg hover:bg-batesMaroon/20"
              >
                <FaBars className="text-xl" />
              </button>
              <h1 className="text-2xl font-bold text-white">Ride Management</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href={"/chat-center" as any}
                className="relative p-2 text-white hover:text-batesMaroon rounded-full bg-[var(--batesBlue)] hover:bg-batesMaroon/20 transition-colors"
                aria-label="Chat Center"
              >
                <FaComments className="text-xl" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-batesMaroon rounded-full border-2 border-[var(--batesCard)]"></span>
              </Link>
              <button className="relative p-2 text-gray-300 hover:text-batesMaroon rounded-full hover:bg-[var(--batesBlue)] transition-colors">
                <FaBell className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-5 py-6 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Manage All Rides</h2>
              <p className="text-gray-400">
                View and manage active, pending, and completed rides
              </p>
            </div>

            {/* Ride Management Component */}
            <RideManagementPanel />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
