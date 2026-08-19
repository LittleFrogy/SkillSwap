import { useState } from "react";
import { BiCommentDetail } from "react-icons/bi";
import CommentSection from "./CommentSection";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\\/$/, "");

const REACTION_CONFIG = [
  {
    key: "like",
    emoji: "👍",
    label: "Like",
    activeClass:
      "bg-blue-100 text-blue-700 border-blue-300 shadow-blue-200",
    inactiveClass:
      "bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    countClass: "bg-blue-600",
  },
  {
    key: "helpful",
    emoji: "🙌",
    label: "Helpful",
    activeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-emerald-200",
    inactiveClass:
      "bg-gray-50 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
    countClass: "bg-emerald-500",
  },
  {
    key: "insightful",
    emoji: "💡",
    label: "Insightful",
    activeClass:
      "bg-violet-100 text-violet-700 border-violet-300 shadow-violet-200",
    inactiveClass:
      "bg-gray-50 text-gray-500 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200",
    countClass: "bg-violet-500",
  },
];

export default function PostCard({ post }) {
  const storedName =
    localStorage.getItem("fullName") || localStorage.getItem("username");
  const CURRENT_USER = storedName ? storedName : "Rebecca Hughes";

  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState(() => {
    const defaultReactions = { like: [], helpful: [], insightful: [] };
    if (!post.reactions) return defaultReactions;
    return {
      like: Array.isArray(post.reactions.like) ? post.reactions.like : [],
      helpful: Array.isArray(post.reactions.helpful)
        ? post.reactions.helpful
        : [],
      insightful: Array.isArray(post.reactions.insightful)
        ? post.reactions.insightful
        : [],
    };
  });

  // Burst animation state per reaction key
  const [bursting, setBursting] = useState({});

  const handleReact = async (reactionType) => {
    const wasReacted = reactions[reactionType].includes(CURRENT_USER);

    // Trigger burst animation only when activating (not deactivating)
    if (!wasReacted) {
      setBursting((prev) => ({ ...prev, [reactionType]: true }));
      setTimeout(
        () => setBursting((prev) => ({ ...prev, [reactionType]: false })),
        400
      );
    }

    // Optimistic update — mutual exclusivity (one reaction at a time)
    setReactions((prev) => {
      const next = {
        like: prev.like.filter((u) => u !== CURRENT_USER),
        helpful: prev.helpful.filter((u) => u !== CURRENT_USER),
        insightful: prev.insightful.filter((u) => u !== CURRENT_USER),
      };
      if (!wasReacted) next[reactionType].push(CURRENT_USER);
      return next;
    });

    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}/react`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType, username: CURRENT_USER }),
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setReactions(updatedPost.reactions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const totalReactions =
    (reactions.like?.length || 0) +
    (reactions.helpful?.length || 0) +
    (reactions.insightful?.length || 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
          {post.authorName.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
          <p className="text-xs text-gray-400">{post.authorRole}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {post.image && (
        <img
          src={
            post.image.startsWith("data:")
              ? post.image
              : `${API_URL}/${post.image}`
          }
          alt="Post"
          className="rounded-xl mt-4 w-full max-h-80 object-cover"
        />
      )}

      {/* Reaction summary line */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
          <span className="flex gap-0.5">
            {reactions.like.length > 0 && <span>👍</span>}
            {reactions.helpful.length > 0 && <span>🙌</span>}
            {reactions.insightful.length > 0 && <span>💡</span>}
          </span>
          <span>{totalReactions} reaction{totalReactions !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Reaction & Comment Row */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {REACTION_CONFIG.map(({ key, emoji, label, activeClass, inactiveClass }) => {
          const isActive = reactions[key].includes(CURRENT_USER);
          const count = reactions[key].length;
          const isBursting = bursting[key];
          return (
            <button
              key={key}
              onClick={() => handleReact(key)}
              title={label}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium
                transition-all duration-200 select-none
                ${isActive ? `${activeClass} shadow-md` : inactiveClass}
                ${isBursting ? "scale-110" : "scale-100"}
              `}
            >
              <span
                className={`text-base leading-none transition-transform duration-200 ${
                  isBursting ? "scale-125" : "group-hover:scale-110"
                }`}
              >
                {emoji}
              </span>
              <span className="leading-none">{label}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 ${
                    isActive ? (key === "like" ? "bg-blue-600" : key === "helpful" ? "bg-emerald-600" : "bg-violet-600") : "bg-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Comments button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200
            ${
              showComments
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            }`}
        >
          <BiCommentDetail size={16} />
          <span>Comments</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
}