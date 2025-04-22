"use client";

import { useState, useEffect } from "react";
import { Ride } from "@/lib/types";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaClock,
  FaSpinner,
  FaUserClock,
  FaMapMarkerAlt,
  FaUsers,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaPlus,
  FaSyncAlt,
  FaChevronRight,
  FaEllipsisH,
  FaCheckDouble,
  FaRegClock,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  fetchRides,
  fetchActiveRides,
  fetchPendingRides,
  fetchCompletedRides,
  updateRideStatus,
  deleteRide,
  subscribeToRides,
  archiveRide,
  archiveCompletedRides,
} from "@/lib/supabase";
import RideActionModal from "./RideActionModal";

type TabType = "pending" | "active" | "completed" | "cancelled" | "all";

export default function RideManagementPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalAction, setModalAction] = useState<
    "approve" | "cancel" | "complete" | "decline" | "delete" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch rides and set up subscription
  useEffect(() => {
    const loadRides = async () => {
      setIsLoading(true);
      try {
        const allRides = await fetchRides();
        setRides(allRides);
      } catch (error) {
        console.error("Error loading rides:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();

    // Set up real-time subscription
    const subscription = subscribeToRides(() => {
      loadRides();
    });

    // Refresh rides every 30 seconds
    const interval = setInterval(loadRides, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Filter rides based on activeTab and searchQuery
  useEffect(() => {
    let filtered = [...rides];

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((ride) => ride.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ride) =>
          ride.student_name?.toLowerCase().includes(query) ||
          ride.pickup_location?.toLowerCase().includes(query) ||
          ride.destination?.toLowerCase().includes(query) ||
          ride.id?.toLowerCase().includes(query)
      );
    }

    // Sort by created_at
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredRides(filtered);
  }, [rides, activeTab, searchQuery, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const refreshRides = async () => {
    setIsLoading(true);
    try {
      const allRides = await fetchRides();
      setRides(allRides);
    } catch (error) {
      console.error("Error refreshing rides:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (
    ride: Ride,
    action: "approve" | "cancel" | "complete" | "decline" | "delete"
  ) => {
    setSelectedRide(ride);
    setModalAction(action);
    setIsModalOpen(true);
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM d, h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const handleModalSuccess = () => {
    refreshRides();
  };

  const renderActionButtons = (ride: Ride) => {
    if (ride.status === "pending") {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => openActionModal(ride, "approve")}
            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center"
            disabled={actionLoading === ride.id}
          >
            <FaCheckCircle className="mr-1" /> Approve
          </button>
          <button
            onClick={() => openActionModal(ride, "decline")}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center"
            disabled={actionLoading === ride.id}
          >
            <FaTimesCircle className="mr-1" /> Decline
          </button>
        </div>
      );
    }

    if (ride.status === "active") {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => openActionModal(ride, "complete")}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center"
            disabled={actionLoading === ride.id}
          >
            <FaCheckCircle className="mr-1" /> Complete
          </button>
          <button
            onClick={() => openActionModal(ride, "cancel")}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors flex items-center"
            disabled={actionLoading === ride.id}
          >
            <FaTimesCircle className="mr-1" /> Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex space-x-2">
        <button
          onClick={() => openActionModal(ride, "delete")}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center"
          disabled={actionLoading === ride.id}
        >
          <FaTrash className="mr-1" /> Delete
        </button>
      </div>
    );
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "active":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTabCount = (tab: TabType) => {
    if (tab === "all") return rides.length;
    return rides.filter((ride) => ride.status === tab).length;
  };

  return (
    <div className="bg-[var(--batesCard)] rounded-lg shadow-lg border border-[var(--batesBorder)] overflow-hidden">
      {/* Header and Controls */}
      <div className="p-4 border-b border-[var(--batesBorder)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-bold text-white">
            Ride Management
            {isLoading && (
              <FaSpinner className="inline-block ml-2 animate-spin text-gray-400" />
            )}
          </h2>

          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search rides..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 bg-[var(--batesBlue)] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-batesMaroon"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>

            <button
              onClick={toggleSortOrder}
              className="p-2 bg-[var(--batesBlue)] hover:bg-[var(--batesBlue)]/80 text-white rounded-md transition-colors"
              title={sortOrder === "asc" ? "Oldest first" : "Newest first"}
            >
              {sortOrder === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
            </button>

            <button
              onClick={refreshRides}
              className="p-2 bg-[var(--batesBlue)] hover:bg-[var(--batesBlue)]/80 text-white rounded-md transition-colors"
              disabled={isLoading}
            >
              <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-[var(--batesBorder)]">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "all"
              ? "text-white border-b-2 border-batesMaroon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Rides
          <span className="ml-2 bg-[var(--batesBlue)] px-2 py-1 rounded-full text-xs">
            {getTabCount("all")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "pending"
              ? "text-white border-b-2 border-batesMaroon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Pending
          <span className="ml-2 bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
            {getTabCount("pending")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "active"
              ? "text-white border-b-2 border-batesMaroon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Active
          <span className="ml-2 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
            {getTabCount("active")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "completed"
              ? "text-white border-b-2 border-batesMaroon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Completed
          <span className="ml-2 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
            {getTabCount("completed")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("cancelled")}
          className={`flex-1 py-3 px-4 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "cancelled"
              ? "text-white border-b-2 border-batesMaroon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Cancelled
          <span className="ml-2 bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
            {getTabCount("cancelled")}
          </span>
        </button>
      </div>

      {/* Ride List */}
      <div className="overflow-y-auto max-h-[70vh]">
        {isLoading && filteredRides.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <FaSpinner className="animate-spin text-4xl mb-4" />
            <p>Loading rides...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <FaExclamationTriangle className="text-4xl mb-4" />
            <p>No rides found</p>
            {searchQuery && (
              <p className="mt-2 text-sm">
                Try adjusting your search query or switch tabs
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--batesBorder)]">
            <AnimatePresence>
              {filteredRides.map((ride) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 hover:bg-[var(--batesBlue)]/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Status Indicator */}
                      <div
                        className={`p-3 rounded-full ${getStatusClass(
                          ride.status
                        )}`}
                      >
                        {ride.status === "pending" && (
                          <FaClock className="text-white" />
                        )}
                        {ride.status === "active" && (
                          <FaUserClock className="text-white" />
                        )}
                        {ride.status === "completed" && (
                          <FaCheckDouble className="text-white" />
                        )}
                        {ride.status === "cancelled" && (
                          <FaTimesCircle className="text-white" />
                        )}
                      </div>

                      {/* Ride Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-medium">
                              {ride.student_name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-400 mb-1">
                              <FaRegClock className="mr-1" />
                              {formatTimeAgo(ride.created_at)}
                              <span className="mx-2">•</span>
                              {formatDateTime(ride.created_at)}
                            </div>
                          </div>

                          <div className="ml-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusClass(
                                ride.status
                              )}`}
                            >
                              {ride.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-gray-500 mr-2" />
                            <span className="text-gray-300">From:</span>
                            <span className="ml-1 text-white">
                              {ride.pickup_location}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-gray-500 mr-2" />
                            <span className="text-gray-300">To:</span>
                            <span className="ml-1 text-white">
                              {ride.destination}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <FaUsers className="text-gray-500 mr-2" />
                            <span className="text-gray-300">Passengers:</span>
                            <span className="ml-1 text-white">
                              {ride.passengers}
                            </span>
                          </div>

                          {ride.special_instructions && (
                            <div className="flex items-start sm:col-span-2">
                              <FaExclamationTriangle className="text-yellow-500 mr-2 mt-1" />
                              <span className="text-yellow-300">
                                {ride.special_instructions}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 md:mt-0 md:ml-4 flex justify-end">
                      {renderActionButtons(ride)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <RideActionModal
        ride={selectedRide}
        action={modalAction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
