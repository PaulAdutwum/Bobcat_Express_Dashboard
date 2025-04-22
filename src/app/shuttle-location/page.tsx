"use client";

import { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from "@react-google-maps/api";
import { db } from "../../../src/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft,
  FaMapMarkedAlt,
  FaRoute,
  FaCompass,
  FaTachometerAlt,
  FaClock,
  FaHistory,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
  FaShuttleVan,
  FaBell,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";

const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "Missing Google Maps API Key! Make sure it's set in your .env file."
  );
}

const MAP_ID = "e9e0cae333b31d7d";
const containerStyle = { width: "100%", height: "100%" };
const defaultLocation = { lat: 44.1003, lng: -70.2148 };

// Links matching the dashboard
const links = [
  { label: "Dashboard", icon: FaCompass, href: "/dashboard" },
  { label: "Ride Management", icon: FaShuttleVan, href: "/ride-management" },
  {
    label: "Shuttle Location",
    icon: FaMapMarkedAlt,
    href: "/shuttle-location",
  },
  { label: "Driver Status", icon: FaUserCircle, href: "/driver-status" },
  { label: "Analytics", icon: FaRoute, href: "/analytics" },
  { label: "User Logs", icon: FaHistory, href: "/user-logs" },
];

// Add these common locations to use for simulating next stops
const commonDestinations = [
  "Walmart, Auburn, ME",
  "Merrill Gym, Bates College",
  "Auburn Mall, Auburn, ME",
  "Lewiston Bus Station",
  "Campus Avenue, Lewiston",
  "College Street, Lewiston",
  "Commons, Bates College",
  "Frye Street, Lewiston",
  "Portland Jetport",
  "Boston Logan Airport",
  "Garcelon Field, Bates College",
];

export default function ShuttleLocation() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY ?? "",
  });

  const [location, setLocation] = useState(defaultLocation);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("Fetching address...");
  const [userAddress, setUserAddress] = useState<string>(
    "Fetching your location..."
  );
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [lastLocations, setLastLocations] = useState<
    Array<{ lat: number; lng: number }>
  >([]);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eta, setEta] = useState<string>("Calculating...");
  const [nextStop, setNextStop] = useState<string>("Unknown");
  const [watchId, setWatchId] = useState<number | null>(null);
  const [simulationInterval, setSimulationInterval] =
    useState<NodeJS.Timeout | null>(null);
  const shuttlePathRef = useRef<Array<{ lat: number; lng: number }>>([]);
  const simulationIndexRef = useRef(0);
  const [showLocationFallback, setShowLocationFallback] = useState(false);

  // Real shuttle route coordinates - simulating a typical route around Bates College
  const simulatedRoute = [
    { lat: 44.1003, lng: -70.2148 }, // Bates College
    { lat: 44.0997, lng: -70.216 }, // College St
    { lat: 44.0988, lng: -70.2175 }, // Campus Ave
    { lat: 44.0975, lng: -70.219 }, // Frye St
    { lat: 44.096, lng: -70.217 }, // Main St
    { lat: 44.095, lng: -70.214 }, // Towards Walmart
    { lat: 44.0965, lng: -70.212 }, // Back to campus
    { lat: 44.098, lng: -70.213 }, // Commons
    { lat: 44.0995, lng: -70.214 }, // Merrill Gym area
    { lat: 44.1003, lng: -70.2148 }, // Back to start
  ];

  // Custom shuttle icon that rotates based on heading
  const getShuttleIcon = () => {
    return {
      path: "M12 2c-4.42 0-8 .5-8 4v10c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4zm5.66 13.66H6.34C6.16 15.28 6 14.87 6 14.4v-1.73c0-.48.16-.89.34-1.26h10.32c.18.38.34.78.34 1.26v1.73c0 .48-.16.89-.34 1.26z M10.5 11c-.83 0-1.5-.67-1.5-1.5S9.67 8 10.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 0c-.83 0-1.5-.67-1.5-1.5S12.67 8 13.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
      fillColor: "#881124",
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: 1.8,
      anchor: new window.google.maps.Point(12, 12),
      rotation: heading,
    };
  };

  // Get user's geolocation
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setShowLocationFallback(true);
      return;
    }

    // Clear any existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    // Watch position for continuous updates
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newLocation);
        setShowLocationFallback(false);
        // Fetch address for user location
        fetchAddress(newLocation.lat, newLocation.lng, true);
      },
      (error) => {
        console.error("Error getting current location:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT,
        });

        // Show a more descriptive error message based on the error code
        let errorMessage = "Could not get your current location. ";

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage +=
              "Location permission was denied. Please enable location services in your browser settings.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage +=
              "Location information is unavailable. Please try again later.";
            break;
          case 3: // TIMEOUT
            errorMessage +=
              "The request to get your location timed out. Please try again.";
            break;
          default:
            errorMessage += "Please check your location permissions.";
        }

        setShowLocationFallback(true);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  // Start simulated shuttle movement
  const startShuttleSimulation = () => {
    // Create a path with intermediate points for smoother movement
    const expandedPath: Array<{ lat: number; lng: number }> = [];

    for (let i = 0; i < simulatedRoute.length - 1; i++) {
      const start = simulatedRoute[i];
      const end = simulatedRoute[i + 1];

      // Add the starting point
      expandedPath.push(start);

      // Add 5 intermediate points for smoother movement
      for (let step = 1; step <= 5; step++) {
        const progress = step / 6;
        expandedPath.push({
          lat: start.lat + (end.lat - start.lat) * progress,
          lng: start.lng + (end.lng - start.lng) * progress,
        });
      }
    }

    // Add the final point to complete the loop
    expandedPath.push(simulatedRoute[simulatedRoute.length - 1]);

    // Store the expanded path for the simulation
    shuttlePathRef.current = expandedPath;

    // Start the interval to update shuttle position
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    const interval = setInterval(() => {
      if (simulationIndexRef.current >= shuttlePathRef.current.length - 1) {
        simulationIndexRef.current = 0;
      }

      const currentPos = shuttlePathRef.current[simulationIndexRef.current];
      const nextPos =
        shuttlePathRef.current[
          (simulationIndexRef.current + 1) % shuttlePathRef.current.length
        ];

      // Update shuttle position
      setLocation(currentPos);

      // Calculate heading based on direction to next point
      const dx = nextPos.lng - currentPos.lng;
      const dy = nextPos.lat - currentPos.lat;
      const heading = Math.atan2(dy, dx) * (180 / Math.PI);
      setHeading(heading);

      // Calculate speed (random variation for realism)
      const speedKmh = 15 + Math.random() * 10; // 15-25 km/h
      setSpeed(Math.round(speedKmh));

      // Update ETA (random minutes between 5-15)
      const randomEta = Math.floor(Math.random() * 11) + 5;
      setEta(`${randomEta} minutes`);

      // Update next stop (random from common destinations)
      if (simulationIndexRef.current % 10 === 0) {
        const randomDestIndex = Math.floor(
          Math.random() * commonDestinations.length
        );
        setNextStop(commonDestinations[randomDestIndex]);
      }

      // Add to path history
      setLastLocations((prevLocations) => {
        const newLocations = [...prevLocations, currentPos];
        // Keep only the last 20 points to avoid cluttering the map
        return newLocations.slice(-20);
      });

      // Fetch address for the current shuttle position
      fetchAddress(currentPos.lat, currentPos.lng, false);

      simulationIndexRef.current++;
    }, 1000); // Update every second

    setSimulationInterval(interval);
  };

  // Auth listener
  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, []);

  // Initialize geolocation and shuttle simulation when component mounts
  useEffect(() => {
    if (isLoaded) {
      // Start getting user's location
      getUserLocation();

      // Start simulated shuttle movement
      startShuttleSimulation();

      // Update initial address
      fetchAddress(defaultLocation.lat, defaultLocation.lng, false);
    }

    // Clean up on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [isLoaded]);

  const fetchAddress = async (
    lat: number,
    lng: number,
    isUserLocation: boolean
  ) => {
    try {
      // Add a timeout to the fetch to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        // Extract meaningful address components
        const result = data.results[0];

        // Extract street name from address components
        let streetName = "";
        let fullAddress = result.formatted_address;

        // Look for route (street) component first
        const streetComponent = result.address_components?.find(
          (component: any) => component.types.includes("route")
        );

        if (streetComponent) {
          streetName = streetComponent.long_name;

          // Add street number if available for better context
          const streetNumber = result.address_components?.find(
            (component: any) => component.types.includes("street_number")
          );

          if (streetNumber) {
            streetName = `${streetNumber.long_name} ${streetName}`;
          }
        } else {
          // Fallback to the most specific part of the formatted address
          const addressParts = fullAddress.split(",");
          if (addressParts.length > 0) {
            streetName = addressParts[0].trim();
          }
        }

        // Set the address based on whether this is for user or shuttle
        if (isUserLocation) {
          setUserAddress(streetName || fullAddress);
        } else {
          setAddress(streetName || fullAddress);
        }

        console.log(
          `${isUserLocation ? "User" : "Shuttle"} location:`,
          streetName || fullAddress
        );
      } else {
        // Fallback formatting when geocoding fails but we have coordinates
        const addressText = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (isUserLocation) {
          setUserAddress(addressText);
        } else {
          setAddress(addressText);
        }
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      // Fallback to coordinates
      const addressText = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (isUserLocation) {
        setUserAddress(addressText);
      } else {
        setAddress(addressText);
      }
    }
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

  const continueWithoutLocation = () => {
    setShowLocationFallback(false);
    // Just continue using the default location
    setUserLocation(null);
    setUserAddress("Location not available");
  };

  if (!isLoaded)
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <FaShuttleVan className="animate-pulse text-batesMaroon text-5xl mx-auto mb-4" />
          <p className="text-xl text-white">Loading shuttle location...</p>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Navigation - Matching dashboard */}
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
                    href === "/shuttle-location"
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
      <main className="flex-1 overflow-hidden flex flex-col bg-black">
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
                Shuttle Live Tracking
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-300 hover:text-batesMaroon rounded-full hover:bg-[var(--batesBlue)] transition-colors">
                <FaBell className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Shuttle Info Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[var(--batesCard)] rounded-lg p-4 shadow-lg border border-[var(--batesBorder)] flex items-center"
          >
            <div className="p-3 rounded-lg bg-batesMaroon/20 mr-3">
              <FaMapMarkedAlt className="text-batesMaroon text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-gray-400">
                Shuttle Location
              </h3>
              <p
                className="text-sm text-white font-medium truncate"
                title={address}
              >
                {address === "Fetching address..."
                  ? "Bates College, Lewiston, ME"
                  : address}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[var(--batesCard)] rounded-lg p-4 shadow-lg border border-[var(--batesBorder)] flex items-center"
          >
            <div className="p-3 rounded-lg bg-blue-500/20 mr-3">
              <FaRoute className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-400">Next Stop</h3>
              <p className="text-sm text-white font-medium">{nextStop}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[var(--batesCard)] rounded-lg p-4 shadow-lg border border-[var(--batesBorder)] flex items-center"
          >
            <div className="p-3 rounded-lg bg-green-500/20 mr-3">
              <FaClock className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-400">ETA</h3>
              <p className="text-sm text-white font-medium">{eta}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-[var(--batesCard)] rounded-lg p-4 shadow-lg border border-[var(--batesBorder)] flex items-center"
          >
            <div className="p-3 rounded-lg bg-purple-500/20 mr-3">
              <FaTachometerAlt className="text-purple-500 text-xl" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-400">
                Current Speed
              </h3>
              <p className="text-sm text-white font-medium">{speed} mph</p>
            </div>
          </motion.div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-batesDark">
              <div className="text-white text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-batesMaroon border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2">Loading Map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={location}
              zoom={15}
              options={{
                mapId: MAP_ID,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                styles: [],
              }}
            >
              {/* Shuttle Marker with InfoWindow */}
              <MarkerF
                position={location}
                icon={getShuttleIcon()}
                onClick={() => setInfoOpen(true)}
              >
                {infoOpen && (
                  <InfoWindowF
                    position={location}
                    onCloseClick={() => setInfoOpen(false)}
                  >
                    <div className="max-w-[300px] text-gray-900">
                      <h3 className="font-semibold text-base mb-1 text-batesMaroon">
                        Bobcat Express Shuttle
                      </h3>
                      <p className="text-sm mb-1">
                        <strong>Current Location:</strong> {address}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>Next Stop:</strong> {nextStop}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>Estimated Arrival:</strong> {eta}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>Current Speed:</strong> {speed} mph
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Last updated:{" "}
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </InfoWindowF>
                )}
              </MarkerF>

              {/* User's current location marker */}
              {userLocation && (
                <MarkerF
                  position={userLocation}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 2,
                    scale: 8,
                  }}
                >
                  <InfoWindowF position={userLocation}>
                    <div className="max-w-[200px] text-gray-900">
                      <h3 className="font-semibold text-sm mb-1">
                        Your Location
                      </h3>
                      <p className="text-sm">{userAddress}</p>
                    </div>
                  </InfoWindowF>
                </MarkerF>
              )}

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

              {/* User Location Controls - can be placed near map controls */}
              {!userLocation && !showLocationFallback && (
                <div className="absolute bottom-4 left-4 z-10">
                  <button
                    onClick={getUserLocation}
                    className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white hover:bg-gray-700 transition-colors shadow-lg"
                  >
                    <FaMapMarkedAlt className="mr-2 text-batesMaroon" />
                    Enable My Location
                  </button>
                </div>
              )}
            </GoogleMap>
          )}

          {/* Location Fallback Dialog */}
          {showLocationFallback && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                <div className="text-yellow-400 text-4xl mb-4 flex justify-center">
                  <FaMapMarkedAlt />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Location Access Required
                </h3>
                <p className="text-gray-300 mb-4">
                  We couldn't access your location. This feature works best when
                  location services are enabled.
                </p>
                <div className="text-sm text-gray-400 mb-6">
                  <p className="mb-2">To enable location services:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Check that location permissions are allowed for this site
                      in your browser settings
                    </li>
                    <li>
                      Make sure your device's location services are turned on
                    </li>
                    <li>Try using a different browser if the issue persists</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => getUserLocation()}
                    className="flex-1 bg-batesMaroon py-2 px-4 rounded text-white font-medium hover:bg-red-800 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={continueWithoutLocation}
                    className="flex-1 bg-gray-700 py-2 px-4 rounded text-white font-medium hover:bg-gray-600 transition-colors"
                  >
                    Continue Without Location
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
