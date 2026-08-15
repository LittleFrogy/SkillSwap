import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Upload, LogOut } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users`;

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    tagline: '',
    location: '',
    bio: '',
    profilePicture: '',
    preferredLanguage: 'en'
  });

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [userId, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      setFormData({
        fullName: res.data.fullName || '',
        jobTitle: res.data.jobTitle || '',
        tagline: res.data.tagline || '',
        location: res.data.location || '',
        bio: res.data.bio || '',
        profilePicture: res.data.profilePicture || '',
        preferredLanguage: res.data.preferredLanguage || 'en'
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePicture: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API_URL}/${userId}`, formData);
      navigate('/dashboard'); // Go back to dashboard after saving
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    navigate('/signin');
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8 mb-20">
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Update your personal information to get better matches.</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-2 transition-colors">
          <LogOut size={18} /> Log out
        </button>
      </div>

      <div className="p-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex gap-6 items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 shrink-0 relative group cursor-pointer"
            >
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <User size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-800 mb-2">Profile Picture URL</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Or paste an image URL here..." className="flex-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.profilePicture} onChange={e => setFormData({...formData, profilePicture: e.target.value})} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
                  <Upload size={18} /> Upload
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Upload a local file or paste a direct link. Max size 5MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Full Name</label>
            <input required type="text" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Job Title</label>
              <input type="text" placeholder="e.g. Product Designer" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Personal Tagline</label>
              <input type="text" placeholder="e.g. Curious maker & coffee lover" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Location</label>
            <input type="text" placeholder="e.g. Brooklyn, New York" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Preferred Chat Language
            </label>

            <select
              value={formData.preferredLanguage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferredLanguage: e.target.value
                })
              }
              className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="en">English</option>
              <option value="bn">Bangla</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ar">Arabic</option>
              <option value="pt">Portuguese</option>
              <option value="it">Italian</option>
              <option value="tr">Turkish</option>
              <option value="ur">Urdu</option>
              <option value="zh-CN">Chinese (Simplified)</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Incoming chat messages can be translated into this language.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Short Bio</label>
            <textarea rows="4" placeholder="Tell the community a bit about yourself..." className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-full">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-70">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
