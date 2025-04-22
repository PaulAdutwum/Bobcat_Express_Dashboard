"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AnalyticsBarChart from "../components/AnalyticsBarChart";
import AnalyticsPieChart from "../components/AnalyticsPieChart";
import AnalyticsScatterPlot from "../components/AnalyticsScatterChart";
import ChartComponent from "../components/ChartComponent";
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
  FaCalendarAlt,
  FaFilter,
  FaFileExport,
  FaDownload,
  FaPrint,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { auth, db } from "../../lib/firebase";
import { User } from "firebase/auth";
import {
  fetchRides,
  fetchActiveRides,
  fetchPendingRides,
  fetchCompletedRides,
  fetchDailyRides,
} from "@/lib/supabase";
import { subscribeToRides } from "@/lib/supabase";

// Navigation links
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

// Filter options
const timeFilterOptions = [
  { label: "Last 24 Hours", value: "day" },
  { label: "Last Week", value: "week" },
  { label: "Last Month", value: "month" },
  { label: "Last Quarter", value: "quarter" },
  { label: "Last Year", value: "year" },
];

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [activeTimeFilter, setActiveTimeFilter] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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
    destinations: [
      { name: "Walmart", count: 42 },
      { name: "Commons", count: 31 },
      { name: "Health Center", count: 24 },
      { name: "Library", count: 18 },
      { name: "Dining Hall", count: 15 },
    ],
    pickups: [
      { name: "Commons", count: 35 },
      { name: "Dorms", count: 30 },
      { name: "Library", count: 22 },
      { name: "Dining Hall", count: 14 },
      { name: "Student Center", count: 9 },
    ],
    ridesByTime: [
      { hour: "8 AM", count: 12 },
      { hour: "10 AM", count: 8 },
      { hour: "12 PM", count: 15 },
      { hour: "2 PM", count: 17 },
      { hour: "4 PM", count: 25 },
      { hour: "6 PM", count: 22 },
      { hour: "8 PM", count: 14 },
      { hour: "10 PM", count: 10 },
    ],
    ridesByDay: [
      { day: "Mon", count: 35 },
      { day: "Tue", count: 28 },
      { day: "Wed", count: 32 },
      { day: "Thu", count: 40 },
      { day: "Fri", count: 48 },
      { day: "Sat", count: 52 },
      { day: "Sun", count: 38 },
    ],
    ridesByStatus: [
      { status: "Completed", count: 180, color: "#10b981" },
      { status: "Active", count: 15, color: "#3b82f6" },
      { status: "Pending", count: 25, color: "#f59e0b" },
      { status: "Cancelled", count: 12, color: "#ef4444" },
    ],
    passengerData: [
      { rides: 1, passengers: 42 },
      { rides: 2, passengers: 30 },
      { rides: 3, passengers: 20 },
      { rides: 4, passengers: 15 },
      { rides: 5, passengers: 10 },
    ],
    waitTimeData: [
      { time: "<5 min", count: 120 },
      { time: "5-10 min", count: 80 },
      { time: "10-15 min", count: 40 },
      { time: "15-20 min", count: 15 },
      { time: ">20 min", count: 5 },
    ],
  });

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });

      return () => unsubscribe();
    }
  }, []);

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

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

      // Analyze destinations from all rides
      const destinationCounts: Record<string, number> = {};
      const pickupCounts: Record<string, number> = {};

      allRides.forEach((ride) => {
        // Count destinations
        if (ride.destination) {
          destinationCounts[ride.destination] =
            (destinationCounts[ride.destination] || 0) + 1;
        }

        // Count pickups
        if (ride.pickup_location) {
          pickupCounts[ride.pickup_location] =
            (pickupCounts[ride.pickup_location] || 0) + 1;
        }
      });

      // Convert to array format for charts
      const destinationsArray = Object.keys(destinationCounts)
        .map((name) => ({
          name,
          count: destinationCounts[name],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 destinations

      const pickupsArray = Object.keys(pickupCounts)
        .map((name) => ({
          name,
          count: pickupCounts[name],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 pickups

      // Update the analytics data with real data
      setAnalyticsData((prev) => ({
        ...prev,
        totalRides: allRides.length,
        activeRides: activeRides.length,
        pendingRides: pendingRides.length,
        completedRides: completedRides.length,
        dailyRides: dailyRides.length,
        totalPassengers: totalPassengers,
        averageTripDuration: avgDuration,
        // Use real destination and pickup data if available
        destinations:
          destinationsArray.length > 0 ? destinationsArray : prev.destinations,
        pickups: pickupsArray.length > 0 ? pickupsArray : prev.pickups,
        // Set top destination and pickup
        topDestination:
          destinationsArray.length > 0
            ? destinationsArray[0].name
            : prev.topDestination,
        topPickup:
          pickupsArray.length > 0 ? pickupsArray[0].name : prev.topPickup,
      }));
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToRides((payload) => {
      // Refresh data when rides update
      loadAnalytics();
    });

    // Initial data load
    loadAnalytics();

    return () => {
      unsubscribe.unsubscribe();
    };
  }, [activeTimeFilter]);

  const handleTimeFilterChange = (filter: string) => {
    setActiveTimeFilter(filter);
  };

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

  const handleExportData = () => {
    alert("Analytics data export functionality will be added soon!");
  };

  // Add this guard at the beginning of any function that uses Firebase db
  useEffect(() => {
    // Safe Firebase usage - only proceed if db is initialized
    if (!db) {
      console.warn(
        "Firebase DB not initialized - skipping Firebase operations"
      );
      return;
    }

    // Only proceed with Firebase collection calls if db exists
    try {
      // Your Firebase collection code here
      // Example:
      // const q = query(collection(db, "ride_logs"), orderBy("requestTime", "desc"));
      // ...
    } catch (error) {
      console.error("Firebase error:", error);
    }
  }, []);

  // Similar pattern for any other Firebase operations
  const fetchFirebaseData = async () => {
    if (!db) {
      console.warn("Firebase DB not initialized");
      return [];
    }

    try {
      // Your Firebase code here
      // Example:
      // const q = query(collection(db, "collection_name"));
      // const snapshot = await getDocs(q);
      // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
      return [];
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
              <h1 className="text-2xl font-bold text-white">
                Ride Analytics Dashboard
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
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="px-5 py-6 space-y-8">
          {/* Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[var(--batesCard)] p-4 rounded-xl border border-[var(--batesBorder)] flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <span className="text-white font-medium">Time Period:</span>
              <div className="flex space-x-2">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setActiveTimeFilter(option.value)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      activeTimeFilter === option.value
                        ? "bg-batesMaroon text-white"
                        : "bg-[var(--batesBlue)] text-gray-300 hover:bg-batesMaroon/20"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 bg-[var(--batesBlue)] hover:bg-[var(--batesBlue)]/80 text-white px-3 py-2 rounded-md transition-colors"
              >
                <FaFileExport />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 bg-[var(--batesBlue)] hover:bg-[var(--batesBlue)]/80 text-white px-3 py-2 rounded-md transition-colors">
                <FaPrint />
                <span>Print</span>
              </button>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Rides Card */}
            <div className="stats-card">
              <div>
                <h3 className="stats-card-title mb-1">Total Rides</h3>
                <p className="stats-card-value">{analyticsData.totalRides}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {activeTimeFilter === "day"
                    ? "Past 24 hours"
                    : activeTimeFilter === "week"
                    ? "Past 7 days"
                    : activeTimeFilter === "month"
                    ? "Past 30 days"
                    : activeTimeFilter === "quarter"
                    ? "Past 90 days"
                    : "Past 365 days"}
                </p>
              </div>
              <div className="bg-[var(--primaryColor)]/20 stats-card-icon">
                <FaShuttleVan className="text-[var(--primaryColor)] text-2xl" />
              </div>
            </div>

            {/* Total Passengers */}
            <div className="stats-card">
              <div>
                <h3 className="stats-card-title mb-1">Total Passengers</h3>
                <p className="stats-card-value">
                  {analyticsData.totalPassengers}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Avg{" "}
                  {(
                    analyticsData.totalPassengers / analyticsData.totalRides
                  ).toFixed(1)}{" "}
                  per ride
                </p>
              </div>
              <div className="bg-[var(--accentColor1)]/20 stats-card-icon">
                <FaUser className="text-[var(--accentColor1)] text-2xl" />
              </div>
            </div>

            {/* Average Wait Time */}
            <div className="stats-card">
              <div>
                <h3 className="stats-card-title mb-1">Avg. Wait Time</h3>
                <p className="stats-card-value">
                  {analyticsData.averageWaitTime} min
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  For all completed rides
                </p>
              </div>
              <div className="bg-[var(--accentColor2)]/20 stats-card-icon">
                <FaChartLine className="text-[var(--accentColor2)] text-2xl" />
              </div>
            </div>

            {/* Average Trip Duration */}
            <div className="stats-card">
              <div>
                <h3 className="stats-card-title mb-1">Avg. Trip Duration</h3>
                <p className="stats-card-value">
                  {analyticsData.averageTripDuration.toFixed(1)} min
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  For all completed rides
                </p>
              </div>
              <div className="bg-[var(--accentColor3)]/20 stats-card-icon">
                <FaCalendarAlt className="text-[var(--accentColor3)] text-2xl" />
              </div>
            </div>
          </motion.div>

          {/* Chart Row 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Rides by Status Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Rides by Status</h3>
              <div className="p-4 h-[300px] flex items-center justify-center">
                <AnalyticsPieChart
                  data={analyticsData.ridesByStatus.map((item) => ({
                    name: item.status,
                    value: item.count,
                    color: item.color,
                  }))}
                />
              </div>
            </div>

            {/* Rides by Time Bar Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Rides by Time of Day</h3>
              <div className="p-4 h-[300px] flex items-center justify-center">
                <AnalyticsBarChart
                  data={analyticsData.ridesByTime.map((item) => ({
                    name: item.hour,
                    value: item.count,
                  }))}
                  xAxisLabel="Time of Day"
                  yAxisLabel="Number of Rides"
                />
              </div>
            </div>
          </motion.div>

          {/* Chart Row 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Top Destinations */}
            <div className="chart-card">
              <h3 className="chart-title flex items-center justify-between">
                <span>Popular Destinations</span>
                {isLoading ? (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-md">
                    Updating...
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-md">
                    Live Data
                  </span>
                )}
              </h3>
              <div className="p-4 h-[300px] flex items-center justify-center">
                <AnalyticsBarChart
                  data={analyticsData.destinations.map((item) => ({
                    name: item.name,
                    value: item.count,
                  }))}
                  xAxisLabel="Destination"
                  yAxisLabel="Number of Rides"
                  color="#10b981"
                />
              </div>
              <div className="p-2 border-t border-[var(--batesBorder)] text-center">
                <p className="text-sm text-gray-400">
                  Most popular:{" "}
                  <span className="text-white font-medium">
                    {analyticsData.topDestination}
                  </span>{" "}
                  ({analyticsData.destinations[0]?.count || 0} rides)
                </p>
              </div>
            </div>

            {/* Rides by Day of Week */}
            <div className="chart-card">
              <h3 className="chart-title">Rides by Day of Week</h3>
              <div className="p-4 h-[300px] flex items-center justify-center">
                <AnalyticsBarChart
                  data={analyticsData.ridesByDay.map((item) => ({
                    name: item.day,
                    value: item.count,
                  }))}
                  xAxisLabel="Day of Week"
                  yAxisLabel="Number of Rides"
                  color="#3b82f6"
                />
              </div>
            </div>
          </motion.div>

          {/* Chart Row 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 gap-6"
          >
            {/* Wait Time Distribution */}
            <div className="chart-card">
              <h3 className="chart-title">Wait Time Distribution</h3>
              <div className="p-4 h-[300px] flex items-center justify-center">
                <AnalyticsBarChart
                  data={analyticsData.waitTimeData.map((item) => ({
                    name: item.time,
                    value: item.count,
                  }))}
                  xAxisLabel="Wait Time"
                  yAxisLabel="Number of Rides"
                  color="#f59e0b"
                />
              </div>
            </div>
          </motion.div>

          {/* Passenger Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="chart-card"
          >
            <h3 className="chart-title">Passenger Distribution</h3>
            <div className="p-4 h-[400px] flex items-center justify-center">
              <AnalyticsScatterPlot
                data={analyticsData.passengerData.map((item) => ({
                  x: item.rides,
                  y: item.passengers,
                  size: item.passengers * 2,
                }))}
                xAxisLabel="Passengers per Ride"
                yAxisLabel="Count"
              />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
