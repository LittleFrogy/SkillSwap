import { useState } from "react";
import axios from "axios";
import { BiImageAdd } from "react-icons/bi";

export default function CreatePostBox({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !image) return;

    try {
      const formData = new FormData();
      formData.append("content", content);

      if (image) {
        formData.append("image", image);
      }

      await axios.post(
        "http://localhost:5001/api/posts",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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