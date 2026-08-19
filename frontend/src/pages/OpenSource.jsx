import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Search, ExternalLink, Bookmark, BookmarkCheck, Loader2, AlertCircle,
  GitFork, Star, MessageSquare, Clock, Tag, Filter,
  Grid, Coins, BookMarked, Video, Trophy, Settings as SettingsIcon, User, MapPin, ChevronRight, Award
} from 'lucide-react';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function OpenSource() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  // User data for sidebar
  const [userData, setUserData] = useState(null);
  const [myBadges, setMyBadges] = useState([]);

  // Learn skills (for quick filters)
  const [learnSkills, setLearnSkills] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSkill, setActiveSkill] = useState('');
  const [issues, setIssues] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Saved state
  const [savedIssues, setSavedIssues] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  // Tab
  const [tab, setTab] = useState('discover'); // 'discover' | 'saved'

  // ── Fetch user profile for sidebar ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    axios.get(`${BASE_URL}/api/users/${userId}`)
      .then(res => setUserData(res.data))
      .catch(() => {});

    axios.get(`${BASE_URL}/api/leaderboard/badges/${userId}`)
      .then(res => setMyBadges(res.data.badges || []))
      .catch(() => {});

    // Fetch user's "learn" listings for quick skill filters
    axios.get(`${BASE_URL}/api/listings?userId=${userId}`)
      .then(res => {
        const learns = (res.data || []).filter(l => l.type === 'learn').map(l => l.skill);
        setLearnSkills([...new Set(learns)]);
      })
      .catch(() => {});

    // Fetch saved issues
    fetchSavedIssues();
  }, [userId]);

  const fetchSavedIssues = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/github/saved/${userId}`);
      const saved = res.data.issues || [];
      setSavedIssues(saved);
      setSavedIds(new Set(saved.map(i => i.issueId)));
    } catch { /* ignore */ }
  };

  // ── Search GitHub issues ────────────────────────────────────────────────────
  const searchIssues = async (skill, pageNum = 1, append = false) => {
    if (!skill.trim()) return;

    setLoading(true);
    setError('');
    setActiveSkill(skill);

    try {
      const res = await axios.get(`${BASE_URL}/api/github/issues`, {
        params: { skill: skill.trim(), page: pageNum }
      });

      if (append) {
        setIssues(prev => [...prev, ...res.data.issues]);
      } else {
        setIssues(res.data.issues);
      }
      setTotalCount(res.data.totalCount);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search GitHub issues.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchIssues(searchQuery, 1);
    }
  };

  const handleSkillClick = (skill) => {
    setSearchQuery(skill);
    searchIssues(skill, 1);
  };

  const loadMore = () => {
    searchIssues(activeSkill, page + 1, true);
  };

  // ── Save / Unsave ──────────────────────────────────────────────────────────
  const toggleSave = async (issue) => {
    setSavingId(issue.id);
    try {
      if (savedIds.has(issue.id)) {
        await axios.delete(`${BASE_URL}/api/github/saved/${userId}/${issue.id}`);
        setSavedIds(prev => { const next = new Set(prev); next.delete(issue.id); return next; });
        setSavedIssues(prev => prev.filter(i => i.issueId !== issue.id));
      } else {
        await axios.post(`${BASE_URL}/api/github/save`, { userId, issue });
        setSavedIds(prev => new Set(prev).add(issue.id));
        await fetchSavedIssues();
      }
    } catch { /* ignore */ }
    setSavingId(null);
  };

  // ── Time ago helper ─────────────────────────────────────────────────────────
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  // ── Label color helper ─────────────────────────────────────────────────────
  const labelColor = (label) => {
    const l = label.toLowerCase();
    if (l.includes('good first issue')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (l.includes('bug')) return 'bg-red-100 text-red-700 border-red-200';
    if (l.includes('enhancement') || l.includes('feature')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (l.includes('documentation') || l.includes('docs')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (l.includes('help')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // ── Issue Card ──────────────────────────────────────────────────────────────
  const IssueCard = ({ issue, isSaved }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all hover:border-slate-300 group">
      {/* Repo name */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <GitFork size={14} className="text-slate-400" />
          <span className="font-medium truncate max-w-[250px]">{issue.repoFullName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock size={12} />
          {timeAgo(issue.createdAt)}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-slate-900 mb-3 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
        {issue.title}
      </h3>

      {/* Body preview */}
      {issue.body && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">{issue.body}</p>
      )}

      {/* Labels */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {issue.labels.slice(0, 4).map((label, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${labelColor(label)}`}>
            {label}
          </span>
        ))}
        {issue.labels.length > 4 && (
          <span className="text-xs text-slate-400">+{issue.labels.length - 4}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <ExternalLink size={14} /> View on GitHub
        </a>

        <button
          onClick={() => toggleSave(issue)}
          disabled={savingId === issue.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-auto
            ${isSaved
              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
          {savingId === issue.id ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isSaved ? (
            <BookmarkCheck size={14} />
          ) : (
            <Bookmark size={14} />
          )}
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Comments */}
      {issue.comments > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <MessageSquare size={12} /> {issue.comments} comment{issue.comments !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  // ── Profile completeness (same as Dashboard) ───────────────────────────────
  const profileFields = ['fullName', 'username', 'email', 'jobTitle', 'tagline', 'location', 'bio', 'profilePicture'];
  const filledCount = userData ? profileFields.filter(f => userData[f] && String(userData[f]).trim()).length : 0;
  const completePct = Math.round((filledCount / profileFields.length) * 100);

  const displayIssues = tab === 'saved'
    ? savedIssues.map(si => ({ id: si.issueId, title: si.title, htmlUrl: si.htmlUrl, repoFullName: si.repoFullName, labels: si.labels, createdAt: si.createdAt, body: '', comments: 0 }))
    : issues;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-72 shrink-0 space-y-5 lg:sticky lg:top-24">
        {/* Profile Card */}
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/70 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/settings')}>
          <div className="h-16 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 relative">
            <div className="absolute -bottom-6 left-4">
              <div className="h-14 w-14 rounded-full border-[3px] border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-md">
                {userData?.profilePicture ? (
                  <img src={userData.profilePicture} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={22} className="text-slate-400" />
                )}
              </div>
            </div>
          </div>
          <div className="pt-9 px-4 pb-4">
            <h3 className="font-bold text-slate-900 text-base">{userData?.fullName || 'Loading...'}</h3>
            {userData?.jobTitle && <p className="text-sm text-slate-500 mt-0.5">{userData.jobTitle}</p>}
            {userData?.location && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={12} /> {userData.location}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all" style={{ width: `${completePct}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-500">{completePct}%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Profile completeness</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="space-y-1">
          <Link to="/matches" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/matches') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Grid size={18} /> Smart matches
          </Link>
          <Link to="/credits" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/credits') ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Coins size={18} className="text-amber-500" /> Skill credits
          </Link>
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <BookMarked size={18} /> My skill library
          </Link>
          <Link to="/sessions" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/sessions') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Video size={18} /> Sessions
          </Link>
          <Link to="/opensource" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/opensource') ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <GitFork size={18} className={isActive('/opensource') ? 'text-emerald-600' : 'text-slate-400'} /> Open Source
          </Link>
          <Link to="/leaderboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/leaderboard') ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <Trophy size={18} className="text-amber-500" /> Leaderboard
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive('/settings') ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
            <SettingsIcon size={18} /> Settings
          </Link>
        </nav>

        {/* Badges Mini Panel */}
        {myBadges.length > 0 && (
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/70 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Award size={14} /> Your badges</h4>
              <Link to="/leaderboard" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">All <ChevronRight size={12} /></Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {myBadges.filter(b => b.earned).slice(0, 6).map(badge => (
                <span key={badge.id} className="text-lg" title={badge.name}>{badge.icon}</span>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 space-y-6">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">Practice Hub</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Open Source Practice</h1>
          <p className="text-slate-500 mt-1">Find beginner-friendly issues on GitHub that match skills you're learning</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('discover')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'discover' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🔍 Discover
          </button>
          <button
            onClick={() => { setTab('saved'); fetchSavedIssues(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookmarkCheck size={14} /> Saved
            {savedIssues.length > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{savedIssues.length}</span>
            )}
          </button>
        </div>

        {tab === 'discover' && (
          <>
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a skill (e.g. React, Python, TypeScript...)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Quick skill filters */}
            {learnSkills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Filter size={12} /> Your learning skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {learnSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => handleSkillClick(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                        ${activeSkill.toLowerCase() === skill.toLowerCase()
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                <AlertCircle size={18} /> <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Results */}
            {!loading && issues.length === 0 && activeSkill && !error && (
              <div className="text-center py-16 text-slate-400">
                <GitFork size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-semibold text-slate-500">No issues found for "{activeSkill}"</p>
                <p className="text-sm mt-1">Try a different skill keyword</p>
              </div>
            )}

            {!activeSkill && issues.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="font-bold text-xl text-slate-700 mb-2">Start exploring open source</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Search for a skill or click one of your learning skills above to discover beginner-friendly GitHub issues you can contribute to.
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'saved' && displayIssues.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Bookmark size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="font-semibold text-slate-500">No saved issues yet</p>
            <p className="text-sm mt-1">Discover issues and save them for later</p>
          </div>
        )}

        {/* Loading */}
        {loading && issues.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <Loader2 size={40} className="animate-spin text-emerald-500 mb-3" />
            <p className="text-slate-500 font-medium">Searching GitHub...</p>
          </div>
        )}

        {/* Issue cards grid */}
        {displayIssues.length > 0 && (
          <>
            {tab === 'discover' && (
              <p className="text-sm text-slate-500">
                Found <strong className="text-slate-700">{totalCount.toLocaleString()}</strong> beginner-friendly issues for <strong className="text-emerald-700">"{activeSkill}"</strong>
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {displayIssues.map(issue => (
                <IssueCard
                  key={issue.id || issue.issueId}
                  issue={issue}
                  isSaved={savedIds.has(issue.id || issue.issueId)}
                />
              ))}
            </div>

            {/* Load more (discover only) */}
            {tab === 'discover' && issues.length < totalCount && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                  Load more issues
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
