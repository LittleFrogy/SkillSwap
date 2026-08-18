import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/signin`, {
        identifier: formData.identifier,
        password: formData.password
      });
      // Store token or user ID (in real app, handle JWT)
      if (formData.rememberMe) {
        localStorage.setItem('userId', res.data.userId);
        localStorage.setItem('fullName', res.data.user?.fullName || "");
        localStorage.setItem('username', res.data.user?.username || "");
      } else {
        sessionStorage.setItem('userId', res.data.userId);
        sessionStorage.setItem('fullName', res.data.user?.fullName || "");
        sessionStorage.setItem('username', res.data.user?.username || "");
      }
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">S</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-slate-500 mt-2">Log in to continue your learning journey.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Email or Username</label>
            <input required type="text" placeholder="maya@example.com or mayachen" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all lowercase" value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-800">Password</label>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              checked={formData.rememberMe}
              onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
            />
            <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-medium">Keep me logged in</label>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70 mt-6">
            {loading ? 'Logging in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          Don't have an account? <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
