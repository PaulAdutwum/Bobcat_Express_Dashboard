"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  FaShuttleVan,
  FaSignInAlt,
  FaUserShield,
  FaGoogle,
  FaArrowRight,
  FaAccessibleIcon,
  FaMedal,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaPhoneAlt,
  FaHospital,
  FaUserClock,
  FaChartLine,
  FaUsers,
  FaRoute,
  FaInfoCircle,
  FaLocationArrow,
  FaRegClock,
  FaBusAlt,
  FaClock,
  FaShieldAlt,
  FaUserFriends,
  FaEnvelope,
  FaHome,
  FaHistory,
  FaSignOutAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaCar,
} from "react-icons/fa";
import { auth, googleProvider } from "../../src/lib/firebase";
import { signInWithPopup, User } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";
import { createRide } from "@/lib/supabase";
import { locations } from "@/lib/constants";
import {
  fetchActiveRides,
  fetchPendingRides,
  fetchCompletedRides,
} from "@/lib/supabase";

// Safely handle localStorage operations
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  },
};

// Define shuttle locations structure
interface ShuttleLocationOption {
  id: string;
  name: string;
}

// Create shuttle locations from the imported locations array
const shuttleLocations: ShuttleLocationOption[] = locations.map(
  (location, index) => ({
    id: `location-${index}`,
    name: location,
  })
);

// Define Ride type locally
interface Ride {
  id: string;
  student_name: string;
  pickup_location: string;
  destination: string;
  passengers: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;
  user_email?: string;
  special_instructions?: string;
}

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Local implementation for fetchRidesByEmail
async function fetchRidesByEmail(email: string): Promise<Ride[]> {
  console.log(`Fetching rides for user with email: ${email}`);
  try {
    // Since user_email doesn't exist as a column, we search in special_instructions
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .ilike("special_instructions", `%${email}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rides by email:", error);
      return [];
    }

    // Filter results to ensure we only get rides with this exact email
    const filteredData =
      data?.filter((ride) =>
        ride.special_instructions?.includes(
          `User Email: ${email.trim().toLowerCase()}`
        )
      ) || [];

    console.log(`Found ${filteredData.length} rides for email ${email}`);
    return filteredData as Ride[];
  } catch (error) {
    console.error("Exception in fetchRidesByEmail:", error);
    return [];
  }
}

// Local implementation for subscribeToRidesByEmail
function subscribeToRidesByEmail(
  email: string,
  callback: (updatedRides: Ride[]) => void
) {
  console.log(`Setting up subscription for rides (email: ${email})`);

  // Create a unique channel name based on the email
  const channelName = `rides-by-email-${email.replace(/[^a-zA-Z0-9]/g, "-")}`;

  // Subscribe to all ride changes and filter in code
  const subscription = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rides",
      },
      async () => {
        console.log(
          `Received real-time update for rides, checking if relevant to ${email}`
        );

        // When changes occur, fetch the updated list filtered by email
        const rides = await fetchRidesByEmail(email);

        // Only trigger callback if we have matching rides
        if (rides.length > 0) {
          callback(rides);
        }
      }
    )
    .subscribe();

  console.log(`Subscription active for rides (filtered by email: ${email})`);
  return subscription;
}

// Define a type for the stats object
interface StatsData {
  activeUsers: number;
  dailyRides: number;
  totalRides: number;
  avgRideTime: number;
}

// Fixed initial stats to avoid hydration mismatch
const initialStats: StatsData = {
  activeUsers: 42,
  dailyRides: 95,
  totalRides: 4250,
  avgRideTime: 9,
};

// Generate realistic stats with small variations - only used after hydration
const getRandomStats = (): StatsData => {
  return {
    activeUsers: Math.floor(Math.random() * 20) + 35, // Between 35-55 active users
    dailyRides: Math.floor(Math.random() * 40) + 80, // Between 80-120 daily rides
    totalRides: Math.floor(Math.random() * 1200) + 3800, // Between 3800-5000 total rides
    avgRideTime: Math.floor(Math.random() * 6) + 7, // Between 7-13 minute average ride time
  };
};

// Define the type for handle change event
type InputChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

// Define a client component that uses searchParams
function SearchParamsHandler({
  onSuccess,
}: {
  onSuccess: (success: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams && searchParams.get("success") === "true") {
      onSuccess(true);
    }
  }, [searchParams, onSuccess]);

  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStats, setCurrentStats] = useState<StatsData>(initialStats);
  const [animatedStats, setAnimatedStats] = useState<StatsData>(initialStats);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isHoveredCards, setIsHoveredCards] = useState<number | null>(null);
  const animatingRef = useRef(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
    // Update to random stats only after hydration
    setCurrentStats(getRandomStats());
  }, []);

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((loggedInUser) => {
        if (loggedInUser) {
          setUser(loggedInUser);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Update stats periodically with small variations (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    const interval = setInterval(() => {
      setCurrentStats(getRandomStats());
    }, 10000);

    return () => clearInterval(interval);
  }, [isHydrated]);

  // Animate counting effect when stats change
  useEffect(() => {
    if (!currentStats || animatingRef.current) return;

    animatingRef.current = true;

    // Reset animated stats if large change
    if (Math.abs(animatedStats.totalRides - currentStats.totalRides) > 1000) {
      setAnimatedStats({
        activeUsers: 0,
        dailyRides: 0,
        totalRides: 0,
        avgRideTime: 0,
      });
    }

    const duration = 2000; // Animation duration in ms (increased for smoother effect)
    const startTime = Date.now();
    const startStats = { ...animatedStats };

    const animateStats = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic easing for smoother animation
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setAnimatedStats({
        activeUsers: Math.round(
          startStats.activeUsers +
            (currentStats.activeUsers - startStats.activeUsers) * eased
        ),
        dailyRides: Math.round(
          startStats.dailyRides +
            (currentStats.dailyRides - startStats.dailyRides) * eased
        ),
        totalRides: Math.round(
          startStats.totalRides +
            (currentStats.totalRides - startStats.totalRides) * eased
        ),
        avgRideTime: parseFloat(
          (
            startStats.avgRideTime +
            (currentStats.avgRideTime - startStats.avgRideTime) * eased
          ).toFixed(1)
        ),
      });

      if (progress < 1) {
        requestAnimationFrame(animateStats);
      } else {
        animatingRef.current = false;
      }
    };

    requestAnimationFrame(animateStats);
  }, [currentStats, animatedStats]);

  // Schedule data with consistent styling
  const scheduleData = [
    { day: "Mon - Thu", hours: "7:30 AM - 2:30 AM" },
    { day: "Friday", hours: "7:30 AM - 3:00 AM" },
    { day: "Saturday", hours: "10:00 AM - 3:00 AM" },
    { day: "Sunday", hours: "10:00 AM - 2:30 AM" },
    {
      day: "Safe Ride Hours",
      hours: "7:00 PM - 2:30 AM (Sun-Thu), 7:00 PM - 3:00 AM (Fri-Sat)",
    },
  ];

  // Handle Firebase Google Sign-In
  const handleSignIn = async () => {
    if (!auth || !googleProvider) return;

    try {
      setLoading(true);

      // Set additional scopes for better access
      googleProvider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);

      // Store user's email in a cookie for admin recognition
      if (result.user.email) {
        const userEmail = result.user.email.trim().toLowerCase();
        document.cookie = `user_email=${userEmail}; path=/; max-age=864000; SameSite=Lax`;
        document.cookie = `auth=true; path=/; max-age=864000; SameSite=Lax`;

        // Log for debugging
        console.log(`Signed in with email: ${userEmail}`);

        // Only give admin access to padutwum@bates.edu
        const isExactAdminEmail = userEmail === "padutwum@bates.edu";
        const isAdmin = isExactAdminEmail;

        console.log(`User is exact admin: ${isExactAdminEmail}`);
        console.log(`Final admin status: ${isAdmin}`);

        // Store admin status in cookie
        if (isAdmin) {
          document.cookie = `admin=true; path=/; max-age=864000; SameSite=Lax`;
          console.log("Admin cookie set successfully");
        }

        // Redirect based on admin status
        if (isAdmin) {
          console.log("Redirecting to admin dashboard");
          // Add a small delay to ensure cookies are set before redirect
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        } else {
          console.log("Redirecting to student dashboard");
          router.push("/student");
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      // Allow fallback login for development
      alert(
        "Login failed. For development, you'll be redirected to the student dashboard."
      );
      document.cookie = `auth=true; path=/; max-age=864000; SameSite=Lax`;
      document.cookie = `user_email=dev-student@example.com; path=/; max-age=864000; SameSite=Lax`;

      console.log("Using development fallback login");
      setTimeout(() => {
        router.push("/student");
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const [rideData, setRideData] = useState({
    student_name: "",
    pickup_location: "",
    destination: "",
    passengers: 1,
    notes: "",
    user_email: "",
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        setRideData((prev) => ({
          ...prev,
          student_name: currentUser.displayName || currentUser.email || "",
          user_email: currentUser.email || "",
        }));
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: InputChangeEvent) => {
    const { name, value } = e.target;
    setRideData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the same createRide function that admins use
      await createRide({
        ...rideData,
        status: "pending", // Always start as pending
      });

      // Redirect to my rides page
      router.push("/student/my-rides?success=true");
    } catch (error) {
      console.error("Error creating ride:", error);
      alert("Failed to request ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        loadRides(currentUser.email || "");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadRides = async (email: string) => {
    try {
      if (!email) {
        console.warn("No email provided to loadRides function");
        setRides([]);
        return;
      }

      console.log(`Fetching rides for user with email: ${email}`);

      // Make sure email is properly sanitized
      const sanitizedEmail = email.trim().toLowerCase();

      // Use the proper fetchRidesByEmail function which knows how to query by email
      // instead of directly querying a non-existent user_email column
      const ridesData = await fetchRidesByEmail(sanitizedEmail);

      console.log(
        `Successfully fetched ${ridesData?.length || 0} rides for ${email}`
      );
      setRides(ridesData || []);
    } catch (error) {
      console.error("Exception in loadRides:", error);
      console.log("Providing empty rides array due to exception");
      setRides([]);
    }
  };

  // Set up real-time subscription for this student's rides
  useEffect(() => {
    if (!user?.email) return;

    const email = user.email.trim().toLowerCase();
    console.log(`Setting up subscription for rides with email: ${email}`);

    try {
      // Use the proper subscription function that knows how to filter by email in special_instructions
      const subscription = subscribeToRidesByEmail(email, (updatedRides) => {
        console.log(
          `Received real-time update with ${updatedRides.length} rides for ${email}`
        );
        setRides(updatedRides);
      });

      console.log(`Subscription active for ${email}'s rides`);

      return () => {
        console.log(`Unsubscribing from ${email}'s rides`);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      // No need to throw, just log the error and continue
      return () => {}; // Empty cleanup function
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">
            Pending
          </span>
        );
      case "active":
        return (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
            Active
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-black text-white">
      {/* Wrap searchParams usage in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSuccess={(success) => setShowSuccessMessage(success)}
        />
      </Suspense>

      {/* Header with glass morphism effect */}
      <header className="bg-batesDark shadow-xl sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          {/* Bates College Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/bateslogo.png"
              alt="Bates College Logo"
              width={150}
              height={50}
              priority
              className="drop-shadow-lg"
              sizes="(max-width: 768px) 100vw, 150px"
            />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="https://www.bates.edu/campus-safety/"
              className="font-semibold text-lg text-gray-300 hover:text-white transition-all duration-300 relative group"
              aria-label="About Campus Safety"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-batesMaroon transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/bobcat-express-2/"
              className="font-semibold text-lg text-gray-300 hover:text-white transition-all duration-300 relative group"
              aria-label="Our Services"
            >
              Services
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-batesMaroon transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="https://www.bates.edu/campus-safety/emergency-preparedness/emergency-phone-numbers/"
              className="font-semibold text-lg text-gray-300 hover:text-white transition-all duration-300 relative group"
              aria-label="Contact Information"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-batesMaroon transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Mobile menu button - can be expanded later */}
          <button
            className="md:hidden text-white text-xl p-2 rounded-lg hover:bg-batesMaroon/20 transition-colors"
            aria-label="Menu"
          >
            <span>☰</span>
          </button>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section - Mobile First Professional Design */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black/50 to-black"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 container mx-auto px-6 py-20 text-center max-w-4xl">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-black mb-6 text-white leading-tight">
                <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                  Bobcat Express
                </span>
                <br />
                <span className="text-3xl md:text-4xl font-light text-gray-300">
                  Shuttle Service
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                The Bobcat Express operates Monday–Sunday as a free, scheduled
                shuttle service for Bates students between campus and downtown
                Lewiston/Auburn, with frequent departures from the Chu Parking
                Lot.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                disabled={loading}
                className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-full shadow-2xl transition-all duration-300 hover:shadow-red-500/25 hover:from-red-500 hover:to-red-600 disabled:opacity-50 min-w-[200px]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaGoogle className="mr-3 text-lg" />
                    Get Started
                  </div>
                )}
              </motion.button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Mon - Sun
                </div>
                <div className="text-sm text-gray-400">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Safe
                </div>
                <div className="text-sm text-gray-400">& Reliable</div>
              </div>
              <div className="text-center col-span-2 md:col-span-1">
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Free
                </div>
                <div className="text-sm text-gray-400">For Students</div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Free Campus Shuttle to Lewiston/Auburn for All Students
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <motion.div
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <FaMapMarkedAlt className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Medical Transport
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Students with mobility or accessibility needs can schedule
                  rides in advance on the Accessible Support Shuttle for classes
                  or approved off-campus appointments.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <FaRoute className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Community-Engaged Learning Shuttles (CELS)
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  The Community Engaged Learning Shuttle (CELS) links Bates
                  students with Lewiston and Auburn sites for service learning
                  sponsored community service programs.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6">
                  <FaShieldAlt className="text-2xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Safe Ride
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Available nightly (6 pm–2 am on weekdays, 10 am–2 am on
                  weekends), Safe Ride offers a free shuttle for up to two
                  students worried about walking alone, transporting them to and
                  from campus or nearby off-campus housing.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Hours Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Service Hours
                </h2>
                <p className="text-xl text-gray-600">
                  Always here when you need us
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Regular Schedule
                    </h3>
                    <div className="space-y-4">
                      {scheduleData.slice(0, 4).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <span className="font-semibold text-gray-900">
                            {item.day}
                          </span>
                          <span className="text-gray-600">{item.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      Contact Info
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                          <FaPhoneAlt className="text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Shuttle Dispatch
                          </div>
                          <div className="text-gray-600">(207) 786-6254</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                          <FaPhoneAlt className="text-red-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Emergency
                          </div>
                          <div className="text-gray-600">(207) 786-6111</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ride Request Form Section - Only for authenticated users */}
        {user && !document.cookie.includes("admin=true") && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6 max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Request a Ride
                </h2>
                <p className="text-xl text-gray-600">
                  Quick and easy ride booking
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={rideData.student_name}
                        onChange={(e) =>
                          setRideData({
                            ...rideData,
                            student_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Passengers
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={rideData.passengers}
                        onChange={(e) =>
                          setRideData({
                            ...rideData,
                            passengers: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Pickup Location
                      </label>
                      <select
                        value={rideData.pickup_location}
                        onChange={(e) =>
                          setRideData({
                            ...rideData,
                            pickup_location: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select pickup location</option>
                        {shuttleLocations.map((location) => (
                          <option key={location.id} value={location.name}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Destination
                      </label>
                      <select
                        value={rideData.destination}
                        onChange={(e) =>
                          setRideData({
                            ...rideData,
                            destination: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select destination</option>
                        {shuttleLocations.map((location) => (
                          <option key={location.id} value={location.name}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={rideData.notes || ""}
                      onChange={(e) =>
                        setRideData({ ...rideData, notes: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-24 resize-none"
                      placeholder="Any special instructions..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                        Requesting Ride...
                      </div>
                    ) : (
                      "Request Ride"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Call to Action Section */}
        <section className="py-20 bg-gradient-to-r from-gray-900 to-black">
          <div className="container mx-auto px-6 text-center">
            <p className="text-xl text-gray-300 mb-8">
              Login to request a ride
            </p>

            {!user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-full shadow-xl hover:shadow-red-500/25 hover:from-red-500 hover:to-red-600 transition-all duration-300"
              >
                <FaGoogle className="inline mr-3" />
                Sign In Now
              </motion.button>
            )}

            {user && (
              <Link
                href="/student"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-full shadow-xl hover:shadow-red-500/25 hover:from-red-500 hover:to-red-600 transition-all duration-300"
              >
                Go to Dashboard
                <FaArrowRight className="ml-3" />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src="/bateslogo.png"
                  alt="Bates College Logo"
                  width={120}
                  height={40}
                  className="brightness-0 invert"
                />
              </div>
              <div className="text-red-400 font-semibold mb-4">
                (207) 786-6254
              </div>
              <address className="not-italic text-gray-400 space-y-1">
                <p>2 Andrews Road</p>
                <p>Lewiston, Maine 04240</p>
                <p>Phone: 1-207-786-6255</p>
                <p className="text-red-400 font-semibold mt-2">
                  Emergency: (207) 786-6111
                </p>
              </address>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/"
                    className="hover:text-white transition-colors"
                  >
                    Campus Safety
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/"
                    className="hover:text-white transition-colors"
                  >
                    Services
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>
              © {new Date().getFullYear()} Bates College Bobcat Express. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
