import { useState, useEffect } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

// Shared reaction config
const REACTION_CONFIG = [
  {
    key: "like",
    emoji: "👍",
    label: "Like",
    activeClass: "bg-blue-100 text-blue-700 border-blue-300 shadow-blue-100",
    inactiveClass:
      "bg-gray-50 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
    badgeClass: "bg-blue-600",
  },
  {
    key: "helpful",
    emoji: "🙌",
    label: "Helpful",
    activeClass: "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-emerald-100",
    inactiveClass:
      "bg-gray-50 text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
    badgeClass: "bg-emerald-600",
  },
  {
    key: "insightful",
    emoji: "💡",
    label: "Insightful",
    activeClass: "bg-violet-100 text-violet-700 border-violet-300 shadow-violet-100",
    inactiveClass:
      "bg-gray-50 text-gray-400 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200",
    badgeClass: "bg-violet-600",
  },
];

// Compact emoji-pill reaction row (used per comment/reply)
function CommentReactionRow({ reactions, currentUser, onReact, onReplyClick, isReplying }) {
  const [bursting, setBursting] = useState({});

  const safeReactions = {
    like: Array.isArray(reactions?.like) ? reactions.like : [],
    helpful: Array.isArray(reactions?.helpful) ? reactions.helpful : [],
    insightful: Array.isArray(reactions?.insightful) ? reactions.insightful : [],
  };

  const handleClick = (key) => {
    const wasActive = safeReactions[key].includes(currentUser);
    if (!wasActive) {
      setBursting((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setBursting((prev) => ({ ...prev, [key]: false })), 400);
    }
    onReact(key);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 ml-1">
      {REACTION_CONFIG.map(({ key, emoji, label, activeClass, inactiveClass, badgeClass }) => {
        const isActive = safeReactions[key].includes(currentUser);
        const count = safeReactions[key].length;
        const isBursting = bursting[key];

        return (
          <button
            key={key}
            onClick={() => handleClick(key)}
            title={label}
            className={`
              group relative flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium
              transition-all duration-200 select-none
              ${isActive ? `${activeClass} shadow-sm` : inactiveClass}
              ${isBursting ? "scale-110" : "scale-100"}
            `}
          >
            <span
              className={`leading-none transition-transform duration-200 ${isBursting ? "scale-125" : "group-hover:scale-110"
                }`}
            >
              {emoji}
            </span>
            <span className="leading-none">{label}</span>
            {count > 0 && (
              <span
                className={`ml-0.5 min-w-[14px] h-[14px] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 ${isActive ? badgeClass : "bg-gray-400"
                  }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Reply button — matches pill style but in ghost variant */}
      <button
        onClick={onReplyClick}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-all duration-200
          ${isReplying
            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
            : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-300"
          }`}
      >
        <span>↩</span>
        <span>Reply</span>
      </button>
    </div>
  );
}

// Single Comment / Reply Card 
function CommentCard({ comment, onReact, onReply, comments, level = 0 }) {
  const storedName = localStorage.getItem("fullName") || localStorage.getItem("username");
  const CURRENT_USER = storedName ? storedName : "Rebecca Hughes";

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const replies = comments.filter((c) => c.parentCommentId === comment._id);

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment._id, replyText);
    setReplyText("");
    setIsReplying(false);
  };

  // Indentation: max 3 levels deep to avoid runaway nesting
  const indentClass =
    level > 0 ? `ml-${Math.min(level * 4, 12)} border-l-2 pl-3 border-gray-100` : "";

  return (
    <div className={`mt-3 ${indentClass}`}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm
            ${level === 0
              ? "bg-gradient-to-br from-blue-400 to-violet-500"
              : "bg-gradient-to-br from-gray-300 to-gray-400"
            }`}
        >
          {comment.authorName.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-gray-50 rounded-2xl px-3 py-2 inline-block max-w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-semibold text-gray-900">
                {comment.authorName}
              </span>
              {comment.isActiveCommenter && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                  Top Contributor
                </span>
              )}
            </div>
            <p className="text-gray-700 text-[13px] mt-0.5 leading-snug">{comment.content}</p>
          </div>

          {/* Reaction + Reply pill row */}
          <CommentReactionRow
            reactions={comment.reactions}
            currentUser={CURRENT_USER}
            onReact={(type) => onReact(comment._id, type)}
            onReplyClick={() => setIsReplying((v) => !v)}
            isReplying={isReplying}
          />

          {/* Inline reply input */}
          {isReplying && (
            <div className="mt-2 flex gap-2 pl-1">
              <input
                type="text"
                placeholder={`Reply to ${comment.authorName}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleReplySubmit(); }}
                className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-40"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-1">
          {replies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              comments={comments}
              onReact={onReact}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Comment Section (main export) 
export default function CommentSection({ postId }) {
  const storedName = localStorage.getItem("fullName") || localStorage.getItem("username");
  const CURRENT_USER = storedName ? storedName : "Rebecca Hughes";

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comments/${postId}`);
      if (res.ok) {
        let data = await res.json();

        // Mark "Top Contributor" for authors with 3+ comments on this post
        const authorCounts = {};
        data.forEach((c) => {
          authorCounts[c.authorName] = (authorCounts[c.authorName] || 0) + 1;
        });
        data = data.map((c) => ({
          ...c,
          isActiveCommenter: authorCounts[c.authorName] >= 3,
        }));

        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCreateComment = async (parentCommentId = null, content = newCommentText) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content,
          parentCommentId,
          authorName: CURRENT_USER,
          authorRole: localStorage.getItem("role") || "Learner",
        }),
      });
      if (res.ok) {
        if (!parentCommentId) setNewCommentText("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const handleReact = async (commentId, reactionType) => {
    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}/react`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType, username: CURRENT_USER }),
      });
      if (res.ok) fetchComments();
    } catch (error) {
      console.error("Failed to react to comment", error);
    }
  };

  if (loading)
    return (
      <div className="text-gray-400 text-xs mt-4 text-center animate-pulse">
        Loading comments…
      </div>
    );

  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* New comment input */}
      <div className="flex gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
          {CURRENT_USER.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Write a comment…"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateComment(null, newCommentText);
            }}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
          />
          <button
            onClick={() => handleCreateComment(null, newCommentText)}
            disabled={!newCommentText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-1">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          topLevelComments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              comments={comments}
              onReact={handleReact}
              onReply={handleCreateComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
