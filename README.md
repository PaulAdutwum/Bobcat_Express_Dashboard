# 🚌 Bobcat Express Shuttle — Bates College

A full-featured, real-time shuttle management system designed for the Bates College community. This platform connects students, faculty, and staff with on-demand transportation services around campus and nearby cities, offering seamless booking, tracking, and administration tools.

## 🎥 Demo Video

[![Bobcat Express Demo](https://img.youtube.com/vi/H-DmH3itTGw/maxresdefault.jpg)](https://www.youtube.com/shorts/H-DmH3itTGw)

<!-- Demo video embed -->
<video controls width="600">
  <source src="./bobcatshuttle2.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

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
- **Live Shuttle Map** (Google Maps)  
- **Status Notifications** (pending → active → complete)  
- **Ride History** tracking  
- **Integrated Chat** with admin/driver  
- **User Profile** with preferences  

### 🧑‍💼 For Admins
- **Central Dashboard** for all rides  
- **Ride Request Management**  
- 👨‍✈ **Driver Assignment Tools**  
- **Analytics Suite**:  
  - Total rides, active/completed rides  
  - Wait times, peak hours  
  - Most requested locations  
- 📄 **User & Ride Logs**  

### 🚍 For Drivers
- **Trip Queue** in real-time  
- **Navigation Links**  
- **Ride Status Control**  
- **Live Messaging** with students/admin  

---

## 🧪 Technical Features

- **Real-Time Location Tracking** (Google Maps + Firebase)  
- **Instant Ride Updates** via Supabase & Firestore  
- **Role-Based Secure Auth** with Firebase  
- **Progressive Web App (PWA)** capability  
- **Fully Responsive** for mobile, tablet, and desktop  
- **Built-in Analytics Dashboard**  
- **Real-Time Chat** (Firebase-based)  

---

## 🧑‍💻 Getting Started

### 🔐 Prerequisites
- Node.js v16+  
- npm or yarn  
- Firebase & Supabase accounts  
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

# 3. Copy demo video into project root
cp /path/to/bobcatshuttle2.mp4 ./

# 4. Create a .env.local file
touch .env.local
