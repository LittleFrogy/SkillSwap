import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, MessageCircle, User, ArrowRightLeft, MapPin, Grid, BookMarked, Users, Settings as SettingsIcon, Filter, Search, MoreHorizontal, Clock, Video, Coins, LogOut } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\\/$/, "");

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Endorsement Modal State
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [selectedSessionForEndorsement, setSelectedSessionForEndorsement] = useState(null);
  const [endorsementComment, setEndorsementComment] = useState('');
  const [submittingEndorsement, setSubmittingEndorsement] = useState(false);

  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        const [sessionsRes, userRes] = await Promise.all([
          axios.get(`${API_URL}/api/sessions/user/${userId}`),
          axios.get(`${API_URL}/api/users/${userId}`)
        ]);
        setSessions(sessionsRes.data);
        setUserData(userRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, navigate]);

  const calculateCompleteness = () => {
    if (!userData) return 0;
    const fields = [userData.fullName, userData.username, userData.jobTitle, userData.tagline, userData.location, userData.bio];
    const filled = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };
  const completeness = calculateCompleteness();

  const now = new Date();
  
  // Upcoming includes sessions scheduled in the future, OR sessions that started less than 2 hours ago
  const upcomingSessions = sessions.filter(s => {
    const sessionEndTime = new Date(new Date(s.scheduledTime).getTime() + (2 * 60 * 60 * 1000));
    return sessionEndTime >= now && s.status !== 'cancelled';
  });
  
  const pastSessions = sessions.filter(s => {
    const sessionEndTime = new Date(new Date(s.scheduledTime).getTime() + (2 * 60 * 60 * 1000));
    return sessionEndTime < now || s.status === 'cancelled';
  });

  const displaySessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

  const handleEndorseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionForEndorsement) return;
    setSubmittingEndorsement(true);
    try {
      const isTeacher = selectedSessionForEndorsement.teacherId?._id === userId || selectedSessionForEndorsement.teacherId === userId;
      const partner = isTeacher ? selectedSessionForEndorsement.learnerId : selectedSessionForEndorsement.teacherId;
      
      await axios.post(`${API_URL}/api/endorsements`, {
        fromUserId: userId,
        toUserId: partner._id,
        sessionId: selectedSessionForEndorsement._id,
        skill: selectedSessionForEndorsement.skill,
        comment: endorsementComment
      });
      alert('Endorsement sent successfully!');
      setIsEndorseModalOpen(false);
      setEndorsementComment('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit endorsement.');
    } finally {
      setSubmittingEndorsement(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-6xl mx-auto">

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur rounded-[28px] shadow-[0_25px_60px_-24px_rgba(15,23,42,0.35)] border border-white/70 overflow-hidden relative group cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="h-28 bg-[linear-gradient(120deg,_#0f172a_0%,_#1d4ed8_40%,_#38bdf8_100%)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_35%)]"></div>
          </div>
          <div className="px-6 pb-6 relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white absolute -top-12 shadow-lg bg-white flex items-center justify-center text-slate-300 bg-slate-50">
              {userData?.profilePicture ? (
                <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="pt-14">
              <h2 className="text-xl font-bold text-slate-900">{userData?.fullName || 'Anonymous User'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {userData?.jobTitle || 'No title set'} {userData?.tagline ? `• ${userData.tagline}` : ''}
              </p>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-3">
                <MapPin size={14} /> {userData?.location || 'No location set'}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-50">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-blue-600">Profile completeness</span>
                <span className="text-blue-600">{completeness}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completeness}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sidebar */}
        <nav className="space-y-1">
          <Link to="/matches" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/matches') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Grid size={18} /> Smart matches
          </Link>
          <Link to="/credits" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/credits') ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Coins size={18} className="text-amber-500" /> Skill credits
          </Link>
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <BookMarked size={18} /> My skill library
          </Link>
          <Link to="/sessions" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/sessions') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Video size={18} /> Sessions
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/settings') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <SettingsIcon size={18} /> Settings
          </Link>
        </nav>
      </div>

      {/* RIGHT COLUMN: Main Feed */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Video size={14} /> Virtual Classroom
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Your Sessions</h1>
          <p className="text-slate-500 mb-6">Manage your upcoming and past skill swap video calls.</p>
          
          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'upcoming' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Upcoming ({upcomingSessions.length})
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'past' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Past Sessions ({pastSessions.length})
            </button>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center p-12 text-slate-500">Loading sessions...</div>
        ) : displaySessions.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Video size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No {activeTab} sessions</h3>
            <p className="text-slate-500 mb-6">You don't have any {activeTab} sessions scheduled right now.</p>
            <button onClick={() => navigate('/matches')} className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors shadow-sm">
              Find Partners
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySessions.map(session => (
              <SessionCard 
                key={session._id} 
                session={session} 
                currentUserId={userId} 
                navigate={navigate} 
                onEndorse={() => {
                  setSelectedSessionForEndorsement(session);
                  setIsEndorseModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ENDORSEMENT MODAL */}
      {isEndorseModalOpen && selectedSessionForEndorsement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 md:p-8">
              <h3 className="font-bold text-2xl text-slate-900 mb-2">Endorse Partner</h3>
              <p className="text-sm text-slate-500 mb-6">Leave a public endorsement for their {selectedSessionForEndorsement.skill} skills.</p>
              
              <form onSubmit={handleEndorseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your Comment</label>
                  <textarea 
                    required 
                    rows="3" 
                    value={endorsementComment} 
                    onChange={e => setEndorsementComment(e.target.value)} 
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-emerald-500 resize-none" 
                    placeholder="E.g., Great mentor, explained things very clearly!"
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEndorseModalOpen(false)} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={submittingEndorsement} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 disabled:opacity-70 transition-all">
                    {submittingEndorsement ? 'Submitting...' : 'Submit Endorsement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, currentUserId, navigate, onEndorse }) {
  const isTeacher = session.teacherId?._id === currentUserId || session.teacherId === currentUserId;
  const partner = isTeacher ? session.learnerId : session.teacherId;
  const dateObj = new Date(session.scheduledTime);
  
  // A session is considered "past" (and completed) only 2 hours AFTER its scheduled start time.
  // This gives users a 2-hour window to actually join and conduct the video call.
  const sessionEndTime = new Date(dateObj.getTime() + (2 * 60 * 60 * 1000));
  const isPast = sessionEndTime < new Date();

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-6">
      
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">{session.skill}</h3>
          <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <span>{dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <img src={partner?.profilePicture || 'https://via.placeholder.com/30'} alt="Partner" className="w-5 h-5 rounded-full object-cover" />
            {isTeacher ? 'Teaching' : 'Learning with'} {partner?.fullName || 'Anonymous'}
          </div>
        </div>
      </div>

      <div className="w-full md:w-auto flex justify-end">
        {!isPast ? (
          <button 
            onClick={() => navigate(`/session/${session._id}`)}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
          >
            Join Room
          </button>
        ) : (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-bold text-center">
              Completed
            </span>
            <button onClick={onEndorse} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm">
              Endorse Partner
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
