import { useState } from "react";
import {
  BiLike,
  BiCommentDetail,
  BiBulb,
  BiHelpCircle
} from "react-icons/bi";
import CommentSection from "./CommentSection";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const storedName = localStorage.getItem("fullName") || localStorage.getItem("username");
const CURRENT_USER = storedName ? storedName : "Rebecca Hughes";

export default function PostCard({ post }) {
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState(() => {
    const defaultReactions = { like: [], helpful: [], insightful: [] };
    if (!post.reactions) return defaultReactions;
    
    // Ensure all properties are arrays (handling migration from numbers)
    return {
      like: Array.isArray(post.reactions.like) ? post.reactions.like : [],
      helpful: Array.isArray(post.reactions.helpful) ? post.reactions.helpful : [],
      insightful: Array.isArray(post.reactions.insightful) ? post.reactions.insightful : []
    };
  });

  const handleReact = async (reactionType) => {
    // Optimistic update
    setReactions(prev => {
      const newReactions = {
        like: [...prev.like].filter(u => u !== CURRENT_USER),
        helpful: [...prev.helpful].filter(u => u !== CURRENT_USER),
        insightful: [...prev.insightful].filter(u => u !== CURRENT_USER),
      };

      const hasReacted = prev[reactionType].includes(CURRENT_USER);
      if (!hasReacted) {
        newReactions[reactionType].push(CURRENT_USER);
      }
      
      return newReactions;
    });

    try {
      const res = await fetch(`${API_URL}/api/posts/${post._id}/react`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType, username: CURRENT_USER }),
      });
      
      if (!res.ok) {
        console.error("Failed to react");
      } else {
        const updatedPost = await res.json();
        setReactions(updatedPost.reactions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
          {post.authorName.charAt(0)}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {post.authorName}
          </h3>
          <p className="text-sm text-gray-500">
            {post.authorRole}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-800 whitespace-pre-wrap">
        {post.content}
      </p>

      {post.image && (
        <img
          src={post.image.startsWith('data:') ? post.image : `${API_URL}/${post.image}`}
          alt="Post"
          className="rounded-xl mt-4 w-full max-h-125 object-cover"
        />
      )}

      {/* Footer */}
      <div className="flex flex-wrap justify-between items-center border-t mt-5 pt-3 text-gray-600 gap-y-2">
        
        <div className="flex gap-4">
          <button 
            onClick={() => handleReact('like')}
            className={`flex items-center gap-1.5 transition ${reactions.like.includes(CURRENT_USER) ? 'text-blue-600' : 'hover:text-blue-600'}`}
          >
            <BiLike size={20} />
            <span className="text-sm font-medium">{reactions.like.length || 0}</span>
          </button>
          
          <button 
            onClick={() => handleReact('helpful')}
            className={`flex items-center gap-1.5 transition ${reactions.helpful.includes(CURRENT_USER) ? 'text-green-600' : 'hover:text-green-600'}`}
          >
            <BiHelpCircle size={20} />
            <span className="text-sm font-medium">{reactions.helpful.length || 0}</span>
          </button>

          <button 
            onClick={() => handleReact('insightful')}
            className={`flex items-center gap-1.5 transition ${reactions.insightful.includes(CURRENT_USER) ? 'text-purple-600' : 'hover:text-purple-600'}`}
          >
            <BiBulb size={20} />
            <span className="text-sm font-medium">{reactions.insightful.length || 0}</span>
          </button>
        </div>

        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 transition ${showComments ? 'text-blue-600' : 'hover:text-blue-600'}`}
        >
          <BiCommentDetail size={20} />
          <span className="text-sm font-medium">Comments</span>
        </button>

      </div>

      {/* Comment Section */}
      {showComments && (
        <CommentSection postId={post._id} />
      )}

    </div>
  );
}