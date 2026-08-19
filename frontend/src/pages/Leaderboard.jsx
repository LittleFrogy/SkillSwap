import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Trophy, Medal, Star, Zap, TrendingUp, Users, BookOpen,
  Coins, Award, Crown, ChevronUp, ChevronDown, Minus, Lock
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\\/$/, "");

// ─── Badge Definitions (mirrors backend) ─────────────────────────────────────
const BADGE_DEFINITIONS = [
  { id: 'first_session',       name: 'First Step',          description: 'Completed your first session',          icon: '🚀', tier: 'bronze' },
  { id: 'five_sessions_taught',name: 'Mentor',              description: 'Taught 5 sessions',                     icon: '🎓', tier: 'silver' },
  { id: 'ten_sessions_taught', name: 'Master Teacher',      description: 'Taught 10 sessions',                    icon: '🏫', tier: 'gold'   },
  { id: 'polyglot',            name: 'Polyglot',            description: 'Listed 3+ different skills to teach',   icon: '🌐', tier: 'silver' },
  { id: 'well_endorsed',       name: 'Well Endorsed',       description: 'Received 5+ endorsements',              icon: '⭐', tier: 'silver' },
  { id: 'community_champion',  name: 'Community Champion',  description: 'Received 10+ endorsements',             icon: '🏆', tier: 'gold'   },
  { id: 'credit_collector',    name: 'Credit Collector',    description: 'Earned 20+ skill credits',              icon: '🪙', tier: 'bronze' },
  { id: 'top_earner',          name: 'Top Earner',          description: 'Earned 50+ skill credits',              icon: '💎', tier: 'gold'   },
  { id: 'consistent',          name: 'Consistent',          description: 'Sessions across 2+ different weeks',    icon: '📅', tier: 'silver' },
];

const TIER_STYLES = {
  bronze: 'from-amber-700 to-amber-500 ring-amber-400',
  silver: 'from-slate-500 to-slate-300 ring-slate-400',
  gold:   'from-yellow-500 to-amber-300 ring-yellow-400',
};

const TIER_BG = {
  bronze: 'bg-amber-50 border-amber-200 text-amber-800',
  silver: 'bg-slate-50 border-slate-300 text-slate-700',
  gold:   'bg-yellow-50 border-yellow-200 text-yellow-800',
};

// ─── Avatar helper ────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  const initials = (user?.fullName || user?.username || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];

  if (user?.profilePicture && !imgError) {
    return (
      <img
        src={user.profilePicture}
        alt={user.fullName}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white shadow`}>
      {initials}
    </div>
  );
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-xs font-black shadow-md">👑</span>;
  if (rank === 2) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white text-xs font-black shadow">🥈</span>;
  if (rank === 3) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white text-xs font-black shadow">🥉</span>;
  return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-bold">#{rank}</span>;
}

// ─── Badge Pill ───────────────────────────────────────────────────────────────
function BadgePill({ badge }) {
  return (
    <span
      title={`${badge.name}: ${badge.description}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${TIER_BG[badge.tier]}`}
    >
      {badge.icon} {badge.name}
    </span>
  );
}

// ─── Podium Card ─────────────────────────────────────────────────────────────
function PodiumCard({ user, currentUserId }) {
  const isSelf = user._id === currentUserId;
  const podiumConfig = {
    1: { height: 'h-28 md:h-36', gradient: 'from-yellow-400 to-amber-500', label: '1st', shadow: 'shadow-yellow-200' },
    2: { height: 'h-20 md:h-28', gradient: 'from-slate-400 to-slate-500', label: '2nd', shadow: 'shadow-slate-200' },
    3: { height: 'h-16 md:h-20', gradient: 'from-amber-600 to-amber-700', label: '3rd', shadow: 'shadow-amber-200' },
  }[user.rank] || {};

  return (
    <div className={`flex flex-col items-center gap-2 ${isSelf ? 'ring-2 ring-blue-400 ring-offset-2 rounded-2xl p-1' : ''}`}>
      {/* Avatar + Crown area */}
      <div className="relative">
        <Avatar user={user} size="lg" />
        {user.rank === 1 && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">👑</span>
        )}
        {isSelf && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 ring-1 ring-white" title="You" />
        )}
      </div>
      {/* Name */}
      <div className="text-center max-w-[90px] md:max-w-[120px]">
        <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{user.fullName}</p>
        <p className="text-[10px] text-slate-500 truncate">@{user.username}</p>
      </div>
      {/* Score */}
      <div className="text-center">
        <p className="text-lg font-black text-slate-800">{user.score}</p>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">pts</p>
      </div>
      {/* Podium block */}
      <div className={`w-20 md:w-28 ${podiumConfig.height} bg-gradient-to-b ${podiumConfig.gradient} rounded-t-xl flex items-center justify-center shadow-lg ${podiumConfig.shadow}`}>
        <span className="text-white font-black text-lg md:text-xl">{podiumConfig.label}</span>
      </div>
    </div>
  );
}

// ─── Badge Card (locked/unlocked) ─────────────────────────────────────────────
function BadgeCard({ badge }) {
  const tierRing = { bronze: 'ring-amber-400', silver: 'ring-slate-400', gold: 'ring-yellow-400' };
  const tierBg   = { bronze: 'from-amber-50 to-amber-100', silver: 'from-slate-50 to-slate-100', gold: 'from-yellow-50 to-amber-100' };

  return (
    <div className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200
      ${badge.earned
        ? `bg-gradient-to-b ${tierBg[badge.tier]} border-transparent ring-2 ${tierRing[badge.tier]} shadow-md hover:shadow-lg hover:-translate-y-0.5`
        : 'bg-white/60 border-slate-200 opacity-60 grayscale'
      }`}
    >
      {!badge.earned && (
        <div className="absolute top-2 right-2 text-slate-400">
          <Lock size={12} />
        </div>
      )}
      <div className="text-3xl leading-none">{badge.icon}</div>
      <div>
        <p className={`text-sm font-bold ${badge.earned ? 'text-slate-800' : 'text-slate-500'}`}>{badge.name}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{badge.description}</p>
      </div>
      {badge.earned && badge.earnedAt && (
        <p className="text-[10px] text-slate-400 mt-auto">
          Earned {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
      {!badge.earned && (
        <p className="text-[10px] text-slate-400 mt-auto">Locked</p>
      )}
    </div>
  );
}

// ─── Main Leaderboard Component ───────────────────────────────────────────────
export default function Leaderboard() {
  const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const [tab, setTab] = useState('alltime');
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [myBadges, setMyBadges] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async (activeTab) => {
    setLoading(true);
    setError('');
    try {
      const params = { tab: activeTab };
      if (currentUserId) params.userId = currentUserId;
      const res = await axios.get(`${API_URL}/api/leaderboard`, { params });
      setLeaderboard(res.data.leaderboard || []);
      setCurrentUserEntry(res.data.currentUserEntry || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchBadges = useCallback(async () => {
    if (!currentUserId) { setBadgeLoading(false); return; }
    setBadgeLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leaderboard/badges/${currentUserId}`);
      setMyBadges(res.data.badges || []);
      setMyStats(res.data.stats || null);
    } catch (err) {
      console.error(err);
      // Fallback: all locked
      setMyBadges(BADGE_DEFINITIONS.map(b => ({ ...b, earned: false, earnedAt: null })));
    } finally {
      setBadgeLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchLeaderboard(tab);
  }, [tab, fetchLeaderboard]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const earnedCount = myBadges.filter(b => b.earned).length;

  return (
    <div className="min-h-screen space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg mb-4">
          <Trophy size={28} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Global Leaderboard</h1>
        <p className="mt-2 text-slate-500 text-base max-w-md mx-auto">
          Top skill-swappers ranked by credits earned, endorsements, and sessions completed.
        </p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-white/80 backdrop-blur border border-slate-200 rounded-full p-1 shadow-sm">
          {[
            { key: 'alltime', label: 'All Time', icon: <Trophy size={14} /> },
            { key: 'weekly',  label: 'This Week', icon: <Zap size={14} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200
                ${tab === key
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-slate-400 text-sm">Loading rankings…</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-slate-500 font-medium">No rankings yet — complete a session to appear here!</p>
        </div>
      ) : (
        <>
          {/* ── Podium ── */}
          {top3.length >= 1 && (
            <div className="bg-gradient-to-b from-white/80 to-white/40 backdrop-blur border border-slate-200/60 rounded-3xl p-6 md:p-10 shadow-sm">
              <div className="flex items-end justify-center gap-4 md:gap-8">
                {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
                {[top3[1], top3[0], top3[2]].filter(Boolean).map(user => (
                  <PodiumCard key={user._id} user={user} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          )}

          {/* ── Full Rankings Table ── */}
          <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Full Rankings</h2>
              <span className="ml-auto text-xs text-slate-400">{leaderboard.length} participants</span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[3rem_1fr_6rem_6rem_6rem_7rem] gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <span>Rank</span>
                <span>User</span>
                <span className="text-center">Credits</span>
                <span className="text-center">Sessions</span>
                <span className="text-center">Endorsements</span>
                <span className="text-center">Badges</span>
              </div>

              {leaderboard.map((user, idx) => {
                const isSelf = user._id === currentUserId;
                return (
                  <div
                    key={user._id}
                    className={`grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[3rem_1fr_6rem_6rem_6rem_7rem] items-center gap-3 md:gap-4 px-4 md:px-6 py-3 transition-colors
                      ${isSelf ? 'bg-blue-50/70 border-l-4 border-l-blue-500' : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Rank */}
                    <div className="flex justify-center">
                      <RankBadge rank={user.rank} />
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} size="sm" />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelf ? 'text-blue-700' : 'text-slate-800'}`}>
                          {user.fullName} {isSelf && <span className="text-xs font-normal text-blue-500">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>

                    {/* Stats — desktop */}
                    <div className="hidden md:flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-amber-600">{user.stats.creditsEarned}</span>
                      <span className="text-[10px] text-slate-400">credits</span>
                    </div>
                    <div className="hidden md:flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-emerald-600">{user.stats.sessions}</span>
                      <span className="text-[10px] text-slate-400">sessions</span>
                    </div>
                    <div className="hidden md:flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-violet-600">{user.stats.endorsements}</span>
                      <span className="text-[10px] text-slate-400">endorsed</span>
                    </div>

                    {/* Badges preview — desktop */}
                    <div className="hidden md:flex items-center justify-center gap-1 flex-wrap">
                      {user.badges.slice(0, 3).map(b => (
                        <span key={b.id} title={`${b.name}: ${b.description}`} className="text-base cursor-help">{b.icon}</span>
                      ))}
                      {user.badgeCount > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium">+{user.badgeCount - 3}</span>
                      )}
                      {user.badgeCount === 0 && <span className="text-slate-300 text-xs">—</span>}
                    </div>

                    {/* Mobile: score chip */}
                    <div className="md:hidden flex flex-col items-end gap-0.5">
                      <span className="text-sm font-black text-slate-700">{user.score} pts</span>
                      <div className="flex gap-1">
                        {user.badges.slice(0, 2).map(b => (
                          <span key={b.id} className="text-sm">{b.icon}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Your rank sticky footer if not in top 50 visible */}
            {currentUserEntry && currentUserEntry.rank > leaderboard.length && (
              <div className="sticky bottom-0 bg-blue-600 text-white px-6 py-3 flex items-center gap-4">
                <RankBadge rank={currentUserEntry.rank} />
                <div className="flex items-center gap-3">
                  <Avatar user={currentUserEntry} size="sm" />
                  <div>
                    <p className="text-sm font-bold">You — #{currentUserEntry.rank}</p>
                    <p className="text-xs text-blue-200">{currentUserEntry.score} pts · {currentUserEntry.stats.creditsEarned} credits · {currentUserEntry.stats.sessions} sessions</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Your Rank Summary (if inside top 50) ── */}
          {currentUserEntry && currentUserEntry.rank <= 50 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4 shadow-md">
              <div className="flex items-center gap-3">
                <Avatar user={currentUserEntry} size="md" />
                <div>
                  <p className="text-white font-bold">Your Rank: #{currentUserEntry.rank}</p>
                  <p className="text-blue-200 text-sm">{currentUserEntry.score} pts total</p>
                </div>
              </div>
              <div className="flex gap-5 ml-auto">
                <div className="text-center">
                  <p className="text-white font-black text-xl">{currentUserEntry.stats.creditsEarned}</p>
                  <p className="text-blue-200 text-xs">Credits</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-xl">{currentUserEntry.stats.sessions}</p>
                  <p className="text-blue-200 text-xs">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-xl">{currentUserEntry.stats.endorsements}</p>
                  <p className="text-blue-200 text-xs">Endorsed</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-xl">{currentUserEntry.badgeCount}</p>
                  <p className="text-blue-200 text-xs">Badges</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Your Badge Gallery ── */}
      {currentUserId && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              <h2 className="text-xl font-black text-slate-900">Your Badges</h2>
            </div>
            {!badgeLoading && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
                {earnedCount} / {BADGE_DEFINITIONS.length} earned
              </span>
            )}
            <div className="ml-auto">
              {myStats && (
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span><b className="text-slate-700">{myStats.sessionsTaught}</b> taught</span>
                  <span><b className="text-slate-700">{myStats.endorsementsReceived}</b> endorsed</span>
                  <span><b className="text-slate-700">{myStats.totalEarned}</b> credits earned</span>
                </div>
              )}
            </div>
          </div>

          {badgeLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {BADGE_DEFINITIONS.map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {myBadges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
            </div>
          )}

          {!badgeLoading && earnedCount === 0 && (
            <div className="text-center py-10 rounded-2xl bg-white/60 border border-slate-200">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-slate-600 font-medium">No badges yet</p>
              <p className="text-slate-400 text-sm mt-1">
                Complete sessions and earn endorsements to unlock your first badge!
              </p>
              <Link to="/sessions" className="inline-block mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Browse Sessions →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Score Explanation ── */}
      <div className="bg-white/60 border border-slate-200/80 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Star size={15} className="text-amber-400" /> How scores are calculated
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xs">×3</span>
            <span>Credits earned</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-black text-xs">×2</span>
            <span>Endorsements received</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">×1</span>
            <span>Sessions completed</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Weekly rankings count activity from the past 7 days only. All-time counts your full history.
        </p>
      </div>
    </div>
  );
}
