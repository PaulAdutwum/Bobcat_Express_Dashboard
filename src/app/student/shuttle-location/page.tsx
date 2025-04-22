"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBus,
  FaArrowRight,
} from "react-icons/fa";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "Missing Google Maps API Key! Make sure it's set in your .env file."
  );
}

// Map Configuration
const MAP_ID = "e9e0cae333b31d7d"; // Make sure this matches the dashboard map ID
const containerStyle = { width: "100%", height: "500px" };
const defaultLocation = { lat: 44.1003, lng: -70.2148 }; // Bates College

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ShuttleLocation type
interface ShuttleLocation {
  id: string;
  current_location: string;
  lat: number;
  lng: number;
  next_stop: string;
  eta: string;
  status: "moving" | "stopped" | "maintenance";
  speed: number;
  heading: string;
  created_at: string;
  route?: any;
  street_address?: string;
}

export default function ShuttleLocationPage() {
  // Google Maps loading state
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [shuttleLocations, setShuttleLocations] = useState<ShuttleLocation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [selectedShuttle, setSelectedShuttle] =
    useState<ShuttleLocation | null>(null);
  const [lastLocations, setLastLocations] = useState<
    Array<{ lat: number; lng: number }>
  >([]);

  // Custom shuttle icon that rotates based on heading
  const getShuttleIcon = (heading: string | number) => {
    if (!isLoaded || !window.google) return undefined;

    const headingNum =
      typeof heading === "string" ? parseInt(heading) || 0 : heading;

    return {
      path: "M12 2c-4.42 0-8 .5-8 4v10c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4zm5.66 13.66H6.34C6.16 15.28 6 14.87 6 14.4v-1.73c0-.48.16-.89.34-1.26h10.32c.18.38.34.78.34 1.26v1.73c0 .48-.16.89-.34 1.26z M10.5 11c-.83 0-1.5-.67-1.5-1.5S9.67 8 10.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5S12.67 8 13.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
      fillColor: "#881124",
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: 1.8,
      anchor: new window.google.maps.Point(12, 12),
      rotation: headingNum,
    };
  };

  // Update shuttle path history
  useEffect(() => {
    if (shuttleLocations.length > 0) {
      const locations = shuttleLocations.map((shuttle) => ({
        lat: shuttle.lat,
        lng: shuttle.lng,
      }));

      // Add to path history (limit to 10 points)
      setLastLocations((prev) => {
        const newLocations = [...prev, ...locations];
        return newLocations.slice(-10); // Keep just the most recent 10
      });
    }
  }, [shuttleLocations]);

  // Fetch shuttle locations with enhanced address lookup
  const fetchShuttleLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("shuttle_locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shuttle locations:", error);
        setError("Could not load shuttle locations");

        // For development - provide mock data if there's an error
        if (process.env.NODE_ENV === "development") {
          const mockLocations: ShuttleLocation[] = [
            {
              id: "mock-1",
              current_location: "Commons",
              lat: 44.1057,
              lng: -70.2006,
              next_stop: "Library",
              eta: "5 minutes",
              status: "moving",
              speed: 15,
              heading: "North",
              created_at: new Date().toISOString(),
              street_address: "136 Central Ave, Lewiston, ME 04240",
            },
            {
              id: "mock-2",
              current_location: "Merrill Gym",
              lat: 44.1065,
              lng: -70.2037,
              next_stop: "Chase Hall",
              eta: "8 minutes",
              status: "stopped",
              speed: 0,
              heading: "East",
              created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
              street_address: "145 Russell St, Lewiston, ME 04240",
            },
          ];
          setShuttleLocations(mockLocations);
          if (mockLocations.length > 0) setSelectedShuttle(mockLocations[0]);
        } else {
          setShuttleLocations([]);
        }
      } else {
        // If we have real data but no street addresses, try to get them
        const enhancedData = data || [];
        setShuttleLocations(enhancedData);
        if (data && data.length > 0) setSelectedShuttle(data[0]);

        // For development, add mock addresses if missing
        if (process.env.NODE_ENV === "development") {
          for (const shuttle of enhancedData) {
            if (!shuttle.street_address) {
              shuttle.street_address = "Bates College Area, Lewiston, ME";
            }
          }
        }
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Exception in fetchShuttleLocations:", error);
      setError("An unexpected error occurred");
      setLoading(false);

      // Provide mock data for development
      if (process.env.NODE_ENV === "development") {
        const mockShuttle = {
          id: "mock-error",
          current_location: "Commons",
          lat: 44.1057,
          lng: -70.2006,
          next_stop: "Library",
          eta: "5 minutes",
          status: "moving" as const,
          speed: 15,
          heading: "North",
          created_at: new Date().toISOString(),
          street_address: "136 Central Ave, Lewiston, ME 04240",
        };
        setShuttleLocations([mockShuttle]);
        setSelectedShuttle(mockShuttle);
      }
    }
  };

  // Set up real-time subscription and initial fetch
  useEffect(() => {
    fetchShuttleLocations();

    // Set up subscription
    const subscription = supabase
      .channel("shuttle-locations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shuttle_locations",
        },
        () => {
          fetchShuttleLocations();
        }
      )
      .subscribe();

    // Refresh data every 30 seconds as a fallback
    const interval = setInterval(fetchShuttleLocations, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Format the time string nicely
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // Seconds

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return date.toLocaleTimeString();
  };

  // Get a status color based on shuttle status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "moving":
        return "text-green-400";
      case "stopped":
        return "text-yellow-400";
      case "maintenance":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 md:mb-0">
          Shuttle Locations
        </h1>
        <div className="flex items-center text-gray-400 text-sm">
          <FaClock className="mr-1" />
          Last updated: {formatLastUpdated(lastUpdated)}
          <button
            onClick={fetchShuttleLocations}
            className="ml-2 p-1 rounded hover:bg-batesMaroon/20 transition-colors"
            disabled={loading}
            aria-label="Refresh"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      {/* Google Maps Section */}
      <div className="mb-6 bg-[var(--batesCard)] border border-[var(--batesBorder)] rounded-lg overflow-hidden">
        <div className="h-[500px] w-full">
          {!isLoaded ? (
            <div className="h-full w-full flex items-center justify-center bg-batesDark">
              <div className="text-white text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-batesMaroon border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2">Loading Map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={
                selectedShuttle
                  ? { lat: selectedShuttle.lat, lng: selectedShuttle.lng }
                  : defaultLocation
              }
              zoom={15}
              options={{
                mapId: MAP_ID,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
              }}
            >
              {/* Render shuttle markers */}
              {shuttleLocations.map((shuttle) => (
                <MarkerF
                  key={shuttle.id}
                  position={{ lat: shuttle.lat, lng: shuttle.lng }}
                  icon={getShuttleIcon(shuttle.heading)}
                  onClick={() => {
                    setSelectedShuttle(shuttle);
                    setInfoOpen(true);
                  }}
                >
                  {infoOpen && selectedShuttle?.id === shuttle.id && (
                    <InfoWindowF
                      position={{ lat: shuttle.lat, lng: shuttle.lng }}
                      onCloseClick={() => setInfoOpen(false)}
                    >
                      <div className="max-w-[300px] text-gray-900">
                        <h3 className="font-semibold text-base mb-1 text-batesMaroon">
                          Bobcat Express Shuttle
                        </h3>
                        <p className="text-sm mb-1">
                          <strong>Current Location:</strong>{" "}
                          {shuttle.current_location}
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Next Stop:</strong> {shuttle.next_stop}
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Estimated Arrival:</strong> {shuttle.eta}
                        </p>
                        <p className="text-sm mb-1">
                          <strong>Current Speed:</strong> {shuttle.speed} mph
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Last updated: {formatLastUpdated(lastUpdated)}
                          </p>
                        </div>
                      </div>
                    </InfoWindowF>
                  )}
                </MarkerF>
              ))}

              {/* Shuttle path history */}
              {lastLocations.length > 1 && (
                <PolylineF
                  path={lastLocations}
                  options={{
                    strokeColor: "#881124",
                    strokeOpacity: 0.75,
                    strokeWeight: 4,
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>

      {/* Updated Shuttle Detail Cards with more prominent information */}
      {shuttleLocations.length === 0 && !loading && !error ? (
        <div className="bg-[var(--batesCard)] rounded-lg p-12 border border-[var(--batesBorder)] text-center">
          <FaBus className="mx-auto text-4xl text-gray-500 mb-4" />
          <h2 className="text-xl text-white mb-2">No Active Shuttles</h2>
          <p className="text-gray-400">
            There are no shuttles currently in service. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shuttleLocations.map((shuttle) => (
            <div
              key={shuttle.id}
              className={`bg-[var(--batesCard)] rounded-lg border ${
                selectedShuttle?.id === shuttle.id
                  ? "border-batesMaroon"
                  : "border-[var(--batesBorder)]"
              } overflow-hidden hover:border-batesMaroon/50 transition-colors cursor-pointer`}
              onClick={() => {
                setSelectedShuttle(shuttle);
                setInfoOpen(true);
              }}
            >
              {/* Enhanced header with status indicator */}
              <div className="p-4 border-b border-[var(--batesBorder)] flex justify-between items-center">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <FaBus className={`mr-2 ${getStatusColor(shuttle.status)}`} />
                  Shuttle {shuttle.id.substring(0, 8)}
                  <span
                    className={`ml-2 text-sm ${getStatusColor(shuttle.status)}`}
                  >
                    • {shuttle.status}
                  </span>
                </h2>

                {/* Larger, more prominent ETA display */}
                <div className="bg-batesMaroon/20 px-4 py-2 rounded-lg flex items-center border border-batesMaroon/30">
                  <FaClock className="text-yellow-300 mr-2 text-base" />
                  <span className="text-white font-bold text-base">
                    ETA: {shuttle.eta}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Current location with more prominent address and movement indicator */}
                <div className="mb-6 bg-[var(--batesBlue)]/10 p-3 rounded-lg border border-[var(--batesBlue)]/20">
                  <div className="flex items-start">
                    <div className="relative">
                      <FaMapMarkerAlt className="text-batesMaroon text-xl mr-3 mt-1" />
                      {/* Movement indicator dot */}
                      {shuttle.status === "moving" && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="text-white font-bold text-lg">
                          {shuttle.current_location}
                        </p>
                        {shuttle.status === "moving" && (
                          <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                            Moving
                          </span>
                        )}
                        {shuttle.status === "stopped" && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                            Stopped
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm font-medium">
                        {shuttle.street_address || "Address unavailable"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next stop with route visualization */}
                <div className="mb-4 px-3 py-2 border-l-4 border-blue-500 bg-blue-500/10 rounded-r-lg">
                  <p className="text-gray-400 text-xs">Next Stop</p>
                  <div className="flex items-center">
                    <FaArrowRight className="text-blue-400 mr-2" />
                    <p className="text-white font-medium">
                      {shuttle.next_stop}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="px-3 py-2 bg-[var(--batesCard)]/70 rounded">
                    <p className="text-gray-400 text-xs">Speed</p>
                    <p className="text-white font-medium">
                      {shuttle.speed} mph
                    </p>
                  </div>

                  <div className="px-3 py-2 bg-[var(--batesCard)]/70 rounded">
                    <p className="text-gray-400 text-xs">Direction</p>
                    <p className="text-white font-medium">{shuttle.heading}</p>
                  </div>

                  <div className="px-3 py-2 bg-[var(--batesCard)]/70 rounded">
                    <p className="text-gray-400 text-xs">Updated</p>
                    <p className="text-white font-medium">
                      {new Date(shuttle.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick action button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={fetchShuttleLocations}
          className="bg-batesMaroon text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-batesMaroon/90 transition-all"
          aria-label="Refresh shuttle locations"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
