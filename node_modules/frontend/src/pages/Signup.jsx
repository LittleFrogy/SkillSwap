import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength logic
  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };

  const strength = checkStrength(formData.password);

  const getStrengthColor = () => {
    if (formData.password.length === 0) return 'bg-slate-200';
    if (strength <= 2) return 'bg-red-500';
    if (strength === 3 || strength === 4) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    // Check valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setError('Please enter a valid email address');
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      // Redirect to onboarding after successful signup
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">S</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</h2>
          <p className="text-slate-500 mt-2">Start exchanging skills with the community.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Full Name</label>
            <input required type="text" placeholder="Maya Chen" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Username</label>
            <input required type="text" placeholder="mayachen" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all lowercase" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Email Address</label>
            <input required type="email" placeholder="maya@example.com" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all lowercase" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <div className="mt-3">
                <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className={`h-full flex-1 transition-colors duration-300 ${strength >= level ? getStrengthColor() : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2 flex justify-between">
                  <span>{strength <= 2 ? 'Weak' : strength <= 4 ? 'Good' : 'Strong'}</span>
                  <span>Use 8+ chars, mix of cases & numbers</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Confirm Password</label>
            <input required type="password" placeholder="••••••••" className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70 mt-4">
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          Already have an account? <Link to="/signin" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
