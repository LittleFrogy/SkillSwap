import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import { Bell } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 px-8 py-0 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2 py-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">S</div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">SkillSwap</span>
        </Link>
        
        <div className="flex gap-8 h-full">
          <Link to="#" className="text-slate-500 hover:text-slate-900 font-medium py-5">Discover</Link>
          <Link to="/dashboard" className={`font-medium py-5 border-b-2 ${isActive('/dashboard') ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-900'}`}>My skills</Link>
          <Link to="#" className="text-slate-500 hover:text-slate-900 font-medium py-5">Community</Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          1,240 skills shared
        </div>
        <button className="text-slate-500 hover:text-slate-700">
          <Bell size={20} />
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
          <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f3f2ef] font-sans text-[#000000e6]">
        <Navbar />
        <main className="max-w-[1200px] mx-auto py-8 px-6">
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
