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
import { Bell, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (!userId) {
      setProfilePicture("");
      return;
    }

    axios
      .get(`${API_URL}/api/users/${userId}`)
      .then((response) => {
        setProfilePicture(response.data.profilePicture || "");
      })
      .catch((error) => {
        console.error("Failed to load profile picture:", error);
      });
  }, [userId, location.pathname]);

  if (["/signup", "/signin"].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 py-2 md:py-0">
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            SkillSwap
          </span>
        </Link>
        
        <div className="flex w-full md:w-auto overflow-x-auto gap-4 md:gap-8 order-last md:order-none pb-1 md:pb-0">
          <Link
            to="/community"
            className={`border-b-2 py-5 font-medium ${
              isActive("/community")
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Community
          </Link>

          <Link
            to="/dashboard"
            className={`border-b-2 py-5 font-medium ${
              isActive("/dashboard")
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            My skills
          </Link>

          <Link
            to="/inbox"
            className={`border-b-2 py-5 font-medium ${
              isActive("/inbox")
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Inbox
          </Link>
          
          <Link
            to="/endorsements"
            className={`border-b-2 py-5 font-medium ${
              isActive("/endorsements")
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Endorsements
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          1,240 skills shared
        </div>

        <button
          type="button"
          className="text-slate-500 hover:text-slate-700"
        >
          <Bell size={20} />
        </button>

        <Link
          to="/settings"
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 transition-all hover:ring-2 hover:ring-blue-500"
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

        <main className="mx-auto max-w-[1200px] px-6 py-8">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/signup" replace />}
            />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/endorsements" element={<Endorsements />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
