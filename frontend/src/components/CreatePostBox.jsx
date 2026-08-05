import { useState, useEffect } from "react";
import axios from "axios";
import { BiImageAdd } from "react-icons/bi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CreatePostBox({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [userData, setUserData] = useState(null);
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'demo-user';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/${userId}`);
        setUserData(res.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUser();
  }, [userId]);

  // Helper function to convert file to Base64 string
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !image) return;

    try {
      let base64Image = "";
      if (image) {
        base64Image = await convertToBase64(image);
      }

      await axios.post(
        `${API_URL}/api/posts`,
        {
          content,
          image: base64Image,
          authorName: userData?.fullName || "Anonymous User",
          authorRole: userData?.jobTitle || "SkillSwap Member"
        }
      );

      setContent("");
      setImage(null);

      document.getElementById("imageInput").value = "";

      onPostCreated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-5">
      <form onSubmit={handleSubmit}>
        {/* Text Box */}
        <textarea
          rows="2"
          placeholder="Share a skill, tip or question..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none border-none outline-none text-gray-800 placeholder-gray-400 text-sm"
        />

        {/* Selected Image */}
        {image && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-full max-h-56 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex justify-between items-center mt-3 border-t pt-3">
          <label
            htmlFor="imageInput"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer font-medium text-sm"
          >
            <BiImageAdd size={22} />
            <span>Add Photo</span>
          </label>

          <input
            id="imageInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
}