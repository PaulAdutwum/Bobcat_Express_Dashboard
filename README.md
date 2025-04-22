# 🚌 Bobcat Express Shuttle — Bates College

A full-featured, real-time shuttle management system designed for the Bates College community. This platform connects students, faculty, and staff with on-demand transportation services around campus and nearby cities, offering seamless booking, tracking, and administration tools.

![Bobcat Express Banner](public/banner.png) <!-- Optional if you have a banner image -->

---

## 🚀 Overview

Bobcat Express provides:

- Real-time shuttle tracking
- Ride booking for students
- Administrative ride oversight
- Driver trip queue and communication tools
- Analytics dashboard for performance tracking

---

## ✨ Key Features

### 🧑‍🎓 For Students
- 🚕 **Ride Booking** with pickup/drop-off
-  **Live Shuttle Map** (Google Maps)
-  **Status Notifications** (pending → active → complete)
-  **Ride History** tracking
-  **Integrated Chat** with admin/driver
-  **User Profile** with preferences

### 🧑‍💼 For Admins
-  **Central Dashboard** for all rides
-  **Ride Request Management**
- 👨‍✈ **Driver Assignment Tools**
-  **Analytics Suite** with:
  - Total rides, active/completed rides
  - Wait times, peak hours
  - Most requested locations
- 📄 **User & Ride Logs**

###  For Drivers
-  **Trip Queue** in real-time
-  **Navigation Links**
-  **Ride Status Control**
-  **Live Messaging** with students/admin

---

## 🧪 Technical Features

-  **Real-Time Location Tracking** (Google Maps + Firebase)
-  **Instant Ride Updates** via Supabase & Firestore
-  **Role-Based Secure Auth** with Firebase
-  **Progressive Web App (PWA)** capability
-  **Fully Responsive** for mobile, tablet, and desktop
-  **Built-in Analytics Dashboard**
-  **Real-Time Chat** (Firebase-based)

---

## 🧰 Tech Stack

| Layer            | Tools/Technologies |
|------------------|--------------------|
| **Frontend**     | Next.js 15+, React, TypeScript |
| **Styling**      | Tailwind CSS, Custom Themes |
| **Backend/Realtime** | Firebase Firestore, Supabase |
| **Authentication** | Firebase Auth (Email, Google SSO) |
| **Map Integration** | Google Maps JavaScript API |
| **State Management** | React Context API, Hooks |
| **Animations**   | Framer Motion |
| **Icons**        | React Icons |
| **Deployment**   | Vercel |
| **CI/CD**        | GitHub Actions (build, lint, test) |

---

## 🧑‍💻 Getting Started

### 🔐 Prerequisites
- Node.js v16+
- npm or yarn
- Firebase + Supabase account setup
- Google Maps API Key

---

### 🛠️ Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/bobcat-express-dashboard.git
cd bobcat-express-dashboard

# 2. Install dependencies
npm install
# or
yarn install

# 3. Create a .env.local file
touch .env.local
