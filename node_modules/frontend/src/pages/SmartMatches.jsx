import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, MessageCircle, User, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SmartMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'demo-user';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/matches?userId=${userId}`);
        setMatches(res.data);
      } catch (err) {
        console.error("Failed to fetch matches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-8 shadow-[0_30px_70px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Smart Matches</h1>
            <p className="text-slate-500 text-lg">We analyzed skills, proficiencies, and needs to find your perfect learning partners.</p>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white/95 backdrop-blur rounded-[28px] border border-white/70 p-12 text-center text-slate-500 shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ArrowRightLeft size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No matches found yet</h3>
          <p>Add more skills you want to learn or teach to your Dashboard to generate matches!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <MatchCard key={match.userId} match={match} onMessage={() => navigate('/inbox')} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, onMessage }) {
  const { user, compatibilityScore, matchedSkills } = match;
  
  // Calculate stroke dasharray for the score circle (circumference = 2 * pi * r)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compatibilityScore / 100) * circumference;
  
  let scoreColor = "text-emerald-500";
  if (compatibilityScore < 60) scoreColor = "text-yellow-500";
  if (compatibilityScore < 40) scoreColor = "text-slate-400";

  return (
    <div className="bg-white/95 backdrop-blur rounded-[24px] border border-white/70 p-6 shadow-[0_22px_45px_-24px_rgba(15,23,42,0.34)] hover:shadow-[0_25px_50px_-20px_rgba(15,23,42,0.4)] transition-all flex flex-col h-full">
      
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-50 shadow-sm bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user?.fullName} className="w-full h-full object-cover" />
            ) : (
              <User size={28} />
            )}
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 line-clamp-1">{user?.fullName || 'Anonymous User'}</h3>
            <p className="text-sm text-slate-500 font-medium line-clamp-1">{user?.jobTitle || 'SkillSwap Member'}</p>
          </div>
        </div>

        {/* Score Circle */}
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={radius} className="stroke-slate-100" strokeWidth="6" fill="none" />
            <circle 
              cx="28" cy="28" r={radius} 
              className={`stroke-current ${scoreColor} transition-all duration-1000 ease-out`} 
              strokeWidth="6" fill="none" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute font-bold text-slate-700 text-sm">{compatibilityScore}%</div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="flex-1 space-y-4 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        
        {matchedSkills.theyCanTeachYou.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">They can teach you</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.theyCanTeachYou.map(skill => (
                <span key={skill} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold capitalize">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {matchedSkills.theyCanTeachYou.length > 0 && matchedSkills.youCanTeachThem.length > 0 && (
          <div className="border-t border-slate-200/60 my-2"></div>
        )}

        {matchedSkills.youCanTeachThem.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">You can teach them</p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.youCanTeachThem.map(skill => (
                <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold capitalize">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
      </div>

      {/* Action */}
      <button 
        onClick={onMessage}
        className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-semibold hover:opacity-90 flex items-center justify-center gap-2 shadow-md transition-opacity"
      >
        <MessageCircle size={18} /> Send Message
      </button>

    </div>
  );
}
