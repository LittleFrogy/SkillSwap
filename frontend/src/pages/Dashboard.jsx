import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, Sparkles, GraduationCap, BookOpen, MapPin, Grid, BookMarked, Users, Settings as SettingsIcon, Clock, User, BadgeCheck, Coins, Video, Trophy, Award, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/listings`;
const USER_API_URL = `${BASE_URL}/api/users`;

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const [listings, setListings] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [uniqueSkills, setUniqueSkills] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [endorsementForm, setEndorsementForm] = useState({ skill: '', comment: '' });
  const [submittingEndorsement, setSubmittingEndorsement] = useState(false);
  const [myBadges, setMyBadges] = useState([]);
  
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportMissingKey, setReportMissingKey] = useState(false);

  const fetchProgressReport = async () => {
    setReportLoading(true);
    setReportError('');
    setReportMissingKey(false);
    setReport(null);
    setReportOpen(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/progress-report`, { userId });
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data?.missingKey) setReportMissingKey(true);
      setReportError(data?.message || 'Failed to generate report. Make sure your backend server is running.');
    } finally {
      setReportLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    type: 'teach',
    skill: '',
    proficiencyLevel: 'Intermediate',
    description: '',
    weeklyAvailability: '',
    days: [],
    times: []
  });

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TIMES = ['Morning', 'Noon', 'Afternoon', 'Evening', 'Night'];

  const toggleArrayItem = (array, item) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }
    fetchData();
    fetchBadges();
  }, [userId, navigate]);

  const fetchData = async () => {
    try {
      // Fetch user data first, as it's the most critical for the page
      try {
        const userRes = await axios.get(`${USER_API_URL}/${userId}`);
        setUserData(userRes.data);
      } catch (err) {
        console.error("Failed to load user data:", err);
      }

      // Fetch other data in parallel but handle errors independently
      const [listingsRes, sessionsRes, skillsRes] = await Promise.allSettled([
        axios.get(`${API_URL}?userId=${userId}`),
        axios.get(`${BASE_URL}/api/endorsements/sessions?userId=${userId}`),
        axios.get(`${API_URL}/skills/unique`)
      ]);

      if (listingsRes.status === 'fulfilled') setListings(listingsRes.value.data);
      if (skillsRes.status === 'fulfilled') setUniqueSkills(skillsRes.value.data);
      
      if (sessionsRes.status === 'fulfilled') {
        const sessionData = sessionsRes.value.data;
        setSessions(sessionData);
        if (sessionData[0]) {
          setSelectedSession(sessionData[0].sessionId);
          setEndorsementForm((current) => ({ ...current, skill: sessionData[0].skill }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/leaderboard/badges/${userId}`);
      setMyBadges((res.data.badges || []).filter(b => b.earned));
    } catch (err) {
      // silently ignore
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setListings(listings.filter(l => l._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type = 'teach', listing = null) => {
    if (listing) {
      setEditingListing(listing);
      setFormData({
        type: listing.type,
        skill: listing.skill,
        proficiencyLevel: listing.proficiencyLevel,
        description: listing.description,
        weeklyAvailability: listing.weeklyAvailability || '',
        days: listing.days || [],
        times: listing.times || []
      });
    } else {
      setEditingListing(null);
      setFormData({
        type,
        skill: '',
        proficiencyLevel: 'Intermediate',
        description: '',
        weeklyAvailability: '',
        days: [],
        times: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      //Auto weeklyAvailability string from days and times if it was empty
      const derivedAvailability = formData.days?.length > 0 || formData.times?.length > 0
        ? `${formData.days?.join(', ')} ${formData.times?.length > 0 ? `(${formData.times.join(', ')})` : ''}`
        : 'Flexible';

      const payload = {
        ...formData,
        userId,
        weeklyAvailability: derivedAvailability
      };

      if (editingListing) {
        const res = await axios.put(`${API_URL}/${editingListing._id}`, payload);
        setListings(listings.map(l => l._id === editingListing._id ? res.data : l));
      } else {
        const res = await axios.post(API_URL, payload);
        setListings([...listings, res.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving listing.");
    }
  };

  const handleEndorsementSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession || !endorsementForm.skill || !endorsementForm.comment) return;

    setSubmittingEndorsement(true);
    try {
      const session = sessions.find((item) => item.sessionId === selectedSession);
      await axios.post(`${BASE_URL}/api/endorsements`, {
        fromUserId: userId,
        toUserId: session.partnerUserId,
        sessionId: selectedSession,
        skill: endorsementForm.skill,
        comment: endorsementForm.comment
      });
      alert('Endorsement submitted successfully.');
      setEndorsementForm({ skill: '', comment: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Unable to submit endorsement.');
    } finally {
      setSubmittingEndorsement(false);
    }
  };

  const calculateCompleteness = () => {
    if (!userData) return 0;
    const fields = [userData.fullName, userData.username, userData.jobTitle, userData.tagline, userData.location, userData.bio];
    const filled = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const teachListings = listings.filter(l => l.type === 'teach');
  const learnListings = listings.filter(l => l.type === 'learn');

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const completeness = calculateCompleteness();

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        {/* Profile Card */}
        <div className="bg-white/95 backdrop-blur rounded-[28px] shadow-[0_25px_60px_-24px_rgba(15,23,42,0.35)] border border-white/70 overflow-hidden relative group cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm text-slate-700 flex items-center gap-2"><Edit2 size={14} /> Edit Profile</span>
          </div>
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

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-600">Profile completeness</span>
                <span className="text-blue-600">{completeness}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${completeness === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} style={{ width: `${completeness}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
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
          <Link to="/leaderboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/leaderboard') ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Trophy size={18} className="text-amber-500" /> Leaderboard
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/settings') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <SettingsIcon size={18} /> Settings
          </Link>
        </nav>

        {/* Your Badges Mini Panel */}
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/70 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award size={15} className="text-amber-500" />
              <span className="text-sm font-bold text-slate-800">Your Badges</span>
            </div>
            <Link to="/leaderboard" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          {myBadges.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-2xl mb-1">🎯</p>
              <p className="text-xs text-slate-500">No badges yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Complete sessions to earn badges!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {myBadges.map(badge => (
                <span
                  key={badge.id}
                  title={`${badge.name}: ${badge.description}`}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium cursor-help
                    ${{ bronze: 'bg-amber-50 border-amber-200 text-amber-700', silver: 'bg-slate-50 border-slate-300 text-slate-700', gold: 'bg-yellow-50 border-yellow-200 text-yellow-800' }[badge.tier]}
                  `}
                >
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0">

        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} /> Your Exchange Hub
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Shape your skill story.</h1>
            <p className="text-slate-500 text-lg">The more specific you are, the better your matches become.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProgressReport}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-full font-semibold hover:opacity-95 flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(147,51,234,0.7)]"
            >
              {reportLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Get My Progress Report
            </button>
            <button
              onClick={() => openModal('teach')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:opacity-95 flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(37,99,235,0.7)]"
            >
              <Plus size={18} /> Add a skill
            </button>
          </div>
        </div>

        {/* Teach Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Skills I can teach</h2>
                <p className="text-sm text-slate-500">Give someone a shortcut to what you know.</p>
              </div>
            </div>
            <button onClick={() => openModal('teach')} className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
              <Plus size={16} /> Add skill
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {teachListings.map(l => (
              <ListingCard key={l._id} listing={l} onEdit={() => openModal('teach', l)} onDelete={() => handleDelete(l._id)} iconColor="blue" />
            ))}
          </div>
        </div>

        {/* Learn Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Skills I want to learn</h2>
                <p className="text-sm text-slate-500">Let the right teacher find you.</p>
              </div>
            </div>
            <button onClick={() => openModal('learn')} className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 flex items-center gap-1">
              <Plus size={16} /> Add skill
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {learnListings.map(l => (
              <ListingCard key={l._id} listing={l} onEdit={() => openModal('learn', l)} onDelete={() => handleDelete(l._id)} iconColor="emerald" />
            ))}
          </div>
        </div>

        <div className="mb-10 bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-6 shadow-[0_25px_60px_-24px_rgba(15,23,42,0.3)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
              <BadgeCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Endorse completed sessions</h2>
              <p className="text-sm text-slate-500">Share public trust signals only after a real session is completed.</p>
            </div>
          </div>

          <form onSubmit={handleEndorsementSubmit} className="space-y-3">
            <div className="grid md:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Completed session</label>
                <select value={selectedSession} onChange={(e) => {
                  const session = sessions.find((item) => item.sessionId === e.target.value);
                  setSelectedSession(e.target.value);
                  setEndorsementForm((current) => ({ ...current, skill: session ? session.skill : '' }));
                }} className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900">
                  {sessions.map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>{session.partnerName} • {session.skill}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Skill</label>
                <input required type="text" className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900" value={endorsementForm.skill} onChange={(e) => setEndorsementForm({ ...endorsementForm, skill: e.target.value })} />
              </div>
              <button type="submit" disabled={submittingEndorsement} className="px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 disabled:opacity-70 shadow-sm">
                {submittingEndorsement ? 'Submitting...' : 'Submit endorsement'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Comment</label>
              <input required type="text" className="w-full p-3 rounded-2xl border border-slate-200 bg-white/90 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900" value={endorsementForm.comment} onChange={(e) => setEndorsementForm({ ...endorsementForm, comment: e.target.value })} />
            </div>
          </form>
        </div>

      </div>

      {/* Progress Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl my-8 overflow-hidden relative border border-white/20">
            {/* Header background with gradient */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            <div className="relative pt-8 px-8 pb-6 flex justify-between items-start">
              <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-sm font-bold flex items-center gap-2 border border-white/30 shadow-sm">
                <Sparkles size={16} /> AI Progress Report
              </div>
              <button onClick={() => setReportOpen(false)} className="bg-black/10 hover:bg-black/20 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/20">
                <X size={20} />
              </button>
            </div>

            <div className="px-8 pb-8 relative z-10">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={48} className="animate-spin text-fuchsia-500 mb-4" />
                  <p className="text-slate-600 font-medium">Analysing your activity...</p>
                  <p className="text-slate-400 text-sm mt-1">Generating your personalised report</p>
                </div>
              ) : reportError ? (
                <div className="mt-8">
                  {reportMissingKey ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">🔑</div>
                      <h3 className="font-bold text-amber-900 text-lg mb-2">Gemini API Key Required</h3>
                      <p className="text-amber-800 text-sm mb-4 leading-relaxed">
                        To generate AI progress reports, add your Google Gemini API key to the backend{' '}
                        <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file:
                      </p>
                      <div className="bg-white border border-amber-200 rounded-xl p-3 font-mono text-xs text-left text-slate-700 mb-4 select-all">
                        GEMINI_API_KEY=<span className="text-violet-600">your_key_here</span>
                      </div>
                      <p className="text-amber-700 text-xs">
                        Get a free key at{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-bold underline hover:text-amber-900">
                          aistudio.google.com/apikey
                        </a>
                        , then restart your backend server.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex flex-col items-center text-center py-10">
                      <div className="text-4xl mb-3">⚠️</div>
                      <p className="font-semibold text-lg mb-2">Something went wrong</p>
                      <p className="text-sm opacity-80 max-w-sm">{reportError}</p>
                      <button
                        onClick={fetchProgressReport}
                        className="mt-5 px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-sm font-semibold transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              ) : report ? (
                <div className="space-y-6 mt-2">
                  <h2 className="text-3xl font-black text-slate-900 leading-tight">
                    {report.headline}
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {report.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {report.strengths?.map((strength, i) => (
                      <span key={i} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold border border-slate-200 flex items-center gap-2">
                        <BadgeCheck size={16} className="text-emerald-500" /> {strength}
                      </span>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-20 text-4xl">🎉</div>
                      <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2"><Award size={18} /> Recent Win</h4>
                      <p className="text-amber-900/80 text-sm font-medium leading-relaxed">{report.recentWin}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-slate-800 font-bold mb-2 flex items-center gap-2"><Trophy size={18} className="text-blue-500" /> Next Milestone</h4>
                      <div className="flex items-start gap-3">
                        <div className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100 shrink-0">{report.nextBadge?.icon}</div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{report.nextBadge?.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{report.nextBadge?.gap}</p>
                          <p className="text-xs text-blue-600 font-semibold mt-1">{report.nextBadge?.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Recommendation</h4>
                      <p className="text-slate-600 text-sm mb-3">{report.recommendation}</p>
                      <Link to="/matches" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                        View matches <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>

                  <div className="text-center pt-6 border-t border-slate-100">
                    <p className="italic text-slate-500 text-lg font-medium">"{report.motivationalClose}"</p>
                    <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
                      <Sparkles size={12} /> Powered by Gemini
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            
            <datalist id="dashboard-skills-list">
              {uniqueSkills.map(skill => (
                <option key={skill} value={skill} />
              ))}
            </datalist>

            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                    {formData.type === 'teach' ? 'Teaching Profile' : 'Learning Profile'}
                  </p>
                  <h3 className="font-bold text-2xl text-slate-900">{editingListing ? 'Edit skill' : 'Add skill'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Skill name</label>
                  <input required type="text" list="dashboard-skills-list" placeholder="e.g. Product Design" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900" value={formData.skill} onChange={e => setFormData({ ...formData, skill: e.target.value })} />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Proficiency level</label>
                    <select className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 appearance-none bg-white" value={formData.proficiencyLevel} onChange={e => setFormData({ ...formData, proficiencyLevel: e.target.value })}>
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Weekly availability (Days)</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFormData({ ...formData, days: toggleArrayItem(formData.days, day) })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${formData.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Timings</label>
                  <div className="flex flex-wrap gap-2">
                    {TIMES.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, times: toggleArrayItem(formData.times, time) })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${formData.times.includes(time) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Description</label>
                  <textarea required rows="3" placeholder="Describe what you can offer..." className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="pt-6 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-full transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-sm transition-colors">{editingListing ? 'Save changes' : 'Add skill'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onEdit, onDelete, iconColor }) {
  const isTeach = listing.type === 'teach';
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  // Pick random color for visual flair, default to passed prop
  const iconBg = isTeach ? colorMap.blue : colorMap.emerald;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          <Sparkles size={16} />
        </div>
        <div className="flex gap-2 text-slate-400">
          <button onClick={onEdit} className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={16} /></button>
          <button onClick={onDelete} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-slate-900">{listing.skill}</h3>
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {listing.proficiencyLevel}
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{listing.description}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 pt-4 border-t border-slate-50">
        <Clock size={14} className="text-emerald-500" />
        {listing.days?.length > 0 || listing.times?.length > 0
          ? (
            <>
              {listing.days?.length > 0 && <span>{listing.days.join(', ')}</span>}
              {listing.days?.length > 0 && listing.times?.length > 0 && <span>•</span>}
              {listing.times?.length > 0 && <span>{listing.times.join(', ')}</span>}
            </>
          )
          : <span>{listing.weeklyAvailability}</span>}
      </div>
    </div>
  );
}
