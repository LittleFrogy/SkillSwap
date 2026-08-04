function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}) {
  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full border-b border-gray-200 p-4 text-left transition ${
        isSelected
          ? "bg-blue-100"
          : "hover:bg-blue-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
          {conversation.avatar}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-gray-900">
              {conversation.name}
            </h3>

            <span className="shrink-0 text-xs text-gray-500">
              {conversation.time}
            </span>
          </div>

          <p className="text-xs text-blue-600">
            Learning: {conversation.skill}
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-gray-500">
              {conversation.lastMessage}
            </p>

            {conversation.unread > 0 && (
              <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
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
