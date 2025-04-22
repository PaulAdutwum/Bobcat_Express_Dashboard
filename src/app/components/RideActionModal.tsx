"use client";

import { useState, useEffect } from "react";
import { Ride } from "@/lib/types";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaBan,
  FaList,
  FaUserClock,
  FaMapMarkerAlt,
  FaUsers,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { updateRideStatus, deleteRide, archiveRide } from "@/lib/supabase";
import { format } from "date-fns";

type RideActionModalProps = {
  ride: Ride | null;
  action: "approve" | "cancel" | "complete" | "decline" | "delete" | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch (error) {
    return dateString;
  }
};

export default function RideActionModal({
  ride,
  action,
  isOpen,
  onClose,
  onSuccess,
}: RideActionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      setReason("");
      setNotes("");
    }
  }, [isOpen, ride, action]);

  if (!isOpen || !ride) return null;

  const handleAction = async () => {
    if (!ride || !action) return;

    setLoading(true);
    setError(null);

    try {
      switch (action) {
        case "approve":
          await updateRideStatus(ride.id, "active");
          break;
        case "cancel":
          await updateRideStatus(ride.id, "cancelled");
          break;
        case "complete":
          await updateRideStatus(ride.id, "completed");
          break;
        case "decline":
          await updateRideStatus(ride.id, "cancelled");
          break;
        case "delete":
          await deleteRide(ride.id);
          break;
        default:
          throw new Error("Invalid action");
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(`Error ${action}ing ride:`, err);
      setError(`Failed to ${action} ride. Please try again.`);
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (action) {
      case "approve":
        return "Approve Ride Request";
      case "cancel":
        return "Cancel Ride";
      case "complete":
        return "Complete Ride";
      case "decline":
        return "Decline Ride Request";
      case "delete":
        return "Delete Ride";
      default:
        return "Ride Action";
    }
  };

  const getActionColor = () => {
    switch (action) {
      case "approve":
        return "bg-green-600 hover:bg-green-700";
      case "cancel":
        return "bg-orange-500 hover:bg-orange-600";
      case "complete":
        return "bg-blue-600 hover:bg-blue-700";
      case "decline":
        return "bg-red-500 hover:bg-red-600";
      case "delete":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "approve":
        return <FaCheckCircle className="mr-2" />;
      case "cancel":
        return <FaTimesCircle className="mr-2" />;
      case "complete":
        return <FaCheckCircle className="mr-2" />;
      case "decline":
        return <FaBan className="mr-2" />;
      case "delete":
        return <FaTrash className="mr-2" />;
      default:
        return null;
    }
  };

  const getActionText = () => {
    switch (action) {
      case "approve":
        return "Approve";
      case "cancel":
        return "Cancel";
      case "complete":
        return "Complete";
      case "decline":
        return "Decline";
      case "delete":
        return "Delete";
      default:
        return "Submit";
    }
  };

  const getConfirmationText = () => {
    switch (action) {
      case "approve":
        return "Are you sure you want to approve this ride? This will mark it as active.";
      case "cancel":
        return "Are you sure you want to cancel this ride? This action cannot be undone.";
      case "complete":
        return "Are you sure you want to mark this ride as completed?";
      case "decline":
        return "Are you sure you want to decline this ride request? This action cannot be undone.";
      case "delete":
        return "Are you sure you want to permanently delete this ride? This action cannot be undone.";
      default:
        return "Are you sure you want to continue?";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--batesCard)] rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-[var(--batesBorder)]">
          <h2 className="text-xl font-bold text-white">{getModalTitle()}</h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center p-3 bg-[var(--batesBlue)] rounded-lg">
                <div className="flex items-center">
                  <FaUserClock className="text-gray-400 mr-3" />
                  <span className="text-gray-300">Requested:</span>
                </div>
                <span className="text-white">
                  {formatDateTime(ride.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[var(--batesBlue)] rounded-lg">
                <div className="flex items-center">
                  <FaUsers className="text-gray-400 mr-3" />
                  <span className="text-gray-300">Passengers:</span>
                </div>
                <span className="text-white">{ride.passengers}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[var(--batesBlue)] rounded-lg">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-gray-400 mr-3" />
                  <span className="text-gray-300">From:</span>
                </div>
                <span className="text-white">{ride.pickup_location}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[var(--batesBlue)] rounded-lg">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-gray-400 mr-3" />
                  <span className="text-gray-300">To:</span>
                </div>
                <span className="text-white">{ride.destination}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center mb-2">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <p className="text-yellow-300 font-medium">
                  {getConfirmationText()}
                </p>
              </div>

              {(action === "decline" || action === "cancel") && (
                <div className="mt-4">
                  <label className="block text-gray-300 mb-2">
                    Reason (optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[var(--batesBlue)] text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-batesMaroon"
                    rows={3}
                    placeholder="Enter reason for cancellation"
                  />
                </div>
              )}

              {action === "complete" && (
                <div className="mt-4">
                  <label className="block text-gray-300 mb-2">
                    Completion Notes (optional):
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[var(--batesBlue)] text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-batesMaroon"
                    rows={3}
                    placeholder="Add any notes about this completed ride"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md">
                <p className="text-red-400 flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              className={`px-4 py-2 ${getActionColor()} text-white rounded-md transition-colors flex items-center`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {getActionIcon()}
                  {getActionText()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
