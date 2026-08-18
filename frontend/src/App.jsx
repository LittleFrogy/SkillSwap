import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Sessions from './pages/Sessions';
import { Bell, User, Check, CheckCheck } from 'lucide-react';
import { initPushNotifications } from './utils/pushNotifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Reaction emoji map 
const REACTION_EMOJI = { like: '👍', helpful: '🙌', insightful: '💡' };
const TARGET_LABEL = { post: 'post', comment: 'comment' };

// Notification Bell + Dropdown 
function NotificationBell({ username }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!username) return;
    try {
      const res = await axios.get(`${API_URL}/api/notifications/inbox/${encodeURIComponent(username)}`);
      setNotifications(res.data);
    } catch {
    }
  }, [username]);

  // Poll every 30s so new reactions show up without a page refresh
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen(v => !v);
    // Mark all as read when the panel is opened
    if (!open && unreadCount > 0 && username) {
      try {
        await axios.put(`${API_URL}/api/notifications/mark-all-read/${encodeURIComponent(username)}`);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch { /* ignore */ }
    }
  };

  const markOne = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">
                {unreadCount === 0 ? 'All caught up!' : `${unreadCount} new`}
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n._id}
                  onClick={() => markOne(n._id)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/60' : ''
                    }`}
                >
                  {/* Emoji */}
                  <span className="text-xl shrink-0 mt-0.5">
                    {REACTION_EMOJI[n.reactionType] || '🔔'}
                  </span>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold text-gray-900">{n.actorName}</span>
                      {' reacted '}
                      <span className="font-medium">{n.reactionType}</span>
                      {' to your '}
                      <span className="font-medium">{TARGET_LABEL[n.targetType] || n.targetType}</span>
                    </p>
                    {n.contentSnippet && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        "{n.contentSnippet}"
                      </p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-1">{formatTime(n.createdAt)}</p>
                  </div>

                  {/* Read indicator */}
                  {!n.read
                    ? <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    : <Check size={13} className="text-gray-300 shrink-0 mt-1" />
                  }
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 flex justify-end">
              <button
                onClick={async () => {
                  if (!username) return;
                  try {
                    await axios.put(`${API_URL}/api/notifications/mark-all-read/${encodeURIComponent(username)}`);
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium transition"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Navbar
function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const [profilePicture, setProfilePicture] = useState('');
  const [skillCredits, setSkillCredits] = useState(5);
  const [currentUsername, setCurrentUsername] = useState(
    localStorage.getItem('fullName') || localStorage.getItem('username') || ''
  );

  useEffect(() => {
    if (!userId) {
      setProfilePicture('');
      setSkillCredits(5);
      return;
    }

    axios
      .get(`${API_URL}/api/users/${userId}`)
      .then((response) => {
        setProfilePicture(response.data.profilePicture || '');

        if (response.data.fullName) {
          localStorage.setItem('fullName', response.data.fullName);
          setCurrentUsername(response.data.fullName);
        }
        if (response.data.username) {
          localStorage.setItem('username', response.data.username);
          if (!response.data.fullName) setCurrentUsername(response.data.username);
        }
      })
      .catch((error) => {
        console.error('Failed to load profile picture:', error);
      });

    axios
      .get(`${API_URL}/api/credits/balance/${userId}`)
      .then((response) => {
        setSkillCredits(response.data.skillCredits ?? 5);
      })
      .catch((error) => {
        console.error('Failed to load credit balance:', error);
      });
  }, [userId, location.pathname]);

  if (['/signup', '/signin'].includes(location.pathname)) return null;

  return (
    <nav className="sticky top-0 z-40 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 py-2 md:py-0">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 py-2 md:py-4 order-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          S
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">SkillSwap</span>
      </Link>

      {/* Nav links */}
      <div className="flex w-full md:w-auto overflow-x-auto gap-5 md:gap-8 order-3 md:order-2 pb-2 md:pb-0 scrollbar-hide text-sm md:text-base">
        {[
          { to: '/community', label: 'Community' },
          { to: '/dashboard', label: 'My Skills' },
          { to: '/inbox', label: 'Inbox' },
          { to: '/endorsements', label: 'Endorsements' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`border-b-2 py-2 md:py-5 font-medium whitespace-nowrap ${isActive(to)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4 order-2 md:order-3">
        {/* Credits pill */}
        <Link
          to="/credits"
          className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs md:text-sm font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <span className="text-base">🪙</span>
          <span>{skillCredits} Credits</span>
        </Link>

        {/* Notification bell */}
        <NotificationBell username={currentUsername} />

        {/* Profile avatar */}
        <Link
          to="/settings"
          className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400 transition-all hover:ring-2 hover:ring-blue-500 shrink-0"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={() => setProfilePicture('')}
            />
          ) : (
            <User size={18} />
          )}
        </Link>
      </div>
    </nav>
  );
}

// App 
function App() {
  useEffect(() => {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) initPushNotifications(userId);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#f9fafb] font-sans text-[#000000e6]">
        <Navbar />
        <main className="mx-auto max-w-[1200px] w-full px-4 md:px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/signin" replace />} />
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
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/session/:sessionId" element={<SessionRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
