import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, X, Sparkles, GraduationCap, BookOpen, MapPin, Grid, BookMarked, Users, Settings, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/listings';
const USER_ID = 'user_123'; // Hardcoded for MVP

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'teach',
    skill: '',
    proficiencyLevel: 'Intermediate',
    description: '',
    weeklyAvailability: ''
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_URL}?userId=${USER_ID}`);
      setListings(res.data);
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
        weeklyAvailability: listing.weeklyAvailability
      });
    } else {
      setEditingListing(null);
      setFormData({
        type,
        skill: '',
        proficiencyLevel: 'Intermediate',
        description: '',
        weeklyAvailability: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingListing) {
        const res = await axios.put(`${API_URL}/${editingListing._id}`, formData);
        setListings(listings.map(l => l._id === editingListing._id ? res.data : l));
      } else {
        const res = await axios.post(API_URL, { ...formData, userId: USER_ID });
        setListings([...listings, res.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving listing.");
    }
  };

  const teachListings = listings.filter(l => l.type === 'teach');
  const learnListings = listings.filter(l => l.type === 'learn');

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <div className="px-6 pb-6 relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white absolute -top-10 shadow-sm bg-white">
              <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="pt-14">
              <h2 className="text-xl font-bold text-slate-900">Maya Chen</h2>
              <p className="text-sm text-slate-500 mt-1">Product designer • Curious maker</p>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-3">
                <MapPin size={14} /> Brooklyn, New York
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-blue-600">Profile completeness</span>
                <span className="text-blue-600">82%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-white rounded-xl font-medium transition-colors">
            <Grid size={20} /> Smart matches
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 font-medium">
            <BookMarked size={20} /> My skill library
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-white rounded-xl font-medium transition-colors">
            <Users size={20} /> My exchanges
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-white rounded-xl font-medium transition-colors">
            <Settings size={20} /> Settings
          </a>
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
            className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
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
        <div>
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
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Weekly availability</label>
                    <input required type="text" placeholder="e.g. Tue & Thu evenings" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900" value={formData.weeklyAvailability} onChange={e => setFormData({...formData, weeklyAvailability: e.target.value})} />
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
      
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-4 border-t border-slate-50">
        <Clock size={14} className="text-emerald-500" /> {listing.weeklyAvailability}
      </div>
    </div>
  );
}
