import { useEffect, useState } from "react";
import axios from "axios";
import CreatePostBox from "../components/CreatePostBox";
import PostCard from "../components/PostCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Community() {
  const [posts, setPosts] = useState([]);

  // Fetch all posts from backend
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // Load posts when page opens
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="bg-[#f9fafb]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Community Forum
        </h1>
        <p className="text-gray-500 mb-6">
          Discover what the community is learning and sharing today
        </p>

        {/* Create Post Box */}
        <CreatePostBox onPostCreated={fetchPosts} />

        {/* Display Posts */}
        <div className="mt-6 space-y-4">
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">
              No posts yet. Create the first post!
            </p>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}