import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center">S</div>
            SkillSwap
          </div>
          <div className="flex gap-4">
            <a href="/dashboard" className="text-slate-600 hover:text-primary-600 font-medium">Dashboard</a>
          </div>
        </nav>
        
        <main className="max-w-6xl mx-auto p-6">
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
