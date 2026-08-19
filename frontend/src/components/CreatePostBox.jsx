import { useState, useRef } from "react";
import axios from "axios";
import { Image, X } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function CreatePostBox({ onPostCreated }) {
  const storedName = localStorage.getItem("fullName") || localStorage.getItem("username");
  const CURRENT_USER = storedName ? storedName : "Rebecca Hughes";
  const CURRENT_ROLE = localStorage.getItem("role") || "Learner";

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setPosting(true);

    let base64Image = "";
    if (image) {
      base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image);
      });
    }

    try {
      await axios.post(`${API_URL}/api/posts`, {
        authorName: CURRENT_USER,
        authorRole: CURRENT_ROLE,
        content,
        image: base64Image,
      });
      setContent("");
      setImage(null);
      setFocused(false);
      onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const canPost = content.trim() || image;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        focused
          ? "border-blue-200 shadow-md shadow-blue-50"
          : "border-gray-100 shadow-sm"
      }`}
    >
      <form onSubmit={handleSubmit}>
        {/* Top row: avatar + input */}
        <div className="flex items-start gap-3 p-4">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5 shadow-sm">
            {CURRENT_USER.charAt(0).toUpperCase()}
          </div>

          {/* Textarea */}
          <textarea
            rows={focused ? 3 : 2}
            placeholder="Share a skill, tip or question…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            className="flex-1 resize-none border-none outline-none text-gray-800 placeholder-gray-400 text-sm leading-relaxed bg-transparent pt-1"
          />
        </div>

        {/* Image preview */}
        {image && (
          <div className="relative mx-4 mb-3">
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        )}

        {/* Bottom bar — only visible when focused or has content */}
        {(focused || canPost) && (
          <div className="flex items-center justify-between px-4 pb-3 pt-0 border-t border-gray-100 mt-0">
            {/* Photo */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition text-xs font-medium py-1 px-2 rounded-lg hover:bg-blue-50"
            >
              <Image size={15} />
              <span>Photo</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />

            {/* Post button */}
            <button
              type="submit"
              disabled={!canPost || posting}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}