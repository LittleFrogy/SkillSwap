import { useEffect, useState } from "react";
import axios from "axios";
import CreatePostBox from "../components/CreatePostBox";
import PostCard from "../components/PostCard";
import { TrendingUp, Award, Star, Users, Zap, ChevronRight } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Trending Skills Sidebar Card

const SKILL_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-200" },
  { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", ring: "ring-violet-200" },
  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
  { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", ring: "ring-rose-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500", ring: "ring-cyan-200" },
];

function TrendingSkillsCard({ listings }) {
  // Tally skill frequency across all teach listings
  const skillCounts = {};
  listings
    .filter((l) => l.type === "teach")
    .forEach((l) => {
      skillCounts[l.skill] = (skillCounts[l.skill] || 0) + 1;
    });

  const trending = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill, count], i) => ({ skill, count, color: SKILL_COLORS[i % SKILL_COLORS.length] }));

  // Fallback static data if DB is empty
  const fallback = [
    { skill: "React Development", count: 12, color: SKILL_COLORS[0] },
    { skill: "Python & ML", count: 9, color: SKILL_COLORS[1] },
    { skill: "UI/UX Design", count: 8, color: SKILL_COLORS[2] },
    { skill: "Node.js", count: 7, color: SKILL_COLORS[3] },
    { skill: "Data Analysis", count: 5, color: SKILL_COLORS[4] },
    { skill: "TypeScript", count: 4, color: SKILL_COLORS[5] },
  ];

  const skills = trending.length >= 3 ? trending : fallback;
  const maxCount = Math.max(...skills.map((s) => s.count));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-sm">
          <TrendingUp size={14} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900 text-sm">Trending Skills</h2>
      </div>

      <div className="px-4 pb-4 space-y-2.5">
        {skills.map(({ skill, count, color }, idx) => (
          <div key={skill} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot} shrink-0`} />
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition truncate max-w-[140px]">
                  {skill}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 ml-1">{count} teacher{count !== 1 ? "s" : ""}</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${color.dot} transition-all duration-700`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5">
        <a
          href="/matches"
          className="flex items-center justify-between text-xs text-blue-600 font-medium hover:text-blue-700 transition"
        >
          <span>Find skill matches</span>
          <ChevronRight size={13} />
        </a>
      </div>
    </div>
  );
}

// Popular Instructors Sidebar Card

const AVATAR_GRADIENTS = [
  "from-blue-400 to-violet-500",
  "from-emerald-400 to-cyan-500",
  "from-orange-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-fuchsia-500",
];

function PopularInstructorsCard({ posts }) {
  // Derive popular instructors from post authors (by total reactions)
  const authorStats = {};
  posts.forEach((p) => {
    const name = p.authorName;
    if (!authorStats[name]) {
      authorStats[name] = { name, role: p.authorRole, posts: 0, reactions: 0 };
    }
    authorStats[name].posts += 1;
    const r = p.reactions || {};
    authorStats[name].reactions +=
      (Array.isArray(r.like) ? r.like.length : 0) +
      (Array.isArray(r.helpful) ? r.helpful.length : 0) +
      (Array.isArray(r.insightful) ? r.insightful.length : 0);
  });

  const instructors = Object.values(authorStats)
    .sort((a, b) => b.reactions - a.reactions || b.posts - a.posts)
    .slice(0, 5)
    .map((inst, i) => ({ ...inst, gradient: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }));

  // Fallback
  const fallback = [
    { name: "Alex Chen", role: "React Instructor", posts: 14, reactions: 47, gradient: AVATAR_GRADIENTS[0] },
    { name: "Priya Sharma", role: "Data Scientist", posts: 11, reactions: 38, gradient: AVATAR_GRADIENTS[1] },
    { name: "Marcus Kim", role: "UX Designer", posts: 8, reactions: 29, gradient: AVATAR_GRADIENTS[2] },
    { name: "Sofia Martins", role: "ML Engineer", posts: 7, reactions: 24, gradient: AVATAR_GRADIENTS[3] },
    { name: "James Okafor", role: "Backend Dev", posts: 5, reactions: 18, gradient: AVATAR_GRADIENTS[4] },
  ];

  const list = instructors.length >= 2 ? instructors : fallback;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
          <Award size={14} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900 text-sm">Popular Instructors</h2>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {list.map(({ name, role, posts, reactions, gradient }, idx) => (
          <div
            key={name}
            className="flex items-center gap-3 group cursor-default"
          >
            {/* Rank */}
            <span className="text-[11px] font-bold text-gray-300 w-4 shrink-0 text-center">
              {idx + 1}
            </span>

            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ring-2 ring-white`}
            >
              {name.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-gray-900 transition">
                {name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{role || "Contributor"}</p>
            </div>

            {/* Reaction badge */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-semibold text-gray-500">{reactions}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Zap size={11} className="text-amber-400" />
          <span>Ranked by community reactions</span>
        </div>
      </div>
    </div>
  );
}

// Quick Stats Card

function QuickStatsCard({ posts }) {
  const totalReactions = posts.reduce((sum, p) => {
    const r = p.reactions || {};
    return (
      sum +
      (Array.isArray(r.like) ? r.like.length : 0) +
      (Array.isArray(r.helpful) ? r.helpful.length : 0) +
      (Array.isArray(r.insightful) ? r.insightful.length : 0)
    );
  }, 0);

  const uniqueAuthors = new Set(posts.map((p) => p.authorName)).size;

  const stats = [
    { label: "Posts", value: posts.length, icon: <Zap size={14} />, color: "text-blue-600" },
    { label: "Members", value: uniqueAuthors, icon: <Users size={14} />, color: "text-violet-600" },
    { label: "Reactions", value: totalReactions, icon: <Star size={14} />, color: "text-amber-500" },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 rounded-2xl p-4 text-white shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
        Community This Week
      </p>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-extrabold text-white">{value}</p>
            <p className="text-[10px] text-white/70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Community Page

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/listings`);
      setListings(res.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/60 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Community Forum
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover what the community is learning and sharing today
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          <CreatePostBox onPostCreated={fetchPosts} />

          <div className="mt-5 space-y-0">
            {posts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-medium">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-72 shrink-0 space-y-4 sticky top-6 hidden lg:block">
          <QuickStatsCard posts={posts} />
          <TrendingSkillsCard listings={listings} />
          <PopularInstructorsCard posts={posts} />
        </aside>
      </div>
    </div>
  );
}