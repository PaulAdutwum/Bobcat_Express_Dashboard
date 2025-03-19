"use client";

import { useState } from "react";
import ChartComponent from "../components/ChartComponent";
import RideRequestForm from "../components/RidRequestForm";
import AnalyticsBarChart from "../components/AnalyticsBarChart";
import AnalyticsPieChart from "../components/AnalyticsPieChart";
import AnalyticsScatterPlot from "../components/AnalyticsScatterChart";
import ActiveTripsTable from "../components/ActiveTripsTable";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DriverSelectionCard from "../components/DriverSelection";
import {
  FaMapMarkerAlt,
  FaCar,
  FaUser,
  FaBars,
  FaArrowLeft,
  FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";

const links = [
  { label: "Dashboard", icon: FaCar, href: "/dashboard" },
  {
    label: "Shuttle Location",
    icon: FaMapMarkerAlt,
    href: "/shuttle-location",
  },
  { label: "User Logs", icon: FaUser, href: "/user-logs" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:relative bg-[#881124] text-white w-64 flex flex-col justify-between p-4 space-y-6 shadow-lg rounded-r-lg transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:block md:relative absolute inset-y-0 left-0`}
      >
     
        <div className="flex items-center justify-center space-x-2">
          <Image
            src="/bateslogow.png"
            width={120}
            height={50}
            priority
            className="drop-shadow-lg"
            alt="Bates College"
          />
        </div>

        {/* Close Button for Sidebar (Mobile) */}
        <div className="md:hidden absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white bg-gray-600 p-2 rounded-full hover:bg-gray-400 transition"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

       
        <nav className="flex flex-col space-y-3">
          {links.map(({ label, icon: Icon, href }, index) => (
            <Link
              key={index}
              href={href}
              className={`flex items-center space-x-3 p-3 rounded-md transition duration-300 ${
                pathname === href
                  ? "bg-white text-[#881124]"
                  : "hover:bg-white hover:text-[#881124]"
              }`}
            >
              <Icon className="text-lg" />
              <span className="font-semibold">{label}</span>
            </Link>
          ))}
        </nav>

        
        <Link
          href="/"
          className="flex items-center space-x-3 p-3 rounded-md transition duration-300 bg-gray-200 text-[#881124] hover:bg-white hover:text-[#881124] shadow-md"
        >
          <FaArrowLeft className="text-lg" />
          <span className="font-semibold">Back to Homepage</span>
        </Link>
      </aside>

      {/*  Main Dashboard Section */}
      <main className="flex-1">
        <div className="flex items-center justify-between md:justify-start relative ">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden absolute left-0 text-white bg-[#881124] p-2 rounded-lg shadow-lg hover:bg-[#a02234] transition"
          >
            <FaBars className="text-2xl" />
          </button>

          <h1 className="text-3xl font-bold text-gray-900 transition-all duration-300 hover:text-[#881124] hover:scale-105 text-center w-full md:w-auto md:text-left">
            Bobcat Express Dashboard
          </h1>
        </div>

        {/*  Dashboard Grid Layout (Uniform, Balanced, and Professional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-7 mb-12">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-full rounded-lg shadow-lg transition duration-300 flex justify-center items-center mb-10"
          >
            <RideRequestForm />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-lg shadow-lg  transition duration-300 flex justify-center items-center mb-10"
          >
            <AnalyticsBarChart />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-full rounded-lg shadow-lg transition duration-300 flex justify-center items-center mb-10"
          >
            <ChartComponent />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-lg shadow-lg  transition duration-300 flex justify-center items-center"
          >
            <AnalyticsPieChart />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-lg shadow-lg transition duration-300 flex justify-center items-center"
          >
            <AnalyticsScatterPlot />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="rounded-lg shadow-lg  transition duration-300 flex justify-center items-center"
          >
            <DriverSelectionCard />
          </motion.div>
        </div>

        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className=" rounded-lg shadow-lg  transition duration-300 mt-6"
        >
          <ActiveTripsTable />
        </motion.div>

        {/*  Footer */}
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

           
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-2">
                {[
                  { label: "Community Engaged Learning Shuttle", href: "#" },
                  { label: "Accessible Support", href: "#" },
                  { label: "Medical Appointments", href: "#" },
                  { label: "L/A Express Shuttle", href: "#" },
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

          <div className="border-t border-gray-700 mt-6 pt-4 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Bobcat Express Shuttle. All rights
              reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
