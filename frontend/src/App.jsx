import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Settings from './pages/Settings';
import Endorsements from './pages/Endorsements';
import Inbox from './pages/Inbox';
import Community from './pages/Community';
import SmartMatches from './pages/SmartMatches';
import SkillCredits from './pages/SkillCredits';
import SessionRoom from './pages/SessionRoom';
import { Bell, User, Coins } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const [profilePicture, setProfilePicture] = useState("");
  const [skillCredits, setSkillCredits] = useState(5);

  useEffect(() => {
    if (!userId) {
      setProfilePicture("");
      setSkillCredits(5);
      return;
    }

    axios
      .get(`${API_URL}/api/users/${userId}`)
      .then((response) => {
        setProfilePicture(response.data.profilePicture || "");
        
        // Sync user data to localStorage for legacy active sessions
        if (response.data.fullName) {
          localStorage.setItem('fullName', response.data.fullName);
        }
        if (response.data.username) {
          localStorage.setItem('username', response.data.username);
        }
      })
      .catch((error) => {
        console.error("Failed to load profile picture:", error);
      });

    axios
      .get(`${API_URL}/api/credits/balance/${userId}`)
      .then((response) => {
        setSkillCredits(response.data.skillCredits ?? 5);
      })
      .catch((error) => {
        console.error("Failed to load credit balance:", error);
      });
  }, [userId, location.pathname]);

  if (["/signup", "/signin"].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 py-2 md:py-0">
      
      {/* 1. Logo (Left) */}
      <Link to="/" className="flex items-center gap-2 py-2 md:py-4 order-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          S
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          SkillSwap
        </span>
      </Link>
      
      {/* 2. Navigation Links (Bottom on mobile, Middle on desktop) */}
      <div className="flex w-full md:w-auto overflow-x-auto gap-5 md:gap-8 order-3 md:order-2 pb-2 md:pb-0 scrollbar-hide text-sm md:text-base">
        <Link
          to="/community"
          className={`border-b-2 py-2 md:py-5 font-medium whitespace-nowrap ${
            isActive("/community")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Community
        </Link>

        <Link
          to="/dashboard"
          className={`border-b-2 py-2 md:py-5 font-medium whitespace-nowrap ${
            isActive("/dashboard")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          My skills
        </Link>

        <Link
          to="/credits"
          className={`flex items-center gap-1.5 border-b-2 py-2 md:py-5 font-bold whitespace-nowrap ${
            isActive("/credits")
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-600 hover:text-amber-600"
          }`}
        >
          <Coins size={17} className="text-amber-500 fill-amber-400" />
          Credits Ledger
        </Link>

        <Link
          to="/inbox"
          className={`border-b-2 py-2 md:py-5 font-medium whitespace-nowrap ${
            isActive("/inbox")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Inbox
        </Link>
        
        <Link
          to="/endorsements"
          className={`border-b-2 py-2 md:py-5 font-medium whitespace-nowrap ${
            isActive("/endorsements")
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Endorsements
        </Link>
        
        <Link
          to="/matches"
          className={`flex items-center gap-1.5 border-b-2 py-2 md:py-5 font-bold whitespace-nowrap ${
            isActive("/matches")
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Matches
        </Link>
      </div>

      {/* 3. Profile & Actions (Right) */}
      <div className="flex items-center gap-3 md:gap-5 order-2 md:order-3">
        {/* Live Skill Credits Pill Badge */}
        <Link
          to="/credits"
          className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs md:text-sm font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <span className="text-base">🪙</span>
          <span>{skillCredits} Credits</span>
        </Link>

        <button
          type="button"
          className="text-slate-500 hover:text-slate-700"
        >
          <Bell size={20} />
        </button>

        <Link
          to="/settings"
          className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 transition-all hover:ring-2 hover:ring-blue-500 shrink-0"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={() => {
                setProfilePicture("");
              }}
            />
          ) : (
            <User size={18} />
          )}
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f9fafb] font-sans text-[#000000e6]">
        <Navbar />

        <main className="mx-auto max-w-[1200px] w-full px-4 md:px-6 py-8 overflow-x-hidden">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/signup" replace />}
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/credits" element={<SkillCredits />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/endorsements" element={<Endorsements />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/community" element={<Community />} />
            <Route path="/matches" element={<SmartMatches />} />
            <Route path="/session/:sessionId" element={<SessionRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
