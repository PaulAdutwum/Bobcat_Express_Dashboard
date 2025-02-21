"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaShuttleVan, FaSignInAlt, FaUserShield } from "react-icons/fa";
import { Typewriter } from "react-simple-typewriter";
import { auth, googleProvider } from "../../src/lib/firebase";
import { signInWithPopup, User } from "firebase/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });
  }, []);

  // 🔹 Handle Firebase Google Sign-In
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      router.push("/dashboard"); // ✅ Redirect to Dashboard after login
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🔹 Header Section */}
      <header className="bg-[#881124] text-white py-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center px-6">
          {/* Bates College Logo */}
          <Image
            src="/bateslogow.png"
            alt="Bates College Logo"
            width={150}
            height={50}
            priority
            className="drop-shadow-lg"
          />

          {/* Navigation Links */}
          <nav className="space-x-6">
            <Link
              href="https://www.bates.edu/campus-safety/"
              className="font-semibold text-lg hover:text-gray-300 transition duration-300"
            >
              About
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/bobcat-express-2/#accessible-support-shuttle"
              className="font-semibold text-lg hover:text-gray-300 transition duration-300"
            >
              Our Services
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/emergency-preparedness/emergency-phone-numbers/"
              className="font-semibold text-lg hover:text-gray-300 transition duration-300"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Typewriter Animation */}
      <main className="flex flex-col items-center justify-center text-center bg-gray-100 flex-grow p-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 text-center 
             tracking-wide py-4 md:py-8 leading-tight mb-14 md:mb-20
             transition-all duration-300 hover:scale-105 hover:text-[#881124]"
        >
          <span className="text-[#881124] hover:text-red-700 transition-all duration-300">
            Thank You
          </span>{" "}
          for Using
          <span className="text-gray-800 font-extrabold hover:text-[#881124] transition-all duration-300">
            Bobcat Express
          </span>
        </motion.h1>

        {/* Typewriter Effect for Mission Statement */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-700 mt-4 mb-8"
        >
          <Typewriter
            words={[
              "Campus Safety is committed to fostering an environment where all students feel safe to learn.",
              "Bobcat Express provides reliable Shuttle Services for Bates College Students",
              "Connecting You to Lewiston & Auburn",
              "Bobcat Express supports  trips related to Community Engaged Learning, Medical Rides & Safe Rides",
            ]}
            loop
            cursor
            cursorStyle="|"
            typeSpeed={60}
            deleteSpeed={50}
            delaySpeed={1000}
          />
        </motion.p>

        {/* Call to Action - Sign In Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-8 bg-[#881124] text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 hover:bg-gray-800 transition duration-300"
          onClick={handleSignIn}
        >
          <FaSignInAlt />
          <span>Sign in with Google</span>
        </motion.button>

        <section className="container mx-auto mt-12 px-6 bg-gray-100 py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Available Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/*  Service 1 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-lg transition duration-300 flex flex-col items-center text-center"
            >
              <FaShuttleVan className="text-4xl text-[#881124]" />
              <h3 className="mt-4 text-lg text-gray-400 font-bold">
                Community Engaged Learning (CELS)
              </h3>
              <p className="text-gray-600 mt-2">
                Safe transportation for students involved in community
                engagement programs in Lewiston/Auburn.
              </p>
            </motion.div>

            {/* Service 2 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-lg transition duration-300 flex flex-col items-center text-center"
            >
              <FaUserShield className="text-4xl text-[#881124]" />
              <h3 className="mt-4 text-lg text-gray-400 font-bold">
                Safe Ride Shuttle
              </h3>
              <p className="text-gray-600 mt-2">
                A dedicated service ensuring students arrive safely to their
                destinations at night.
              </p>
            </motion.div>

            {/* Service 3 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-lg transition duration-300 flex flex-col items-center text-center"
            >
              <FaShuttleVan className="text-4xl text-[#881124]" />
              <h3 className="mt-4 text-lg text-gray-400 font-bold">
                Medical Appointments
              </h3>
              <p className="text-gray-600 mt-2">
                Shuttle services for students requiring transportation to
                medical appointments.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-black text-white py-1 mt-0">
        <div className="container mx-auto grid md:grid-cols-2 gap-8 px-6">
          {/* Shuttle Info */}
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

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Quick Links</h3>
            <ul className="mt-2 space-y-2">
              {[
                {
                  label: "Community Engaged Learning Shuttle",
                  href: "/services",
                },
                { label: "Accessible Support", href: "/services" },
                { label: "Medical Appointments", href: "/services" },
                { label: "L/A Express Shuttle", href: "/services" },
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
