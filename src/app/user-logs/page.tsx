"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Firebase setup
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTachometerAlt,
  FaCar,
  FaClipboardList,
  FaMapMarkedAlt,
  FaChartBar,
  FaComments,
  FaSignOutAlt,
  FaTimes,
  FaBars,
  FaUser,
  FaFilter,
  FaSearch,
  FaSort,
  FaDownload,
} from "react-icons/fa";

// Define the types for Ride and Student
interface Ride {
  origin: string;
  destination: string;
  date: Date;
}

interface Student {
  id: string;
  name: string;
  email: string;
  year: string;
  major: string;
  totalRides: number;
  lastRide: Date;
  image: string | null;
  recentRides?: Ride[];
}

// Mock student data since we don't have actual student profiles
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Emma Johnson",
    email: "ejohnso2@bates.edu",
    year: "2024",
    major: "Psychology",
    totalRides: 15,
    lastRide: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    image: null,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "mchen@bates.edu",
    year: "2025",
    major: "Economics",
    totalRides: 8,
    lastRide: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    image: null,
  },
  {
    id: "3",
    name: "Sophia Williams",
    email: "swillia3@bates.edu",
    year: "2023",
    major: "Environmental Science",
    totalRides: 22,
    lastRide: new Date(Date.now() - 12 * 60 * 60 * 1000),
    image: null,
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "jrodrig@bates.edu",
    year: "2026",
    major: "Political Science",
    totalRides: 5,
    lastRide: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    image: null,
  },
  {
    id: "5",
    name: "Aisha Patel",
    email: "apatel@bates.edu",
    year: "2024",
    major: "Neuroscience",
    totalRides: 18,
    lastRide: new Date(Date.now() - 8 * 60 * 60 * 1000),
    image: null,
  },
];

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  {
    href: "/ride-management",
    label: "Ride Management",
    icon: <FaClipboardList />,
  },
  { href: "/driver-status", label: "Driver Status", icon: <FaCar /> },
  {
    href: "/shuttle-tracker",
    label: "Shuttle Tracker",
    icon: <FaMapMarkedAlt />,
  },
  { href: "/analytics", label: "Analytics", icon: <FaChartBar /> },
  { href: "/chat-center", label: "Chat Center", icon: <FaComments /> },
  { href: "/user-logs", label: "Student Profiles", icon: <FaUser /> },
];

export default function UserLogs() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rides");
  const [sortOrder, setSortOrder] = useState("desc");
  const [user, setUser] = useState({
    name: "Admin User",
    email: "admin@bates.edu",
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);

      // In a real app, we'd fetch student data from Firebase
      // For now, use our mock data with some random ride history
      const updatedStudents: Student[] = mockStudents.map((student) => ({
        ...student,
        recentRides: [
          {
            origin: "Commons",
            destination: "Walmart",
            date: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ),
          },
          {
            origin: "Library",
            destination: "Campus",
            date: new Date(
              Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000
            ),
          },
        ],
      }));

      setStudents(updatedStudents);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMajor =
        majorFilter === "all" || student.major === majorFilter;

      return matchesSearch && matchesMajor;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "rides") {
        return sortOrder === "asc"
          ? a.totalRides - b.totalRides
          : b.totalRides - a.totalRides;
      } else {
        // lastRide
        return sortOrder === "asc"
          ? a.lastRide.getTime() - b.lastRide.getTime()
          : b.lastRide.getTime() - a.lastRide.getTime();
      }
    });

  const handleSignOut = async () => {
    // Navigate to home page
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[var(--batesBackground)]">
      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-[var(--batesBlue)] shadow-lg`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex justify-center items-center h-20 border-b border-[var(--batesBorder)]">
            <Link href="/dashboard">
              <Image
                src="/bateslogo.png"
                alt="Bates College Logo"
                width={120}
                height={40}
                priority
                onError={(e) => {
                  e.currentTarget.src =
                    "https://www.bates.edu/wordpress/files/2016/07/Bates-Logo-1.jpg";
                }}
              />
            </Link>
          </div>

          {/* User Profile */}
          <div className="px-6 py-4 border-b border-[var(--batesBorder)]">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-[var(--batesBlueLight)] transition-colors ${
                      link.href === "/user-logs"
                        ? "bg-[var(--batesBlueLight)]"
                        : ""
                    }`}
                  >
                    <span className="mr-3 text-gray-400">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-[var(--batesBorder)]">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-4 py-2 text-white bg-batesMaroon hover:bg-batesMaroon/80 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[var(--batesCard)] border-b border-[var(--batesBorder)] shadow-sm h-16 flex items-center justify-between px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <h1 className="text-xl font-bold text-white">
            Student Ride Profiles
          </h1>
          <div>
            <button className="flex items-center text-white bg-batesMaroon hover:bg-batesMaroon/80 px-3 py-1.5 rounded">
              <FaDownload className="mr-2" />
              <span>Export Data</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-16 h-16 border-t-4 border-batesMaroon border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-white">Loading student profiles...</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search & Filter Controls */}
                <div className="bg-[var(--batesCard)] p-4 rounded-lg shadow mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaSearch className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-[var(--batesBlue)] text-white border border-[var(--batesBorder)] focus:outline-none focus:ring-2 focus:ring-batesMaroon"
                      />
                    </div>

                    {/* Major Filter */}
                    <div className="relative w-full md:w-48">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaFilter className="text-gray-400" />
                      </div>
                      <select
                        value={majorFilter}
                        onChange={(e) => setMajorFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-md bg-[var(--batesBlue)] text-white border border-[var(--batesBorder)] focus:outline-none focus:ring-2 focus:ring-batesMaroon"
                      >
                        <option value="all">All Majors</option>
                        <option value="Psychology">Psychology</option>
                        <option value="Economics">Economics</option>
                        <option value="Environmental Science">
                          Environmental Science
                        </option>
                        <option value="Political Science">
                          Political Science
                        </option>
                        <option value="Neuroscience">Neuroscience</option>
                      </select>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSortBy("rides");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                        className={`px-3 py-2 rounded-md text-white border border-[var(--batesBorder)] ${
                          sortBy === "rides"
                            ? "bg-batesMaroon"
                            : "bg-[var(--batesBlue)]"
                        }`}
                      >
                        <div className="flex items-center">
                          <span>Rides</span>
                          {sortBy === "rides" && <FaSort className="ml-2" />}
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSortBy("name");
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        }}
                        className={`px-3 py-2 rounded-md text-white border border-[var(--batesBorder)] ${
                          sortBy === "name"
                            ? "bg-batesMaroon"
                            : "bg-[var(--batesBlue)]"
                        }`}
                      >
                        <div className="flex items-center">
                          <span>Name</span>
                          {sortBy === "name" && <FaSort className="ml-2" />}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Student Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-[var(--batesCard)] rounded-lg shadow-lg overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="h-14 w-14 rounded-full bg-batesMaroon/40 flex items-center justify-center text-white text-xl font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {student.name}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {student.email}
                            </p>
                            <div className="mt-1 flex space-x-3 text-xs">
                              <span className="bg-[var(--batesBlue)] px-2 py-1 rounded text-white">
                                Class of {student.year}
                              </span>
                              <span className="bg-[var(--batesBlue)] px-2 py-1 rounded text-white">
                                {student.major}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-[var(--batesBorder)] pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Rides:</span>
                            <span className="text-batesMaroon font-bold text-lg">
                              {student.totalRides}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-400">Last Ride:</span>
                            <span className="text-white">
                              {new Date(student.lastRide).toLocaleDateString()}
                            </span>
                          </div>

                          {student.recentRides && (
                            <div className="mt-4">
                              <h4 className="text-white text-sm font-semibold mb-2">
                                Recent Trips:
                              </h4>
                              <div className="space-y-2">
                                {student.recentRides.map(
                                  (ride: Ride, index: number) => (
                                    <div
                                      key={index}
                                      className="bg-[var(--batesBlue)] rounded p-2 text-xs"
                                    >
                                      <div className="flex justify-between text-gray-300">
                                        <span>
                                          {ride.origin} → {ride.destination}
                                        </span>
                                        <span>
                                          {new Date(
                                            ride.date
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredStudents.length === 0 && (
                  <div className="bg-[var(--batesCard)] rounded-lg p-8 text-center">
                    <p className="text-gray-400">
                      No students match your search criteria.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
