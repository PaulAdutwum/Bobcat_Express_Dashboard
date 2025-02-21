"use client";

import { useEffect, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
if (!GOOGLE_MAPS_API_KEY) {
  throw new Error(
    "ç Missing Google Maps API Key! Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file."
  );
}

const LIBRARIES: ("places" | "marker")[] = ["places", "marker"];

//  Map Configuration
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
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
  const [marker, setMarker] = useState<any>(null);
  const [location, setLocation] = useState(defaultLocation);
  const [address, setAddress] = useState<string>("Fetching address...");

  //  Initialize Map Instance
  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  //  Load Advanced Marker (if supported)
  useEffect(() => {
    async function loadMarker() {
      if (!isLoaded || !map) return;
      try {
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          "marker"
        )) as google.maps.MarkerLibrary;

        const newMarker = new AdvancedMarkerElement({
          position: location,
          title: "Shuttle Location",
          map: map,
        });

        setMarker(newMarker);
      } catch (error) {
        console.error("Error loading AdvancedMarkerElement:", error);
      }
    }

    loadMarker();
  }, [isLoaded, map, location]); // Runs only when the map is available

  //  Fetch Initial Shuttle Location from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "drivers", "shuttle-1");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(" Initial Shuttle Location:", data);
          if (data?.lat !== undefined && data?.lng !== undefined) {
            setLocation({ lat: data.lat, lng: data.lng });
            fetchAddress(data.lat, data.lng);
          }
        } else {
          console.log(" No shuttle data found in Firestore!");
        }
      } catch (error) {
        console.error(" Error fetching initial data:", error);
      }
    }

    fetchData();

    const unsub = onSnapshot(doc(db, "drivers", "shuttle-1"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log(" Real-time update:", data);
        if (data?.lat !== undefined && data?.lng !== undefined) {
          setLocation({ lat: data.lat, lng: data.lng });
          fetchAddress(data.lat, data.lng);
        }
      }
    });

    return () => unsub(); // Cleanup Firestore listener
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
