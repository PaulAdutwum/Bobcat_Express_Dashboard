"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaMapMarkerAlt,
  FaBars,
  FaArrowLeft,
  FaTimes,
  FaChartLine,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaUser,
  FaChartBar,
  FaUserTie,
  FaShuttleVan,
  FaComments,
  FaPaperPlane,
  FaCircle,
  FaSearch,
  FaEllipsisV,
  FaPhone,
  FaVideo,
  FaSmile,
  FaPaperclip,
  FaMicrophone,
  FaUsers,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import { User } from "firebase/auth";

const links = [
  { label: "Dashboard", icon: FaChartLine, href: "/dashboard" },
  { label: "Ride Management", icon: FaShuttleVan, href: "/ride-management" },
  {
    label: "Shuttle Location",
    icon: FaMapMarkerAlt,
    href: "/shuttle-location",
  },
  { label: "Chat Center", icon: FaComments, href: "/chat-center" },
  { label: "Driver Status", icon: FaUserTie, href: "/driver-status" },
  { label: "Analytics", icon: FaChartBar, href: "/analytics" },
  { label: "User Logs", icon: FaUser, href: "/user-logs" },
];

// Mock data for chat users
const mockUsers = [
  {
    id: "1",
    name: "Sarah Johnson",
    lastMessage: "When is the next shuttle to Walmart?",
    time: "10:45 AM",
    unread: 2,
    online: true,
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: "2",
    name: "Mike Thompson",
    lastMessage: "Thanks for the quick pickup!",
    time: "9:30 AM",
    unread: 0,
    online: true,
    avatar: "https://randomuser.me/api/portraits/men/42.jpg",
  },
  {
    id: "3",
    name: "Emma Wilson",
    lastMessage: "Can I schedule a ride for tomorrow?",
    time: "Yesterday",
    unread: 1,
    online: false,
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
  },
  {
    id: "4",
    name: "Jack Davis",
    lastMessage: "Where is the shuttle now?",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "5",
    name: "Lily Chen",
    lastMessage: "Do you have space for 3 people?",
    time: "Yesterday",
    unread: 0,
    online: true,
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];

// Mock messages for chat
const mockMessages = [
  {
    id: "1",
    sender: "user",
    text: "Hi there! When is the next shuttle to Walmart?",
    time: "10:30 AM",
  },
  {
    id: "2",
    sender: "admin",
    text: "Good morning! The next shuttle to Walmart leaves in 15 minutes from Commons.",
    time: "10:35 AM",
  },
  {
    id: "3",
    sender: "user",
    text: "Perfect! Will there be another one later today?",
    time: "10:36 AM",
  },
  {
    id: "4",
    sender: "admin",
    text: "Yes, we have shuttles running to Walmart at 2:00 PM and 5:30 PM as well.",
    time: "10:38 AM",
  },
  {
    id: "5",
    sender: "user",
    text: "Great, thank you for the information!",
    time: "10:40 AM",
  },
  {
    id: "6",
    sender: "admin",
    text: "You're welcome! Let us know if you need anything else.",
    time: "10:42 AM",
  },
  {
    id: "7",
    sender: "user",
    text: "Actually, is there space for 3 people on the next shuttle?",
    time: "10:45 AM",
  },
];

export default function ChatCenter() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter users based on search query
  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auth listener
  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMsg = {
      id: (messages.length + 1).toString(),
      sender: "admin",
      text: newMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar Navigation */}
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
                    pathname === href
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
        <div className="bg-[var(--batesCard)] shadow-md px-4 sm:px-5 py-3 sm:py-4 sticky top-0 z-10 border-b border-[var(--batesBorder)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-white p-2 rounded-lg hover:bg-batesMaroon/20"
              >
                <FaBars className="text-xl" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Chat Center
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/chat-center"
                className="relative p-2 text-white rounded-full bg-batesMaroon transition-colors"
                aria-label="Chat Center"
              >
                <FaComments className="text-xl" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--batesCard)]"></span>
              </Link>
              <button className="relative p-2 text-gray-300 hover:text-batesMaroon rounded-full hover:bg-[var(--batesBlue)] transition-colors">
                <FaBell className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Users List - hidden on small screens, shown with button */}
          <div
            className={`w-80 bg-[var(--batesCard)] border-r border-[var(--batesBorder)] flex-col ${
              sidebarOpen
                ? "flex absolute md:relative z-30 h-full"
                : "hidden md:flex"
            }`}
          >
            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-[var(--batesBorder)]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full bg-[var(--batesBlue)] text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-batesMaroon"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.map((chatUser) => (
                <div
                  key={chatUser.id}
                  className={`flex items-center p-3 sm:p-4 border-b border-[var(--batesBorder)] hover:bg-[var(--batesBlue)] cursor-pointer transition-colors ${
                    selectedUser.id === chatUser.id
                      ? "bg-[var(--batesBlue)]"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(chatUser);
                    // Close sidebar on mobile after selecting user
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={chatUser.avatar}
                      alt={chatUser.name}
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover"
                    />
                    {chatUser.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--batesCard)]"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm sm:text-base text-white font-medium truncate">
                        {chatUser.name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {chatUser.time}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {chatUser.lastMessage}
                    </p>
                  </div>
                  {chatUser.unread > 0 && (
                    <div className="ml-2 bg-batesMaroon text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chatUser.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-[var(--batesCard)] bg-opacity-70">
            {/* Chat Header with Users List Toggle on Mobile */}
            <div className="p-3 sm:p-4 border-b border-[var(--batesBorder)] flex justify-between items-center">
              <div className="flex items-center">
                <button
                  className="md:hidden mr-2 text-gray-400 hover:text-white"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FaUsers className="text-lg" />
                </button>
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="text-sm sm:text-base text-white font-medium">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedUser.online ? (
                      <span className="flex items-center">
                        <FaCircle className="text-green-500 mr-1 text-xs" />
                        Online
                      </span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <button className="text-gray-400 hover:text-white p-2">
                  <FaPhone className="text-base sm:text-lg" />
                </button>
                <button className="text-gray-400 hover:text-white p-2 hidden sm:block">
                  <FaVideo className="text-base sm:text-lg" />
                </button>
                <button className="text-gray-400 hover:text-white p-2">
                  <FaEllipsisV className="text-base sm:text-lg" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-md rounded-lg px-3 sm:px-4 py-2 ${
                      msg.sender === "admin"
                        ? "bg-batesMaroon text-white rounded-br-none"
                        : "bg-[var(--batesBlue)] text-white rounded-bl-none"
                    }`}
                  >
                    <p className="mb-1 text-sm sm:text-base break-words">
                      {msg.text}
                    </p>
                    <p className="text-xs text-gray-300 text-right">
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-[var(--batesBorder)]">
              <div className="flex items-center bg-[var(--batesBlue)] rounded-lg px-2 sm:px-3 py-2">
                <button className="text-gray-400 hover:text-white mr-2 hidden sm:block">
                  <FaSmile />
                </button>
                <button className="text-gray-400 hover:text-white mr-2">
                  <FaPaperclip />
                </button>
                <textarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white resize-none max-h-20 text-sm sm:text-base"
                  placeholder="Type a message..."
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button className="text-gray-400 hover:text-white ml-2 hidden sm:block">
                  <FaMicrophone />
                </button>
                <button
                  className="ml-2 bg-batesMaroon text-white rounded-full p-2 hover:bg-batesMaroon/80 transition-colors"
                  onClick={handleSendMessage}
                >
                  <FaPaperPlane className="text-sm sm:text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
