import { useState, useEffect } from "react";
import { BiLike, BiBulb, BiHelpCircle } from "react-icons/bi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";



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

  // Safe reaction lengths and state (handling migration from numbers to arrays)
  const likeCount = Array.isArray(comment.reactions?.like) ? comment.reactions.like.length : 0;
  const helpfulCount = Array.isArray(comment.reactions?.helpful) ? comment.reactions.helpful.length : 0;
  const insightfulCount = Array.isArray(comment.reactions?.insightful) ? comment.reactions.insightful.length : 0;
  
  const hasLiked = Array.isArray(comment.reactions?.like) && comment.reactions.like.includes(CURRENT_USER);
  const hasHelpful = Array.isArray(comment.reactions?.helpful) && comment.reactions.helpful.includes(CURRENT_USER);
  const hasInsightful = Array.isArray(comment.reactions?.insightful) && comment.reactions.insightful.includes(CURRENT_USER);

  // Basic styling for indentation based on level (max 3 levels to avoid excessive indent)
  const indentClass = level > 0 ? `ml-${Math.min(level * 4, 12)} border-l-2 pl-4 border-gray-100` : "";

  return (
    <div className={`mt-4 ${indentClass}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
          {comment.authorName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-2xl p-3 inline-block">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              {comment.authorName}
              {comment.isActiveCommenter && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                  Top Contributor
                </span>
              )}
            </h4>
            <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          </div>

          <div className="flex gap-4 mt-1 ml-2 text-xs text-gray-500">
            <button
              onClick={() => onReact(comment._id, "like")}
              className={`flex items-center gap-1 font-semibold transition ${hasLiked ? 'text-blue-600' : 'hover:text-blue-600'}`}
            >
              <BiLike size={14} /> Like {likeCount > 0 && `(${likeCount})`}
            </button>
            <button
              onClick={() => onReact(comment._id, "helpful")}
              className={`flex items-center gap-1 font-semibold transition ${hasHelpful ? 'text-green-600' : 'hover:text-green-600'}`}
            >
              <BiHelpCircle size={14} /> Helpful {helpfulCount > 0 && `(${helpfulCount})`}
            </button>
            <button
              onClick={() => onReact(comment._id, "insightful")}
              className={`flex items-center gap-1 font-semibold transition ${hasInsightful ? 'text-purple-600' : 'hover:text-purple-600'}`}
            >
              <BiBulb size={14} /> Insightful {insightfulCount > 0 && `(${insightfulCount})`}
            </button>
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="hover:text-gray-800 font-semibold"
            >
              Reply
            </button>
          </div>

          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 border rounded-full px-4 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReplySubmit();
                }}
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-2">
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
        
        // Calculate "Active Commenter" status based on comment frequency
        const authorCounts = {};
        data.forEach(c => {
          authorCounts[c.authorName] = (authorCounts[c.authorName] || 0) + 1;
        });

        data = data.map(c => ({
          ...c,
          isActiveCommenter: authorCounts[c.authorName] >= 3
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
          authorRole: localStorage.getItem("role") || "Learner"
        }),
      });

      if (res.ok) {
        if (!parentCommentId) {
          setNewCommentText(""); // Only clear top-level input
        }
        fetchComments(); // Re-fetch to get updated list and updated 'active' status
      }
    } catch (error) {
      console.error("Failed to post comment", error);
    }
  };

  const handleReact = async (commentId, reactionType) => {
    // Note: To prevent a loading jump, you can implement optimistic updates for comments as well.
    // For simplicity, we just trigger a refetch here.

    try {
      const res = await fetch(`${API_URL}/api/comments/${commentId}/react`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType, username: CURRENT_USER }),
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to react to comment", error);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm mt-4 text-center">Loading comments...</div>;

  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Top Level Input */}
      <div className="flex gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
          {CURRENT_USER.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateComment(null, newCommentText);
            }}
          />
          <button
            onClick={() => handleCreateComment(null, newCommentText)}
            disabled={!newCommentText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-2">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first!</p>
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
