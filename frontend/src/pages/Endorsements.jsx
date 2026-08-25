import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ShieldCheck, Trash2 } from 'lucide-react';

const API_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, "")}/api/endorsements`;

export default function Endorsements() {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'given'

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }
    fetchEndorsements(activeTab);
  }, [userId, navigate, activeTab]);

  const fetchEndorsements = async (tab) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?userId=${userId}&type=${tab}`);
      setEndorsements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (endorsement) => {
    if (!window.confirm("Are you sure you want to delete this endorsement?")) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/${endorsement.id || endorsement._id}?userId=${userId}`);
      setEndorsements((current) => current.filter((item) => (item.id || item._id) !== (endorsement.id || endorsement._id)));
    } catch (err) {
      console.error(err);
      alert('Failed to delete endorsement');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-6 shadow-[0_30px_70px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Endorsements</h1>
            <p className="text-sm text-slate-500">Public trust signals from completed sessions.</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('received')}
            className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'received' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Received ({activeTab === 'received' && !loading ? endorsements.length : '...'})
          </button>
          <button 
            onClick={() => setActiveTab('given')}
            className={`pb-3 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'given' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Given ({activeTab === 'given' && !loading ? endorsements.length : '...'})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-slate-500 text-center">Loading endorsements...</div>
      ) : endorsements.length === 0 ? (
        <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-10 text-center text-slate-500 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)]">
          No endorsements {activeTab} yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {endorsements.map((endorsement) => (
            <div key={endorsement.id || endorsement._id} className="bg-white/95 backdrop-blur rounded-[24px] border border-white/70 p-5 shadow-[0_22px_45px_-24px_rgba(15,23,42,0.34)]">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm bg-emerald-50 px-2 py-1 rounded-md">
                      <Sparkles size={14} /> {endorsement.skill}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">“{endorsement.comment}”</p>
                  <div className="mt-3 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">
                      {activeTab === 'received' ? `From ${endorsement.fromUserName}` : `To ${endorsement.toUserName}`} 
                    </span> • {new Date(endorsement.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {activeTab === 'given' && (
                  <button
                    onClick={() => handleDelete(endorsement)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm`}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
