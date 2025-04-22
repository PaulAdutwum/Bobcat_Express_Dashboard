"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaHome,
  FaRoute,
  FaUserClock,
  FaChartLine,
  FaComments,
  FaSignOutAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";
import AdminChat from "@/app/components/AdminChat";
import { getCookie } from "@/lib/cookies";

export default function ChatPage() {
  const router = useRouter();
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    // Check if user is logged in and is admin
    const isAdmin = getCookie("admin") === "true";
    const isAuth = getCookie("auth") === "true";

    if (!isAuth || !isAdmin) {
      router.push("/");
    }

    // Get user email from cookie for display
    const userEmail = getCookie("user_email");
    if (userEmail) {
      // Extract name from email (before @)
      const name = userEmail.split("@")[0];
      // Capitalize first letter
      setUsername(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-gray-800 md:border-r md:border-gray-700">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
          <Image
            src="/bateslogo.png"
            alt="Bates Logo"
            width={120}
            height={40}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://www.bates.edu/wordpress/files/2016/07/Bates-wordmark-crimson-400.png";
            }}
          />
        </div>

        <div className="flex flex-col flex-grow p-4">
          <div className="flex flex-col space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <FaHome className="mr-3" />
              Dashboard
            </Link>

            <Link
              href="/ride-management"
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <FaRoute className="mr-3" />
              Ride Management
            </Link>

            <Link
              href={"/shuttle-tracking" as any}
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <FaMapMarkedAlt className="mr-3" />
              Shuttle Tracking
            </Link>

            <Link
              href={"/driver-management" as any}
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <FaUserClock className="mr-3" />
              Driver Management
            </Link>

            <Link
              href={"/analytics" as any}
              className="flex items-center px-4 py-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
            >
              <FaChartLine className="mr-3" />
              Analytics
            </Link>

            <Link
              href={"/dashboard/chat" as any}
              className="flex items-center px-4 py-2 text-white bg-batesMaroon rounded-md"
            >
              <FaComments className="mr-3" />
              Message Center
            </Link>
          </div>

          <div className="mt-auto">
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm mr-3">
                  {username.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {username}
                  </div>
                  <div className="text-xs text-gray-400">Admin</div>
                </div>
              </div>

              <button
                className="flex items-center w-full px-4 py-2 mt-2 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
                onClick={() => {
                  document.cookie =
                    "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                  document.cookie =
                    "admin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                  router.push("/");
                }}
              >
                <FaSignOutAlt className="mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <Image
            src="/bateslogo.png"
            alt="Bates Logo"
            width={100}
            height={30}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://www.bates.edu/wordpress/files/2016/07/Bates-wordmark-crimson-400.png";
            }}
          />

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
              {username.charAt(0)}
            </div>
          </div>
        </header>

        {/* Mobile navigation */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-gray-700 text-white text-sm overflow-x-auto">
          <Link
            href={"/dashboard" as any}
            className="px-3 py-1 whitespace-nowrap"
          >
            <FaHome className="inline mr-1" />
            Home
          </Link>
          <Link
            href={"/ride-management" as any}
            className="px-3 py-1 whitespace-nowrap"
          >
            <FaRoute className="inline mr-1" />
            Rides
          </Link>
          <Link
            href={"/shuttle-tracking" as any}
            className="px-3 py-1 whitespace-nowrap"
          >
            <FaMapMarkedAlt className="inline mr-1" />
            Tracking
          </Link>
          <Link
            href={"/dashboard/chat" as any}
            className="px-3 py-1 bg-batesMaroon rounded whitespace-nowrap"
          >
            <FaComments className="inline mr-1" />
            Messages
          </Link>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Message Center</h1>
            <p className="text-gray-400">
              Communicate with students about their ride requests
            </p>
          </div>

          <div className="h-[calc(100vh-13rem)]">
            <AdminChat />
          </div>
        </main>
      </div>
    </div>
  );
}
