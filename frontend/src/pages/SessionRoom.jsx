import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, LogOut, Loader, AlertCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, "");

export default function SessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/sessions/${sessionId}`);
        setSessionData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load session details.');
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Connecting to secure video room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Room Unavailable</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/matches')} className="px-6 py-2 bg-slate-900 text-white rounded-full font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Session Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-t-3xl border border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Video size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Live Session: {sessionData?.skill}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure WebRTC Connection
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/matches')}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold text-sm hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />
          Leave Room
        </button>
      </div>

      {/* Video Iframe Container */}
      <div className="flex-1 w-full bg-slate-900 rounded-b-3xl overflow-hidden shadow-xl border-x border-b border-slate-200 relative">
        {sessionData?.videoRoomUrl ? (
          <iframe 
            className="w-full h-full border-none"
            src={sessionData.videoRoomUrl}
            allow="camera; microphone; fullscreen; display-capture"
            title="SkillSwap Video Session"
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>No video URL generated for this session.</p>
          </div>
        )}
      </div>
    </div>
  );
}
