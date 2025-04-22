"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DriverStatusPanel from "@/app/components/DriverStatusPanel";
import {
  FaTachometerAlt,
  FaCar,
  FaClipboardList,
  FaMapMarkedAlt,
  FaChartBar,
  FaComments,
  FaSignOutAlt,
  FaTimes,
  FaBars,
} from "react-icons/fa";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  {
    href: "/ride-management",
    label: "Ride Management",
    icon: <FaClipboardList />,
  },
  { href: "/driver-status", label: "Driver Status", icon: <FaCar /> },
  {
    href: "/shuttle-tracker",
    label: "Shuttle Tracker",
    icon: <FaMapMarkedAlt />,
  },
  { href: "/analytics", label: "Analytics", icon: <FaChartBar /> },
  { href: "/chat-center", label: "Chat Center", icon: <FaComments /> },
];

export default function DriverStatusPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState({
    name: "Admin User",
    email: "admin@bates.edu",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    // Removed dependency on next-auth
    // Navigate to home page
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[var(--batesBackground)]">
      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-[var(--batesBlue)] shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex justify-center items-center h-20 border-b border-[var(--batesBorder)]">
            <Link href="/dashboard">
              <Image
                src="/bateslogo.png"
                alt="Bates College Logo"
                width={120}
                height={40}
                priority
                onError={(e) => {
                  e.currentTarget.src =
                    "https://www.bates.edu/wordpress/files/2016/07/Bates-Logo-1.jpg";
                }}
              />
            </Link>
          </div>

          {/* User Profile */}
          <div className="px-6 py-4 border-b border-[var(--batesBorder)]">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-[var(--batesBlueLight)] transition-colors ${
                      link.href === "/driver-status"
                        ? "bg-[var(--batesBlueLight)]"
                        : ""
                    }`}
                  >
                    <span className="mr-3 text-gray-400">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-[var(--batesBorder)]">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-4 py-2 text-white bg-batesMaroon hover:bg-batesMaroon/80 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[var(--batesCard)] border-b border-[var(--batesBorder)] shadow-sm h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <h1 className="text-xl font-bold text-white">
            Driver Status Management
          </h1>
          <div>{/* Additional header content can go here */}</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-16 h-16 border-t-4 border-batesMaroon border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-white">Loading...</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DriverStatusPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
