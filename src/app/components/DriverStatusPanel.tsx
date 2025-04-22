"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FaUserTie,
  FaSpinner,
  FaMapMarkerAlt,
  FaSearch,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaSyncAlt,
  FaToggleOn,
  FaToggleOff,
  FaCalendarAlt,
  FaClock,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on break";
  vehicle: string;
  lastActive: Date;
  location: string;
  capacity: number;
  currentPassengers: number;
}

// Mock data for drivers
const mockDrivers: Driver[] = [
  {
    id: "driver-1",
    name: "John Smith",
    email: "jsmith@bates.edu",
    phone: "(207) 555-1234",
    status: "active",
    vehicle: "Shuttle 1",
    lastActive: new Date(),
    location: "Commons",
    capacity: 14,
    currentPassengers: 8,
  },
  {
    id: "driver-2",
    name: "Sarah Johnson",
    email: "sjohnson@bates.edu",
    phone: "(207) 555-5678",
    status: "active",
    vehicle: "Shuttle 2",
    lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    location: "Merrill Gym",
    capacity: 10,
    currentPassengers: 5,
  },
  {
    id: "driver-3",
    name: "Michael Williams",
    email: "mwilliams@bates.edu",
    phone: "(207) 555-8765",
    status: "on break",
    vehicle: "Shuttle 3",
    lastActive: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
    location: "Parking Lot",
    capacity: 14,
    currentPassengers: 0,
  },
  {
    id: "driver-4",
    name: "Emma Davis",
    email: "edavis@bates.edu",
    phone: "(207) 555-4321",
    status: "inactive",
    vehicle: "Shuttle 4",
    lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    location: "Off Campus",
    capacity: 7,
    currentPassengers: 0,
  },
  {
    id: "driver-5",
    name: "Robert Wilson",
    email: "rwilson@bates.edu",
    phone: "(207) 555-9876",
    status: "active",
    vehicle: "Shuttle 5",
    lastActive: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    location: "Frye Street",
    capacity: 10,
    currentPassengers: 7,
  },
];

const DriverStatusPanel = () => {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedDrivers, setDisplayedDrivers] = useState<Driver[]>(drivers);
  const [sortBy, setSortBy] = useState<"name" | "lastActive">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [updatingDriver, setUpdatingDriver] = useState<string | null>(null);

  // Initialize with mock data
  useEffect(() => {
    // In a real app, this would be an API call
    setDrivers(mockDrivers);
  }, []);

  // Filter and sort drivers based on current filters
  useEffect(() => {
    let filtered = [...drivers];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) => driver.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.name.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query) ||
          driver.vehicle.toLowerCase().includes(query) ||
          driver.location.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        // Sort by lastActive
        return sortOrder === "asc"
          ? a.lastActive.getTime() - b.lastActive.getTime()
          : b.lastActive.getTime() - a.lastActive.getTime();
      }
    });

    setDisplayedDrivers(filtered);
  }, [drivers, statusFilter, searchQuery, sortBy, sortOrder]);

  // Function to refresh driver data
  const refreshDrivers = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll just simulate a delay and use the mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update timestamp for one random driver to simulate real-time updates
      const updatedDrivers = [...drivers];
      const randomIndex = Math.floor(Math.random() * updatedDrivers.length);
      updatedDrivers[randomIndex] = {
        ...updatedDrivers[randomIndex],
        lastActive: new Date(),
      };

      setDrivers(updatedDrivers);
    } catch (error) {
      console.error("Error refreshing driver data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update driver status
  const updateDriverStatus = async (
    driverId: string,
    newStatus: "active" | "inactive" | "on break"
  ) => {
    setUpdatingDriver(driverId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedDrivers = drivers.map((driver) =>
        driver.id === driverId
          ? { ...driver, status: newStatus, lastActive: new Date() }
          : driver
      );

      setDrivers(updatedDrivers);
    } catch (error) {
      console.error("Error updating driver status:", error);
    } finally {
      setUpdatingDriver(null);
    }
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString();
  };

  // Count drivers by status for the summary
  const driverCounts = useMemo(() => {
    return {
      all: drivers.length,
      active: drivers.filter((d) => d.status === "active").length,
      inactive: drivers.filter((d) => d.status === "inactive").length,
      onBreak: drivers.filter((d) => d.status === "on break").length,
    };
  }, [drivers]);

  return (
    <div className="bg-[var(--batesCard)] rounded-lg shadow-lg overflow-hidden">
      {/* Header and Controls */}
      <div className="p-5 border-b border-[var(--batesBorder)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Driver Summary */}
          <div className="flex space-x-4">
            <div className="bg-[var(--batesBlue)] px-3 py-2 rounded-md">
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-lg font-semibold text-white">
                {driverCounts.all}
              </div>
            </div>
            <div className="bg-green-900/30 px-3 py-2 rounded-md">
              <div className="text-xs text-gray-400">Active</div>
              <div className="text-lg font-semibold text-green-400">
                {driverCounts.active}
              </div>
            </div>
            <div className="bg-yellow-900/30 px-3 py-2 rounded-md">
              <div className="text-xs text-gray-400">On Break</div>
              <div className="text-lg font-semibold text-yellow-400">
                {driverCounts.onBreak}
              </div>
            </div>
            <div className="bg-red-900/30 px-3 py-2 rounded-md">
              <div className="text-xs text-gray-400">Inactive</div>
              <div className="text-lg font-semibold text-red-400">
                {driverCounts.inactive}
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drivers..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-md bg-[var(--batesBlue)] text-white border border-[var(--batesBorder)] focus:outline-none focus:ring-2 focus:ring-batesMaroon"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-40 pl-10 pr-4 py-2 rounded-md bg-[var(--batesBlue)] text-white border border-[var(--batesBorder)] focus:outline-none focus:ring-2 focus:ring-batesMaroon appearance-none"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on break">On Break</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshDrivers}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white flex items-center justify-center space-x-2 ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-batesMaroon hover:bg-batesMaroon/80"
              }`}
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead className="bg-[var(--batesBlue)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => {
                    if (sortBy === "name") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("name");
                      setSortOrder("asc");
                    }
                  }}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Driver</span>
                  {sortBy === "name" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <button
                  onClick={() => {
                    if (sortBy === "lastActive") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("lastActive");
                      setSortOrder("desc");
                    }
                  }}
                  className="flex items-center space-x-1 hover:text-white"
                >
                  <span>Last Active</span>
                  {sortBy === "lastActive" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--batesBorder)]">
            <AnimatePresence>
              {displayedDrivers.map((driver) => (
                <motion.tr
                  key={driver.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[var(--batesCard)] hover:bg-[var(--batesBlue)] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {driver.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {driver.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {driver.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.status === "active" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-900/40 text-green-400">
                        Active
                      </span>
                    )}
                    {driver.status === "inactive" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-900/40 text-red-400">
                        Inactive
                      </span>
                    )}
                    {driver.status === "on break" && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/40 text-yellow-400">
                        On Break
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {driver.vehicle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatTime(driver.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {driver.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-white">
                        {driver.currentPassengers}/{driver.capacity}
                      </div>
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-batesMaroon h-2 rounded-full"
                          style={{
                            width: `${
                              (driver.currentPassengers / driver.capacity) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {driver.status !== "active" && (
                        <button
                          onClick={() =>
                            updateDriverStatus(driver.id, "active")
                          }
                          disabled={updatingDriver === driver.id}
                          className="px-2 py-1 text-xs bg-green-900/40 text-green-400 rounded hover:bg-green-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Active
                        </button>
                      )}
                      {driver.status !== "on break" && (
                        <button
                          onClick={() =>
                            updateDriverStatus(driver.id, "on break")
                          }
                          disabled={updatingDriver === driver.id}
                          className="px-2 py-1 text-xs bg-yellow-900/40 text-yellow-400 rounded hover:bg-yellow-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Break
                        </button>
                      )}
                      {driver.status !== "inactive" && (
                        <button
                          onClick={() =>
                            updateDriverStatus(driver.id, "inactive")
                          }
                          disabled={updatingDriver === driver.id}
                          className="px-2 py-1 text-xs bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Inactive
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {displayedDrivers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-400 italic"
                >
                  No drivers match your filter criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverStatusPanel;
