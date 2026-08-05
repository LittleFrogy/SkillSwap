import {
  BiLike,
  BiCommentDetail,
  BiShare,
} from "react-icons/bi";

export default function PostCard({ post }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">

        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
          {post.authorName.charAt(0)}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">
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

      {/* Uploaded Image */}
      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className="rounded-xl mt-4 w-full max-h-125 object-cover"
        />
      )}

      {/* Footer */}
      <div className="flex justify-around border-t mt-5 pt-3 text-gray-600">

        <button className="flex items-center gap-2 hover:text-blue-600 transition">
          <BiLike size={22} />
          <span>{post.likes}</span>
        </button>

        <button className="flex items-center gap-2 hover:text-blue-600 transition">
          <BiCommentDetail size={22} />
          <span>{post.comments}</span>
        </button>

        <button className="flex items-center gap-2 hover:text-blue-600 transition">
          <BiShare size={22} />
          <span>{post.shares}</span>
        </button>

      </div>

    </div>
  );
}