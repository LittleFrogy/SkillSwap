function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}) {
  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`group relative w-full border-b border-gray-100 px-4 py-3 text-left transition-all duration-200 ${
        isSelected
          ? "bg-blue-50"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* Selected conversation indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-blue-600" />
      )}

      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-700 font-semibold text-white shadow-sm ring-2 ring-white">
            {conversation.profilePicture ? (
              <img
                src={conversation.profilePicture}
                alt={conversation.name}
                className="h-full w-full object-cover"
              />
            ) : (
              conversation.avatar
            )}
          </div>

          {conversation.isOnline && (
            <span
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"
              title="Online"
            ></span>
          )}

        </div>

        {/* Conversation information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`truncate font-semibold ${
                isSelected
                  ? "text-blue-700"
                  : "text-gray-900 group-hover:text-blue-600"
              }`}
            >
              {conversation.name}
            </h3>

            <span className="shrink-0 text-[11px] text-gray-400">
              {conversation.time}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs font-medium text-blue-500">
            Learning: {conversation.skill}
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-gray-500">
              {conversation.lastMessage}
            </p>

            {conversation.unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-sm">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default ConversationItem;
