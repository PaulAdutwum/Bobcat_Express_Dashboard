"use client";

import { useState, useEffect, useRef } from "react";
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

// Define Ride type locally to avoid import issues
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
}

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

    // Safely access search params after hydration
    if (searchParams && searchParams.get("success") === "true") {
      setShowSuccessMessage(true);
    }
  }, [searchParams]);

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
    { day: "Monday - Thursday", hours: "7:30 AM - 2:30 AM" },
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
        document.cookie = `user_email=${result.user.email}; path=/; max-age=864000; SameSite=Lax`;
        document.cookie = `auth=true; path=/; max-age=864000; SameSite=Lax`;

        // Log for debugging
        console.log(`Signed in with email: ${result.user.email}`);
        console.log(
          `Is admin check: ${result.user.email === "padutwum@bates.edu"}`
        );

        // For development: enable admin access for any @bates.edu email
        const isBatesEmail = result.user.email.endsWith("@bates.edu");
        const isAdmin =
          result.user.email === "padutwum@bates.edu" || isBatesEmail;

        // Store admin status in cookie
        if (isAdmin) {
          document.cookie = `admin=true; path=/; max-age=864000; SameSite=Lax`;
        }

        // Redirect based on development mode or email
        if (isAdmin) {
          console.log("Redirecting to admin dashboard");
      router.push("/dashboard");
        } else {
          console.log("Redirecting to student dashboard");
          router.push("/student");
        }
      }
    } catch (error) {
      console.error("Login Error:", error);
      // Allow fallback login for development
      alert(
        "Login failed. For development, you'll be redirected to the dashboard anyway."
      );
      document.cookie = `auth=true; path=/; max-age=864000; SameSite=Lax`;
      document.cookie = `admin=true; path=/; max-age=864000; SameSite=Lax`;
      router.push("/dashboard");
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

      // Make sure email is properly encoded for the query
      const sanitizedEmail = email.trim().toLowerCase();

      // Direct Supabase query with improved error handling
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("user_email", sanitizedEmail)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rides by email:", error);
        // For development purposes, log the full error object
        console.log("Full error object:", JSON.stringify(error));
        setRides([]);
      } else {
        console.log(
          `Successfully fetched ${data?.length || 0} rides for ${email}`
        );
        setRides(data || []);
      }
    } catch (error) {
      console.error("Exception in loadRides:", error);
      // For development purposes, return mock data if needed
      console.log("Providing empty rides array due to exception");
      setRides([]);
    }
  };

  // Set up real-time subscription for this student's rides
  useEffect(() => {
    if (!user?.email) return;

    const email = user.email.trim().toLowerCase();
    console.log(`Setting up subscription for rides with email: ${email}`);

    // Create a unique channel name based on the email (avoid special characters)
    const channelName = `rides-by-email-${email.replace(/[^a-zA-Z0-9]/g, "-")}`;

    try {
      // Set up subscription directly with Supabase with improved filter syntax
      const subscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rides",
            filter: `user_email=eq.${email}`,
          },
          async (payload) => {
            console.log(
              `Received real-time update for ${email}'s rides:`,
              payload
            );
            // When changes occur, reload the rides - prevent errors by checking if component is still mounted
            if (user?.email) {
              await loadRides(email);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${channelName}: ${status}`);
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
        {/* Hero Section with Improved Gradient and Animation */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Particle elements for floating effect */}
            <div className="absolute right-[15%] top-[30%] w-24 h-24 rounded-full bg-[var(--primaryColor)] opacity-10 animate-float1"></div>
            <div className="absolute left-[10%] top-[40%] w-32 h-32 rounded-full bg-[var(--accentColor1)] opacity-5 animate-float2"></div>
            <div className="absolute right-[30%] bottom-[20%] w-40 h-40 rounded-full bg-[var(--accentColor4)] opacity-10 animate-float3"></div>

            {/* Enhanced radial gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-[rgba(15,21,33,0.2)] via-[rgba(15,21,33,0.8)] to-[var(--background)] z-10"></div>
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col lg:flex-row items-center justify-between relative z-20">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight transition-transform duration-300 hover:scale-[1.02]">
                <span className="text-[var(--batesMaroon)] hover:text-white hover:bg-[var(--batesMaroon)] transition-colors duration-300 px-1 rounded">
                  Bates Bobcat Express
                </span>
                <br />
                On-Demand Shuttle Service
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
                Safe, reliable transportation around campus and to nearby
                locations for Bates College students, faculty, and staff.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleSignIn}
                  className="bg-batesMaroon text-white py-3 px-6 rounded-md font-medium hover:bg-red-800 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2"></span>
                  ) : (
                    <FaGoogle className="mr-2" />
                  )}
                  Sign in with Google
                </motion.button>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative">
                {/* Enhanced shuttle image gradient */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-[rgba(15,21,33,0.3)] to-[var(--background)] z-10 rounded-3xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-tr from-[var(--batesBlue)]/50 via-transparent to-[var(--batesMaroon)]/50 opacity-40 blur-xl rounded-3xl"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-br from-[var(--batesMaroon)]/20 to-[var(--batesBlue)]/20 opacity-70 rounded-3xl"></div>

                {/* Single shuttle image instead of carousel */}
                <Image
                  src="/shuttle.png"
                  alt="Bates Shuttle"
                  width={600}
                  height={400}
                  className="rounded-3xl shadow-xl object-cover transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl relative z-20"
                  priority
                  onError={(e) => {
                    // Fallback if image doesn't load
                    const target = e.target as HTMLImageElement;
                    target.src = "/shuttle2.png";
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Statistics */}
        <section className="bg-[var(--batesBlue)] py-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stats-card group hover:border-[var(--accentColor1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:translate-y-[-5px] transition-all duration-300 hover:bg-[rgba(59,130,246,0.03)]">
                <div>
                  <h3 className="stats-card-title group-hover:text-[var(--accentColor1)] transition-colors">
                    Active Users
                  </h3>
                  <p className="stats-card-value">
                    {isHydrated
                      ? animatedStats.activeUsers
                      : currentStats.activeUsers}
                  </p>
                </div>
                <div className="stats-card-icon bg-[rgba(59,130,246,0.2)] text-[var(--accentColor1)] group-hover:bg-[var(--accentColor1)] group-hover:text-white group-hover:rotate-3 group-hover:scale-110 transition-all duration-300">
                  <FaUsers size={24} />
                </div>
              </div>

              <div className="stats-card group hover:border-[var(--accentColor2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:translate-y-[-5px] transition-all duration-300 hover:bg-[rgba(16,185,129,0.03)]">
                <div>
                  <h3 className="stats-card-title group-hover:text-[var(--accentColor2)] transition-colors">
                    Daily Rides
                  </h3>
                  <p className="stats-card-value">
                    {isHydrated
                      ? animatedStats.dailyRides
                      : currentStats.dailyRides}
                  </p>
                </div>
                <div className="stats-card-icon bg-[rgba(16,185,129,0.2)] text-[var(--accentColor2)] group-hover:bg-[var(--accentColor2)] group-hover:text-white group-hover:rotate-3 group-hover:scale-110 transition-all duration-300">
                  <FaRoute size={24} />
                </div>
              </div>

              <div className="stats-card group hover:border-[var(--accentColor3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:translate-y-[-5px] transition-all duration-300 hover:bg-[rgba(245,158,11,0.03)]">
                <div>
                  <h3 className="stats-card-title group-hover:text-[var(--accentColor3)] transition-colors">
                    Total Rides
                  </h3>
                  <p className="stats-card-value">
                    {isHydrated
                      ? animatedStats.totalRides
                      : currentStats.totalRides}
                  </p>
                </div>
                <div className="stats-card-icon bg-[rgba(245,158,11,0.2)] text-[var(--accentColor3)] group-hover:bg-[var(--accentColor3)] group-hover:text-white group-hover:rotate-3 group-hover:scale-110 transition-all duration-300">
                  <FaBusAlt size={24} />
                </div>
              </div>

              <div className="stats-card group hover:border-[var(--accentColor4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:translate-y-[-5px] transition-all duration-300 hover:bg-[rgba(139,92,246,0.03)]">
                <div>
                  <h3 className="stats-card-title group-hover:text-[var(--accentColor4)] transition-colors">
                    Avg. Ride Time
                  </h3>
                  <p className="stats-card-value">
                    {isHydrated
                      ? animatedStats.avgRideTime
                      : currentStats.avgRideTime}{" "}
                    min
                  </p>
                </div>
                <div className="stats-card-icon bg-[rgba(139,92,246,0.2)] text-[var(--accentColor4)] group-hover:bg-[var(--accentColor4)] group-hover:text-white group-hover:rotate-3 group-hover:scale-110 transition-all duration-300">
                  <FaClock size={24} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Information */}
        <section className="py-16 bg-[var(--background)]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-white transition-all duration-300 hover:text-[var(--batesMaroon)] hover:scale-[1.02] hover:tracking-wide">
              Our Services
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="dark-card hover:border-[var(--accentColor1)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-2 hover:bg-[rgba(59,130,246,0.03)]">
                <div className="text-[var(--accentColor1)] mb-4 text-3xl transition-transform duration-300 group-hover:scale-110">
                  <FaMapMarkedAlt />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white transition-colors duration-300 hover:text-[var(--accentColor1)]">
                  Campus Transportation
                </h3>
                <p className="text-gray-300">
                  Get rides to and from any location on campus, including dorms,
                  academic buildings, and athletic facilities.
                </p>
              </div>

              <div className="dark-card hover:border-[var(--accentColor2)] transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-2 hover:bg-[rgba(16,185,129,0.03)]">
                <div className="text-[var(--accentColor2)] mb-4 text-3xl transition-transform duration-300 group-hover:scale-110">
                  <FaRoute />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white transition-colors duration-300 hover:text-[var(--accentColor2)]">
                  Local Destinations
                </h3>
                <p className="text-gray-300">
                  Rides to nearby off-campus locations including downtown
                  Lewiston, shopping centers, and medical facilities.
                </p>
              </div>

              <div className="dark-card hover:border-[var(--accentColor3)] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:-translate-y-2 hover:bg-[rgba(245,158,11,0.03)]">
                <div className="text-[var(--accentColor3)] mb-4 text-3xl transition-transform duration-300 group-hover:scale-110">
                  <FaShieldAlt />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white transition-colors duration-300 hover:text-[var(--accentColor3)]">
                  Safe Ride Program
                </h3>
                <p className="text-gray-300">
                  Late-night transportation service to ensure safety for
                  students traveling across campus during evening hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className="py-16 bg-[var(--batesBlue)]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6 text-white">
                  Operating Hours
                </h2>
                <p className="mb-8 text-gray-300">
                  The Bates Bobcat Express operates on different schedules
                  throughout the week to accommodate student needs. Service
                  hours may be extended during special events and finals period.
                </p>

                <div className="space-y-4">
                  {scheduleData.map((item, index) => (
                    <div
                      key={index}
                      className="flex bg-[var(--batesCard)] p-4 rounded-lg border border-[var(--batesBorder)] transition-all hover:border-[var(--batesMaroon)] hover:shadow-md hover:translate-y-[-2px]"
                    >
                      <div className="text-[var(--batesMaroon)] mr-4">
                        <FaCalendarAlt size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{item.day}</h4>
                        <p className="text-gray-300">{item.hours}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-[rgba(136,17,36,0.1)] rounded-lg border border-[rgba(136,17,36,0.2)]">
                    <p className="text-white text-sm">
                      <strong>Note:</strong> L/A Express offers off-campus
                      destinations. See the{" "}
                      <a
                        href="https://www.bates.edu/campus-safety/bobcat-express-2/"
                        className="text-[var(--batesMaroon)] hover:underline"
                      >
                        Bates Bobcat Express
                      </a>{" "}
                      webpage for the complete schedule and route information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-6 text-white">
                  Emergency Contact
                </h2>
                <div className="dark-card">
                  <h3 className="text-xl font-bold mb-4 text-white">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="text-[var(--batesMaroon)] mr-4 mt-1">
                        <FaPhoneAlt />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          Shuttle Dispatch
                        </h4>
                        <p className="text-gray-300">(207) 786-6254</p>
                        <p className="text-sm text-gray-400 mt-1">
                          For regular ride requests and information
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="text-[var(--batesMaroon)] mr-4 mt-1">
                        <FaPhoneAlt />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          Campus Safety
                        </h4>
                        <p className="text-gray-300">(207) 786-6111</p>
                        <p className="text-sm text-gray-400 mt-1">
                          For emergencies and after-hours assistance
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-[rgba(136,17,36,0.1)] rounded-lg border border-[rgba(136,17,36,0.2)]">
                    <p className="text-gray-300">
                      <strong className="text-white">Important:</strong> In case
                      of emergency, please call Campus Safety directly for
                      immediate assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ride Request Form Section */}
        {user && !document.cookie.includes("admin=true") && (
          <div className="mt-16 mb-24 max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-white tracking-wide mb-6 text-center">
              Request a Ride
            </h2>
            <div className="bg-[var(--batesCardBg)] shadow-xl rounded-xl p-6 border border-[var(--batesBorder)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="student_name" className="form-label">
                      Full Name
                    </label>
                    <input
                      id="student_name"
                      type="text"
                      value={rideData.student_name}
                      onChange={(e) =>
                        setRideData({
                          ...rideData,
                          student_name: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="passengers" className="form-label">
                      Number of Passengers
                    </label>
                    <input
                      id="passengers"
                      type="number"
                      min="1"
                      max="4"
                      value={rideData.passengers}
                      onChange={(e) =>
                        setRideData({
                          ...rideData,
                          passengers: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pickup_location" className="form-label">
                      Pickup Location
                    </label>
                    <select
                      id="pickup_location"
                      value={rideData.pickup_location}
                      onChange={(e) =>
                        setRideData({
                          ...rideData,
                          pickup_location: e.target.value,
                        })
                      }
                      className="form-input"
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
                    <label htmlFor="destination" className="form-label">
                      Destination
                    </label>
                    <select
                      id="destination"
                      value={rideData.destination}
                      onChange={(e) =>
                        setRideData({
                          ...rideData,
                          destination: e.target.value,
                        })
                      }
                      className="form-input"
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
                  <label htmlFor="notes" className="form-label">
                    Additional Notes{" "}
                    <span className="text-gray-400 text-sm">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={rideData.notes || ""}
                    onChange={(e) =>
                      setRideData({ ...rideData, notes: e.target.value })
                    }
                    className="form-input h-24"
                    placeholder="Any special instructions or information"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-lg font-medium text-white bg-gradient-to-r from-[var(--batesMaroon)] to-[#a01b1b] hover:from-[#a01b1b] hover:to-[var(--batesMaroon)] transition-all duration-300 flex justify-center items-center"
                    >
                      {loading ? (
                      <>
                        <span className="mr-2 animate-spin">
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </span>
                        Requesting Ride...
                      </>
                    ) : (
                      <>Request Ride</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-br from-[var(--batesBlue)] to-black">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Get Started?
            </h2>
            {!user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-batesMaroon hover:bg-red-800 text-white px-8 py-4 rounded-lg font-semibold shadow-xl inline-flex items-center gap-2 transition-all duration-300"
                onClick={handleSignIn}
              >
                <FaSignInAlt /> Sign In Now
              </motion.button>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="bg-batesMaroon hover:bg-red-800 text-white px-8 py-4 rounded-lg font-semibold shadow-xl inline-flex items-center gap-2 transition-all duration-300"
              >
                Go to Dashboard <FaArrowRight />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--batesCard)] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Image
                src="/bateslogo.png"
                alt="Bates College Logo"
                width={150}
                height={50}
                className="mb-4"
                sizes="(max-width: 768px) 100vw, 150px"
              />
              <p className="text-gray-400 text-sm">
                Providing safe and reliable transportation for the Bates College
                community.
              </p>
              <p className="text-batesMaroon font-semibold text-sm mt-2">
                Bobcat Express Phone: (207) 786-8300
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Shuttle Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/#accessible-support-shuttle"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Accessible Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/#community-engaged-learning-shuttles-cels"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Community Engaged Learning
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/#medical-appointments-schedule-in-advance"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Medical Appointments
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.bates.edu/campus-safety/bobcat-express-2/#safe-ride-shuttle"
                    className="hover:text-batesMaroon transition-colors"
                  >
                    Safe Ride & L/A Express
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <address className="not-italic text-gray-400">
                <p>Bates College</p>
                <p>2 Andrews Road</p>
                <p>Lewiston, ME 04240</p>
                <p className="mt-2">Phone: (207) 786-6254</p>
                <p>Emergency: (207) 786-6111</p>
              </address>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
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
