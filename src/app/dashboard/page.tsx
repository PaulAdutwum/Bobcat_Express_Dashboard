"use client";

import { useState, useEffect } from "react";
import ChartComponent from "../components/ChartComponent";
import RideRequestForm from "../components/RideRequestForm";
import AnalyticsBarChart from "../components/AnalyticsBarChart";
import AnalyticsPieChart from "../components/AnalyticsPieChart";
import AnalyticsScatterPlot from "../components/AnalyticsScatterChart";
import RideManagement from "../components/ActiveTripsTable";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DriverSelectionCard from "../components/DriverSelection";
import {
  FaMapMarkerAlt,
  FaCar,
  FaUser,
  FaBars,
  FaArrowLeft,
  FaTimes,
  FaChartLine,
  FaTable,
  FaTaxi,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaRoute,
  FaChartBar,
  FaChartPie,
  FaBus,
  FaCheckCircle,
  FaClock as FaClockSolid,
  FaMapMarker,
  FaUserAlt,
  FaCarAlt,
  FaShuttleVan,
  FaCalendarDay,
  FaTachometerAlt,
  FaUserTie,
  FaStopwatch,
  FaSearchLocation,
  FaComments,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import { User } from "firebase/auth";
import {
  fetchRides,
  fetchActiveRides,
  fetchPendingRides,
  fetchCompletedRides,
  fetchDailyRides,
} from "@/lib/supabase";
import { subscribeToRides } from "@/lib/supabase";

const links = [
  { label: "Dashboard", icon: FaChartLine, href: "/dashboard" },
  { label: "Ride Management", icon: FaShuttleVan, href: "/ride-management" },
  {
    label: "Shuttle Location",
    icon: FaMapMarkerAlt,
    href: "/shuttle-tracking",
  },
  { label: "Chat Center", icon: FaComments, href: "/dashboard/chat" },
  { label: "Driver Status", icon: FaUserTie, href: "/driver-status" },
  { label: "Analytics", icon: FaChartBar, href: "/analytics" },
  { label: "User Logs", icon: FaUser, href: "/user-logs" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalRides: 0,
    activeRides: 0,
    pendingRides: 0,
    completedRides: 0,
    dailyRides: 0,
    totalDrivers: 4,
    activeDrivers: 2,
    averageWaitTime: 5.2,
    averageTripDuration: 12.5,
    busyHours: "4:00 PM - 6:00 PM",
    topDestination: "Walmart",
    topPickup: "Commons",
    totalPassengers: 23,
    efficiency: 85,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });

      return () => unsubscribe();
    }
  }, []);

  // Handle analytics card click for future chart display
  const handleAnalyticsCardClick = (chartType: string) => {
    setSelectedChart(chartType);
    setShowChartModal(true);
    // In the future, this will open a modal with detailed charts
    alert(`Coming soon: Detailed ${chartType} analytics charts!`);
  };

  // Load analytics data with real-time updates
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);

        const allRides = await fetchRides();
        const activeRides = await fetchActiveRides();
        const pendingRides = await fetchPendingRides();
        const completedRides = await fetchCompletedRides();
        const dailyRides = await fetchDailyRides();

        // Calculate total passengers from current rides
        const totalPassengers = allRides.reduce(
          (sum, ride) => sum + (ride.passengers || 1),
          0
        );

        // Calculate average trip duration if we have completed rides with duration
        let avgDuration = 12.5; // default fallback
        const ridesWithDuration = completedRides.filter(
          (ride) => ride.duration_minutes
        );
        if (ridesWithDuration.length > 0) {
          avgDuration =
            ridesWithDuration.reduce(
              (sum, ride) => sum + (ride.duration_minutes || 0),
              0
            ) / ridesWithDuration.length;
        }

        setAnalyticsData({
          totalRides: allRides.length,
          activeRides: activeRides.length,
          pendingRides: pendingRides.length,
          completedRides: completedRides.length,
          dailyRides: dailyRides.length,
          totalDrivers: 4,
          activeDrivers: 2,
          averageWaitTime: 5.2,
          averageTripDuration: avgDuration,
          busyHours: "4:00 PM - 6:00 PM",
          topDestination: "Walmart",
          topPickup: "Commons",
          totalPassengers: totalPassengers,
          efficiency: 85,
        });
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();

    // Set up real-time subscription for analytics updates
    const subscription = subscribeToRides((payload) => {
      // When a ride changes status, refresh the analytics
      if (payload.new && payload.new.status) {
        loadAnalytics();
      }
    });

    // Refresh analytics every 60 seconds
    const interval = setInterval(loadAnalytics, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
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
                  href={href}
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
                href="/"
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

      {/* Main Dashboard Content */}
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
              <h1 className="text-2xl font-bold text-white">
                Bobcat Express Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/chat-center"
                className="relative p-2 text-white hover:text-batesMaroon rounded-full bg-[var(--batesBlue)] hover:bg-batesMaroon/20 transition-colors"
                aria-label="Chat Center"
              >
                <FaComments className="text-xl" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-batesMaroon rounded-full border-2 border-[var(--batesCard)]"></span>
              </Link>
              <button className="relative p-2 text-gray-300 hover:text-batesMaroon rounded-full hover:bg-[var(--batesBlue)] transition-colors">
                <FaBell className="text-xl" />
                {analyticsData.pendingRides > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-batesMaroon rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="px-5 py-6 space-y-8">
          {/* Primary Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Rides Card */}
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="stats-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Total Rides")}
            >
              <div>
                <h3 className="stats-card-title mb-1">Total Rides</h3>
                <p className="stats-card-value">{analyticsData.totalRides}</p>
              </div>
              <div className="bg-[var(--primaryColor)]/20 stats-card-icon">
                <FaBus className="text-[var(--primaryColor)] text-2xl" />
              </div>
            </motion.div>

            {/* Active Rides Card */}
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="stats-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Active Rides")}
            >
              <div>
                <h3 className="stats-card-title mb-1">Active Rides</h3>
                <p className="stats-card-value">{analyticsData.activeRides}</p>
              </div>
              <div className="bg-[var(--accentColor1)]/20 stats-card-icon">
                <FaCar className="text-[var(--accentColor1)] text-2xl" />
              </div>
            </motion.div>

            {/* Completed Rides Card */}
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="stats-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Completed Rides")}
            >
              <div>
                <h3 className="stats-card-title mb-1">Completed Rides</h3>
                <p className="stats-card-value">
                  {analyticsData.completedRides}
                </p>
              </div>
              <div className="bg-[var(--accentColor2)]/20 stats-card-icon">
                <FaCheckCircle className="text-[var(--accentColor2)] text-2xl" />
              </div>
            </motion.div>

            {/* Daily Rides Card */}
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="stats-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Daily Rides")}
            >
              <div>
                <h3 className="stats-card-title mb-1">Today's Rides</h3>
                <p className="stats-card-value">{analyticsData.dailyRides}</p>
              </div>
              <div className="bg-[var(--accentColor4)]/20 stats-card-icon">
                <FaCalendarDay className="text-[var(--accentColor4)] text-2xl" />
              </div>
            </motion.div>
          </motion.div>

          {/* Secondary Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Driver Stats Card */}
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="dark-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Driver Statistics")}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-[var(--accentColor4)]/20">
                  <FaUserTie className="text-[var(--accentColor4)] text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">
                  Driver Statistics
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Drivers</span>
                  <span className="font-semibold text-white">
                    {analyticsData.totalDrivers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Active Drivers</span>
                  <span className="font-semibold text-[var(--accentColor2)]">
                    {analyticsData.activeDrivers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Efficiency</span>
                  <span className="font-semibold text-[var(--accentColor1)]">
                    {analyticsData.efficiency}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Time Stats Card */}
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="dark-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Time Metrics")}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-teal-500/20">
                  <FaStopwatch className="text-teal-500 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">
                  Time Metrics
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Wait Time</span>
                  <span className="font-semibold text-white">
                    {analyticsData.averageWaitTime.toFixed(1)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg. Trip Duration</span>
                  <span className="font-semibold text-white">
                    {analyticsData.averageTripDuration.toFixed(1)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Busiest Hours</span>
                  <span className="font-semibold text-[var(--accentColor3)]">
                    {analyticsData.busyHours}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Location Stats Card */}
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="dark-card cursor-pointer"
              onClick={() => handleAnalyticsCardClick("Location Analytics")}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-[var(--accentColor1)]/20">
                  <FaSearchLocation className="text-[var(--accentColor1)] text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-white ml-3">
                  Top Locations
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Top Destination</span>
                  <span className="font-semibold text-white">
                    {analyticsData.topDestination}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Top Pickup</span>
                  <span className="font-semibold text-white">
                    {analyticsData.topPickup}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Passengers</span>
                  <span className="font-semibold text-[var(--accentColor5)]">
                    {analyticsData.totalPassengers}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Ride Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <RideRequestForm />
          </motion.div>

          {/* Ride History or Active Trips Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <RideManagement />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
