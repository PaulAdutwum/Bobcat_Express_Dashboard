"use client";

import { useEffect, useState } from "react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { db } from "../../../src/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";

// ✅ Ensure API Key is Defined
const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "❌ Missing Google Maps API Key! Make sure it's set in your .env file."
  );
}

// ✅ Map Configuration
const MAP_ID = "e9e0cae333b31d7d"; // Replace with your Google Maps Map ID
const containerStyle = { width: "100%", height: "80vh" };
const defaultLocation = { lat: 44.1003, lng: -70.2148 };

export default function ShuttleLocation() {
  // ✅ Load Google Maps API before rendering map
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY ?? "",
  });

  // ✅ State Variables
  const [location, setLocation] = useState(defaultLocation);
  const [address, setAddress] = useState<string>("Fetching address...");

  // ✅ Fetch Live Shuttle Location from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "drivers", "shuttle-1"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log("📡 Real-time update:", data);
        if (data?.lat !== undefined && data?.lng !== undefined) {
          setLocation({ lat: data.lat, lng: data.lng });
          fetchAddress(data.lat, data.lng);
        }
      }
    });

    return () => unsub(); // Cleanup Firestore listener
  }, []);

  // ✅ Reverse Geocoding to Get Address
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

  if (!isLoaded)
    return (
      <p className="text-center text-xl mt-6">⏳ Loading Google Maps...</p>
    );

  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ Header Section */}
      <header className="bg-[#881124] text-white py-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-6">
          {/* 📌 Bates Logo */}
          <Image
            src="/bateslogow.png"
            alt="Bates College Logo"
            width={150}
            height={50}
            priority
            className="drop-shadow-lg"
          />

          {/* ✅ Navigation Links */}
          <nav className="space-x-6">
            <Link
              href="https://www.bates.edu/campus-safety/bobcat-express-2/#accessible-support-shuttle"
              className="font-semibold text-lg text-white hover:text-gray-300 transition duration-300"
            >
              Our Services
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/"
              className="font-semibold text-lg text-white hover:text-gray-300 transition duration-300"
            >
              About
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/emergency-preparedness/emergency-phone-numbers/"
              className="font-semibold text-lg text-white hover:text-gray-300 transition duration-300"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* ✅ Shuttle Location Display Box */}
      <div className="w-full max-w-4xl mx-auto bg-gray-100 text-gray-900 text-center p-5 rounded-lg shadow-md mt-6 border-2 border-gray-300">
        <p className="text-xl font-semibold">📍 Current Shuttle Location:</p>
        <p className="text-lg text-[#881124] mt-2 font-medium">{address}</p>
      </div>

      {/* ✅ Google Maps Component */}
      <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-md border border-gray-300 mt-6">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
          options={{
            mapId: MAP_ID,
            disableDefaultUI: false,
            gestureHandling: "greedy",
          }}
        >
          {/* 🏎️ Moving Car Icon on Map */}
          <MarkerF
            position={location}
            icon={{
              url: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
              scaledSize: new window.google.maps.Size(50, 50),
            }}
          />
        </GoogleMap>
      </div>

      {/* ✅ Footer Section */}
      <footer className="bg-black text-white py-8 mt-16">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 px-6">
          {/* 🚍 Shuttle Info */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Bobcat Express Shuttle</h3>
            <p className="mt-2 text-gray-400">
              Providing safe and reliable transportation for Bates College
              students.
            </p>
            <p className="mt-2 text-gray-400 flex justify-center md:justify-start items-center">
              📞 Bobcat Express Phone: (207) 786-8300
            </p>
          </div>

          {/* 🔗 Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              {[
                {
                  label: "Community Engaged Learning Shuttle",
                  href: "https://www.bates.edu/campus-safety/transportationservice-learning-shuttle/",
                },
                {
                  label: "Accessible Support",
                  href: "https://www.bates.edu/campus-safety/bobcat-express-2/#accessible-support-shuttle",
                },
                {
                  label: "Medical Appointments",
                  href: "https://www.bates.edu/campus-safety/bobcat-express-reservation-request-form/",
                },
                {
                  label: "L/A Express Shuttle",
                  href: "https://www.bates.edu/campus-safety/lewiston-auburn-shuttle/",
                },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-blue-400 hover:text-white transition duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-6 pt-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Bobcat Express Shuttle. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
