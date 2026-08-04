import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/endorsements`;

export default function Endorsements() {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'demo-user';
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndorsements();
  }, [userId]);

  const fetchEndorsements = async () => {
    try {
      const res = await axios.get(`${API_URL}?userId=${userId}`);
      setEndorsements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (endorsement) => {
    try {
      const updated = await axios.put(`${API_URL}/${endorsement.id || endorsement._id}/visibility`, {
        visible: !endorsement.visible
      });
      setEndorsements((current) => current.map((item) => (item.id === updated.data.id || item._id === updated.data.id ? updated.data : item)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading endorsements...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-6 shadow-[0_30px_70px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Received endorsements</h1>
            <p className="text-sm text-slate-500">Public trust signals from completed sessions.</p>
          </div>
        </div>
      </div>

      {endorsements.length === 0 ? (
        <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-10 text-center text-slate-500 shadow-[0_20px_45px_-24px_rgba(15,23,42,0.2)]">
          No endorsements yet. Complete a session and ask your partner to endorse you.
        </div>
      ) : (
        <div className="grid gap-4">
          {endorsements.map((endorsement) => (
            <div key={endorsement.id || endorsement._id} className="bg-white/95 backdrop-blur rounded-[24px] border border-white/70 p-5 shadow-[0_22px_45px_-24px_rgba(15,23,42,0.34)]">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
                    <Sparkles size={16} /> {endorsement.skill}
                  </div>
                  <p className="text-slate-700">“{endorsement.comment}”</p>
                  <div className="mt-3 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">{endorsement.fromUserName}</span> • {new Date(endorsement.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => toggleVisibility(endorsement)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${endorsement.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} shadow-sm`}
                >
                  {endorsement.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  {endorsement.visible ? 'Visible on profile' : 'Hidden from profile'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
