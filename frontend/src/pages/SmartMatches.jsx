import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, MessageCircle, User, ArrowRightLeft, MapPin, Grid, BookMarked, Users, Settings as SettingsIcon, Filter, Search, MoreHorizontal, Clock, Video } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SmartMatches() {
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'matched'
  
  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    skill: '',
    scheduledTime: '',
    notes: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Filter States
  const [filterScore, setFilterScore] = useState(0);
  const [filterCategory, setFilterCategory] = useState('All categories');
  const [sortBy, setSortBy] = useState('Best match');
  const [filterAvailability, setFilterAvailability] = useState('Any time');
  const [filterExperience, setFilterExperience] = useState('Any level');

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
        const [matchesRes, userRes, requestsRes] = await Promise.all([
          axios.get(`${API_URL}/api/matches?userId=${userId}`),
          axios.get(`${API_URL}/api/users/${userId}`),
          axios.get(`${API_URL}/api/matches/requests/pending?userId=${userId}`)
        ]);
        setMatches(matchesRes.data);
        setUserData(userRes.data);
        setRequests(requestsRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleMatchRequest = async (toUserId) => {
    try {
      await axios.post(`${API_URL}/api/matches/request`, { fromUserId: userId, toUserId });
      setMatches(matches.map(m => m.userId === toUserId ? { ...m, matchStatus: 'sent_pending' } : m));
    } catch (err) {
      console.error(err);
      alert('Failed to send request');
    }
  };

  const handleRespond = async (requestId, status) => {
    try {
      await axios.put(`${API_URL}/api/matches/respond`, { requestId, status });
      // Remove from pending requests
      setRequests(requests.filter(r => r._id !== requestId));
      // Optionally update the matchStatus in the main feed if that user is also in our match list
      setMatches(matches.map(m => m.matchStatus === 'received_pending' ? { ...m, matchStatus: status } : m));
    } catch (err) {
      console.error(err);
      alert('Failed to respond');
    }
  };

  const calculateCompleteness = () => {
    if (!userData) return 0;
    const fields = [userData.fullName, userData.username, userData.jobTitle, userData.tagline, userData.location, userData.bio];
    const filled = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };
  const completeness = calculateCompleteness();

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setIsScheduling(true);
    
    try {
      const res = await axios.post(`${API_URL}/api/sessions/schedule`, {
        teacherId: selectedMatch.userId, // We can refine this later if they are the learner
        learnerId: userId,
        skill: scheduleForm.skill,
        scheduledTime: scheduleForm.scheduledTime,
        notes: scheduleForm.notes
      });
      alert('Session scheduled successfully! Calendar invite sent.');
      setIsScheduleModalOpen(false);
      setScheduleForm({ skill: '', scheduledTime: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to schedule session.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Extract unique skills from matches for the filter dropdown
  const uniqueSkills = Array.from(
    new Set(
      matches.flatMap(m => [...m.matchedSkills.theyCanTeachYou, ...m.matchedSkills.youCanTeachThem])
    )
  ).sort();

  // Apply Filters and Sorting
  let filteredMatches = matches.filter(m => {
    // Filter based on Active Tab
    if (activeTab === 'discover' && m.matchStatus === 'accepted') return false;
    if (activeTab === 'matched' && m.matchStatus !== 'accepted') return false;

    if (m.compatibilityScore < filterScore) return false;
    
    if (filterCategory !== 'All categories') {
      const hasSkill = m.matchedSkills.theyCanTeachYou.includes(filterCategory) || m.matchedSkills.youCanTeachThem.includes(filterCategory);
      if (!hasSkill) return false;
    }

    if (filterAvailability !== 'Any time') {
      const matchAvail = filterAvailability === 'Weekends' 
        ? m.availabilities?.some(av => av.includes('Sat') || av.includes('Sun'))
        : m.availabilities?.some(av => av.includes(filterAvailability));
      if (!matchAvail) return false;
    }

    if (filterExperience !== 'Any level') {
      if (!m.levels?.includes(filterExperience)) return false;
    }
    
    return true;
  });

  if (sortBy === 'Best match') {
    filteredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } else if (sortBy === 'Score (Lowest First)') {
    filteredMatches.sort((a, b) => a.compatibilityScore - b.compatibilityScore);
  } else if (sortBy === 'Name (A-Z)') {
    filteredMatches.sort((a, b) => (a.user?.fullName || '').localeCompare(b.user?.fullName || ''));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-[1400px] mx-auto">
      
      {/* LEFT COLUMN: Profile & Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-6 hidden md:block">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-400 relative"></div>
          <div className="px-5 pb-5 relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white absolute -top-10 shadow-sm bg-white flex items-center justify-center text-slate-300">
              {userData?.profilePicture ? (
                <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="pt-12">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{userData?.fullName || 'Anonymous User'}</h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {userData?.jobTitle || 'SkillSwap Member'} {userData?.tagline ? `• ${userData.tagline}` : ''}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                <MapPin size={12} /> {userData?.location || 'Location not set'}
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
          <button 
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'discover' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
          >
            <Grid size={18} /> Smart matches
          </button>
          <button 
            onClick={() => setActiveTab('matched')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'matched' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
          >
            <Users size={18} /> My Matches
          </button>
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
        
        {/* Header & Search */}
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} /> {activeTab === 'discover' ? 'Your Exchange Hub' : 'Your Learning Partners'}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
            {activeTab === 'discover' ? 'Find your next learning partner.' : 'Your Active Connections'}
          </h1>
          <p className="text-slate-500 mb-6">
            {activeTab === 'discover' ? 'Handpicked connections based on what you can share and explore.' : 'People you have successfully matched with for skill swapping.'}
          </p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search people or skills" 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            />
          </div>
        </div>

        <div className="flex justify-between items-end pb-2 pt-2 relative">
          <p className="text-sm font-bold text-slate-800"><span className="text-slate-900">{matches.length} recommended</span> for you this week</p>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className="text-sm font-medium text-slate-500 flex items-center gap-1.5 hover:text-slate-800 transition-colors"
          >
            <Filter size={14} /> Filter & Sort
          </button>
          
          {/* Dropdown Filter Menu */}
          {isFilterOpen && (
            <div className="absolute top-10 right-0 w-[280px] bg-white rounded-3xl shadow-xl border border-slate-100 p-6 z-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Refine matches</h3>
                <Filter size={18} className="text-blue-600" />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Best match</option>
                    <option>Score (Lowest First)</option>
                    <option>Name (A-Z)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skill Category</label>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>All categories</option>
                    {uniqueSkills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Availability</label>
                  <select 
                    value={filterAvailability}
                    onChange={e => setFilterAvailability(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Any time</option>
                    <option>Weekends</option>
                    <option>Morning</option>
                    <option>Evening</option>
                    <option>Night</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience Level</label>
                  <select 
                    value={filterExperience}
                    onChange={e => setFilterExperience(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Any level</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Match Score</label>
                    <span className="text-xs font-bold text-blue-600">{filterScore}%+</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={filterScore}
                    onChange={(e) => setFilterScore(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setFilterScore(0);
                      setFilterCategory('All categories');
                      setSortBy('Best match');
                      setFilterAvailability('Any time');
                      setFilterExperience('Any level');
                    }}
                    className="w-full py-2.5 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Incoming Requests Section */}
        {requests.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pending requests ({requests.length})</h3>
            {requests.map((req) => (
              <div key={req._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[24px] border border-blue-100 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0 shadow-sm border border-slate-100">
                    {req.fromUser?.profilePicture ? (
                      <img src={req.fromUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="m-auto mt-3 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{req.fromUser?.fullName || 'Anonymous User'}</h4>
                    <p className="text-xs text-slate-600">Wants to start a skill swap with you!</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(req._id, 'rejected')} className="px-5 py-2 bg-white text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">Reject</button>
                  <button onClick={() => handleRespond(req._id, 'accepted')} className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">Accept</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Matches List */}
        {filteredMatches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No matches found</h3>
            <p className="text-sm">Try adjusting your filters or adding more skills!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <HorizontalMatchCard 
                key={match.userId} 
                match={match} 
                onRequest={() => handleMatchRequest(match.userId)} 
                onMessage={() => navigate(`/inbox?chatWith=${match.userId}`)} 
                onSchedule={() => {
                  setSelectedMatch(match);
                  setScheduleForm({
                    ...scheduleForm,
                    skill: match.matchedSkills.theyCanTeachYou[0] || match.matchedSkills.youCanTeachThem[0] || ''
                  });
                  setIsScheduleModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* SCHEDULE SESSION MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 md:p-8">
              <h3 className="font-bold text-2xl text-slate-900 mb-6">Schedule Session</h3>
              <form onSubmit={handleScheduleSession} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Partner</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <img src={selectedMatch?.user?.profilePicture || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full" />
                    <span className="font-semibold text-sm">{selectedMatch?.user?.fullName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Topic / Skill</label>
                  <input required type="text" value={scheduleForm.skill} onChange={e => setScheduleForm({...scheduleForm, skill: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date & Time</label>
                  <input required type="datetime-local" value={scheduleForm.scheduledTime} onChange={e => setScheduleForm({...scheduleForm, scheduledTime: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Agenda / Notes</label>
                  <textarea rows="2" value={scheduleForm.notes} onChange={e => setScheduleForm({...scheduleForm, notes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none text-sm focus:ring-2 focus:ring-blue-500 resize-none" placeholder="What do you want to achieve?"></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-sm transition-colors">Cancel</button>
                  <button type="submit" disabled={isScheduling} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl text-sm shadow-md hover:opacity-95 disabled:opacity-70 transition-all">
                    {isScheduling ? 'Scheduling...' : 'Send Invite'}
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

function HorizontalMatchCard({ match, onRequest, onMessage, onSchedule }) {
  const { user, compatibilityScore, matchedSkills, matchStatus } = match;
  
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compatibilityScore / 100) * circumference;
  
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all relative">
      <div className="flex flex-col sm:flex-row gap-5">
        
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user?.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24} /></div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 pr-12 pb-12 sm:pb-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-none mb-1.5">{user?.fullName || 'Anonymous User'}</h3>
              <p className="text-xs font-medium text-slate-500 mb-2">{user?.jobTitle || 'SkillSwap Member'}</p>
              <p className="text-xs text-slate-600 line-clamp-1 mb-4">{user?.tagline || 'Passionate about learning and sharing skills.'}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {matchedSkills.theyCanTeachYou.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Can teach you</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.theyCanTeachYou.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold capitalize">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {matchedSkills.youCanTeachThem.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wants to learn</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.youCanTeachThem.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold capitalize border border-emerald-100/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-600">
              <Clock size={14} className="text-emerald-500" /> 
              {match.availability}
            </span>
            {matchedSkills.theyCanTeachYou.slice(0, 2).map(skill => (
              <span key={skill} className="px-2.5 py-0.5 rounded-full border border-slate-200 capitalize">{skill}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Absolute top-right circle */}
      <div className="absolute top-6 right-6 flex items-center justify-center w-[52px] h-[52px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={radius} className="stroke-slate-100" strokeWidth="5" fill="none" />
          <circle 
            cx="26" cy="26" r={radius} 
            className="stroke-blue-600 transition-all duration-1000 ease-out" 
            strokeWidth="5" fill="none" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute font-bold text-blue-700 text-sm">{compatibilityScore}%</div>
      </div>

      {/* Absolute bottom-right actions */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <button 
          onClick={onMessage}
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <MessageCircle size={16} />
        </button>
        
        {matchStatus === 'none' && (
          <button 
            onClick={onRequest}
            className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            Match
          </button>
        )}
        
        {matchStatus === 'sent_pending' && (
          <button disabled className="px-5 py-2 bg-slate-100 text-slate-400 rounded-full text-xs font-bold flex items-center gap-2 border border-slate-200/50">
            Requested
          </button>
        )}

        {matchStatus === 'received_pending' && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">Reject</button>
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">Accept</button>
          </div>
        )}

        {matchStatus === 'accepted' && (
          <button 
            onClick={onSchedule}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all border border-transparent"
          >
            Schedule Session
          </button>
        )}
      </div>
    </div>
  );
}
