import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  History, 
  PlusCircle, 
  Search, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  UserCheck, 
  BookOpen, 
  GraduationCap
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CREDITS_API = `${BASE_URL}/api/credits`;

export default function SkillCredits() {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  const [creditSummary, setCreditSummary] = useState({
    skillCredits: 5,
    totalEarned: 5,
    totalSpent: 0,
    totalTransactions: 1
  });
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & Searching
  const [activeTab, setActiveTab] = useState('all'); // all, earned, spent, grant
  const [searchQuery, setSearchQuery] = useState('');

  // Exchange Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({
    role: 'teacher', // 'teacher' (I taught) or 'learner' (I learned)
    skill: '',
    partnerUserId: 'user_2',
    partnerName: 'Bob Martin',
    amount: 2,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/signin');
      return;
    }
    fetchCreditsData();
  }, [userId, navigate]);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);
      setError('');
      const [balanceRes, ledgerRes] = await Promise.all([
        axios.get(`${CREDITS_API}/balance/${userId}`),
        axios.get(`${CREDITS_API}/ledger/${userId}`)
      ]);

      setCreditSummary({
        skillCredits: balanceRes.data.skillCredits ?? 5,
        totalEarned: balanceRes.data.totalEarned ?? 5,
        totalSpent: balanceRes.data.totalSpent ?? 0,
        totalTransactions: balanceRes.data.totalTransactions ?? 0
      });
      setLedger(ledgerRes.data || []);
    } catch (err) {
      console.error("Failed to load credits data:", err);
      setError('Could not fetch latest credit data. Showing local session view.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteExchange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!exchangeForm.skill.trim()) {
      return setError('Please specify the skill name.');
    }

    setSubmitting(true);

    try {
      // If current user is the teacher: teacherId = userId, learnerId = partner
      // If current user is the learner: teacherId = partner, learnerId = userId
      const isTeacher = exchangeForm.role === 'teacher';
      const teacherId = isTeacher ? userId : exchangeForm.partnerUserId;
      const learnerId = isTeacher ? exchangeForm.partnerUserId : userId;

      const payload = {
        teacherId,
        learnerId,
        skill: exchangeForm.skill.trim(),
        amount: Number(exchangeForm.amount) || 2,
        description: exchangeForm.description.trim() || `${isTeacher ? 'Taught' : 'Learned'} ${exchangeForm.skill}`
      };

      const res = await axios.post(`${CREDITS_API}/session-exchange`, payload);

      setSuccessMsg(res.data.message || 'Skill session exchange recorded successfully!');
      setIsModalOpen(false);
      
      // Reset form
      setExchangeForm({
        role: 'teacher',
        skill: '',
        partnerUserId: 'user_2',
        partnerName: 'Bob Martin',
        amount: 2,
        description: ''
      });

      // Refresh ledger & balance
      await fetchCreditsData();
    } catch (err) {
      console.error("Exchange error:", err);
      setError(err.response?.data?.message || 'Failed to complete session credit exchange.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Ledger Entries
  const filteredLedger = ledger.filter((item) => {
    if (item.type === 'grant') return false;

    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      !q || 
      item.title?.toLowerCase().includes(q) || 
      item.skill?.toLowerCase().includes(q) || 
      item.partnerName?.toLowerCase().includes(q) || 
      item.description?.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={16} /> Transparent Skill Economy
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Skill Credits & Ledger
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Earn 2 skill credits every time you teach. Spend 2 credits when you learn. Every exchange is recorded transparently on your ledger.
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle size={18} /> Record Skill Exchange
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Main Balance Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-4xl md:text-5xl font-black text-slate-900">
                  {creditSummary.skillCredits}
                </span>
                <span className="text-lg font-bold text-amber-600 flex items-center gap-1">
                  <Coins size={20} className="fill-amber-400 text-amber-500" /> Skill Credits
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              🪙
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-slate-500 font-medium">Economy status:</span>
            <span className="font-bold text-slate-800">
              {creditSummary.skillCredits > 0 ? 'Active & Bootstrap Verified' : 'Low Balance'}
            </span>
          </div>
        </div>

        {/* Total Earned Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Earned</span>
              <div className="text-3xl font-bold text-emerald-600 mt-2 flex items-center gap-1">
                +{creditSummary.totalEarned}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Earned from teaching sessions & grants.
          </p>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
              <div className="text-3xl font-bold text-purple-600 mt-2 flex items-center gap-1">
                -{creditSummary.totalSpent}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Spent on learning sessions from mentors.
          </p>
        </div>

      </div>

      {/* HOW IT WORKS / GAMIFICATION BANNER */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Award size={20} className="text-amber-500" /> How Skill Credits Work
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900">5-Credit Welcome Grant</h4>
              <p className="text-slate-500 text-xs mt-1">Every new member receives 5 free skill credits upon registration to start learning immediately.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Earn 2 Credits by Teaching</h4>
              <p className="text-slate-500 text-xs mt-1">Teach a peer any skill to earn +2 credits into your balance and boost your community standing.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Spend 2 Credits to Learn</h4>
              <p className="text-slate-500 text-xs mt-1">Spend 2 credits per session when learning from a mentor. Transparent ledger keeps score.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION LEDGER SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        
        {/* Ledger Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History size={20} className="text-indigo-600" /> Transparent Transaction Ledger
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-0.5">
              Complete, verifiable audit trail of every credit earned, spent, or granted.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100 text-xs md:text-sm font-semibold">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'earned', label: 'Earned (+)' },
            { id: 'spent', label: 'Spent (-)' },
            { id: 'grant', label: 'Bootstrap Grants' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Ledger List Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading transparent ledger history...</div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Coins size={40} className="mx-auto text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">No transaction records found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLedger.map((tx) => (
              <LedgerRow key={tx._id || tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>

      {/* RECORD SKILL EXCHANGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-amber-600 text-xs font-bold uppercase tracking-wider">
                    Credit Exchange Engine
                  </span>
                  <h3 className="font-bold text-2xl text-slate-900 mt-0.5">Record Skill Exchange</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleExecuteExchange} className="space-y-5">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    My Role in Session
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setExchangeForm({ ...exchangeForm, role: 'teacher' })}
                      className={`py-2.5 rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                        exchangeForm.role === 'teacher'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap size={16} /> I Taught (+2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExchangeForm({ ...exchangeForm, role: 'learner' })}
                      className={`py-2.5 rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                        exchangeForm.role === 'learner'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen size={16} /> I Learned (-2)
                    </button>
                  </div>
                </div>

                {/* Skill Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Skill Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Python Async, React Hooks, Figma UI"
                    value={exchangeForm.skill}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, skill: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm"
                  />
                </div>

                {/* Partner Name / ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Peer Partner Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Bob Martin, Mina Patel"
                    value={exchangeForm.partnerName}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, partnerName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Credit Amount
                  </label>
                  <input
                    type="number"
                    value="2"
                    readOnly
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-100 text-slate-900 text-sm font-semibold cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Standard session exchange is 2 skill credits.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Notes / Description
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Brief description of what was taught or learned..."
                    value={exchangeForm.description}
                    onChange={(e) => setExchangeForm({ ...exchangeForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold rounded-xl text-sm shadow-md hover:opacity-95 disabled:opacity-70 transition-all"
                  >
                    {submitting ? 'Processing Exchange...' : 'Confirm Exchange'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponent: Ledger Entry Row
function LedgerRow({ tx }) {
  const isEarned = tx.type === 'earned';
  const isSpent = tx.type === 'spent';
  const isGrant = tx.type === 'grant';

  const badgeStyles = isEarned
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isSpent
    ? 'bg-purple-50 text-purple-700 border-purple-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';

  const amountColor = isEarned || isGrant ? 'text-emerald-600' : 'text-purple-600';
  const sign = isEarned || isGrant ? '+' : '-';

  const formattedDate = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recently';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-all gap-4">
      <div className="flex items-start gap-3.5">
        {/* Type Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${badgeStyles}`}>
          {isEarned && <ArrowUpRight size={20} />}
          {isSpent && <ArrowDownLeft size={20} />}
          {isGrant && <Coins size={20} />}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm md:text-base">{tx.title}</h4>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider ${badgeStyles}`}>
              {tx.type}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {tx.description || (tx.skill ? `Skill: ${tx.skill}` : '')}
            {tx.partnerName ? ` • Partner: ${tx.partnerName}` : ''}
          </p>

          <span className="text-[11px] text-slate-400 mt-1 block">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Right Column: Amount & Balance Snapshot */}
      <div className="text-left sm:text-right shrink-0">
        <div className={`text-lg md:text-xl font-extrabold ${amountColor}`}>
          {sign}{tx.amount} credits
        </div>
        <div className="text-xs font-medium text-slate-400 mt-0.5">
          Balance after: <span className="font-bold text-slate-700">{tx.balanceAfter} credits</span>
        </div>
      </div>
    </div>
  );
}
