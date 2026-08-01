import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

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

  const openModal = (listing = null) => {
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
        type: 'teach',
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
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
          <p className="text-slate-500">Manage what you teach and what you want to learn.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add Listing
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Teach Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            I Can Teach
          </h2>
          {teachListings.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500">
              You haven't added any skills to teach yet.
            </div>
          ) : (
            teachListings.map(l => (
              <ListingCard key={l._id} listing={l} onEdit={() => openModal(l)} onDelete={() => handleDelete(l._id)} />
            ))
          )}
        </div>

        {/* Learn Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            I Want To Learn
          </h2>
          {learnListings.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500">
              You haven't added anything you want to learn yet.
            </div>
          ) : (
            learnListings.map(l => (
              <ListingCard key={l._id} listing={l} onEdit={() => openModal(l)} onDelete={() => handleDelete(l._id)} />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingListing ? 'Edit Listing' : 'New Listing'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.type === 'teach'} onChange={() => setFormData({...formData, type: 'teach'})} />
                    I can teach
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.type === 'learn'} onChange={() => setFormData({...formData, type: 'learn'})} />
                    I want to learn
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skill</label>
                <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Proficiency</label>
                <select className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.proficiencyLevel} onChange={e => setFormData({...formData, proficiencyLevel: e.target.value})}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weekly Availability</label>
                <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.weeklyAvailability} onChange={e => setFormData({...formData, weeklyAvailability: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required rows="2" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onEdit, onDelete }) {
  const isTeach = listing.type === 'teach';
  return (
    <div className={`p-5 rounded-xl border ${isTeach ? 'bg-blue-50/50 border-blue-100' : 'bg-purple-50/50 border-purple-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-slate-900">{listing.skill}</h3>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-md shadow-sm border border-slate-200"><Edit2 size={14}/></button>
          <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-600 bg-white rounded-md shadow-sm border border-slate-200"><Trash2 size={14}/></button>
        </div>
      </div>
      <div className="inline-block px-2.5 py-1 rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm border border-slate-200 mb-3">
        {listing.proficiencyLevel}
      </div>
      <p className="text-sm text-slate-600 mb-4">{listing.description}</p>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <span className="font-medium text-slate-700">Availability:</span> {listing.weeklyAvailability}
      </div>
    </div>
  );
}
