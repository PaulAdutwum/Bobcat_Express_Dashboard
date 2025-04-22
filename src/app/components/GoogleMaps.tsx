"use client";

import { useEffect, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
if (!GOOGLE_MAPS_API_KEY) {
  throw new Error(
    "Missing Google Maps API Key! Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file."
  );
}

const LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

// Map Configuration
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
const containerStyle = { width: "100%", height: "80vh" };
const defaultLocation = { lat: 44.1003, lng: -70.2148 };

export default function GoogleMapComponent() {
  // Load Google Maps API without performance warnings
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // State Variables
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [location, setLocation] = useState(defaultLocation);
  const [address, setAddress] = useState<string>("Fetching address...");

  // Initialize Map Instance
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Load Marker when Map is Ready
  useEffect(() => {
    async function loadMarker() {
      if (!isLoaded || !map) return;
      try {
        if (!window.google?.maps) return; // Ensure Google Maps API is loaded

        // Create a new marker and assign it to state
        const newMarker = new google.maps.Marker({
          position: location,
          map,
          title: "Shuttle Location",
        });

        setMarker(newMarker);
      } catch (error) {
        console.error("Error loading Marker:", error);
      }
    }

    loadMarker();
  }, [isLoaded, map, location]);

  // Fetch Initial Shuttle Location from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Function to handle Firestore operations
    async function setupFirestore() {
      try {
        // Check if db is initialized
        if (!db) {
          console.warn("Firebase Firestore is not initialized.");
          return;
        }

        // Get initial data
        const docRef = doc(db, "drivers", "shuttle-1");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Initial Shuttle Location:", data);
          if (data?.lat !== undefined && data?.lng !== undefined) {
            setLocation({ lat: data.lat, lng: data.lng });
            fetchAddress(data.lat, data.lng);
          }
        } else {
          console.log("No shuttle data found in Firestore!");
        }

        // Set up real-time updates
        unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            console.log("Real-time update:", data);
            if (data?.lat !== undefined && data?.lng !== undefined) {
              setLocation({ lat: data.lat, lng: data.lng });
              fetchAddress(data.lat, data.lng);
            }
          }
        });
      } catch (error) {
        console.error("Error in Firestore setup:", error);
      }
    }

    // Call the async function immediately
    setupFirestore();

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Reverse Geocoding to Get Address
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Unknown location");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress("Error retrieving address");
    }
  };

  if (!isLoaded) return <p>Loading Google Maps...</p>;

  return (
    <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-md border border-gray-300">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location}
        zoom={14}
        options={{
          mapId: MAP_ID,
          tilt: 45,
          heading: 0,
          gestureHandling: "greedy",
          mapTypeControl: false,
        }}
        onLoad={onLoad}
      />
    </div>
  );
}
