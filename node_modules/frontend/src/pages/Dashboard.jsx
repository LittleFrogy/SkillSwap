import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, Sparkles, GraduationCap, BookOpen, MapPin, Grid, BookMarked, Users, Settings as SettingsIcon, Clock, User, BadgeCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/listings`;
const USER_API_URL = `${BASE_URL}/api/users`;

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'demo-user';
  const [listings, setListings] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [endorsementForm, setEndorsementForm] = useState({ skill: '', comment: '' });
  const [submittingEndorsement, setSubmittingEndorsement] = useState(false);
  
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
    if (!localStorage.getItem('userId') && !sessionStorage.getItem('userId')) {
      localStorage.setItem('userId', 'demo-user');
    }
    fetchData();
  }, [userId, navigate]);

  const fetchData = async () => {
    try {
      const [listingsRes, userRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}?userId=${userId}`),
        axios.get(`${USER_API_URL}/${userId}`),
        axios.get(`${BASE_URL}/api/endorsements/sessions?userId=${userId}`)
      ]);
      setListings(listingsRes.data);
      setUserData(userRes.data);
      setSessions(sessionsRes.data);
      if (sessionsRes.data[0]) {
        setSelectedSession(sessionsRes.data[0].sessionId);
        setEndorsementForm((current) => ({ ...current, skill: sessionsRes.data[0].skill }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      // Auto-generate weeklyAvailability string from days and times if it was empty
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
            <span className="bg-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm text-slate-700 flex items-center gap-2"><Edit2 size={14}/> Edit Profile</span>
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
          <Link to="/matches" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
            <Grid size={18} /> Smart matches
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold transition-all">
            <BookMarked size={18} /> My skill library
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-all">
            <SettingsIcon size={18} /> Settings
          </Link>
        </nav>
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
          <button 
            onClick={() => openModal('teach')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:opacity-95 flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(37,99,235,0.7)]"
          >
            <Plus size={18} /> Add a skill
          </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
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
                  <input required type="text" placeholder="e.g. Product Design" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})} />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Proficiency level</label>
                    <select className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 appearance-none bg-white" value={formData.proficiencyLevel} onChange={e => setFormData({...formData, proficiencyLevel: e.target.value})}>
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
                        onClick={() => setFormData({...formData, days: toggleArrayItem(formData.days, day)})}
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
                        onClick={() => setFormData({...formData, times: toggleArrayItem(formData.times, time)})}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${formData.times.includes(time) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">Description</label>
                  <textarea required rows="3" placeholder="Describe what you can offer..." className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
          <button onClick={onEdit} className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={16}/></button>
          <button onClick={onDelete} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16}/></button>
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
