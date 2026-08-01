import { useState, useEffect, useRef } from "react";
import ConversationItem from "../components/ConversationItem";
import initialConversations from "../data/conversations";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Inbox() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationList, setConversationList] = useState(initialConversations);
  const [allMessages, setAllMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  const selectedMessages = selectedConversation
    ? allMessages[selectedConversation.id] || []
    : [];

  const filteredConversations = conversationList.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setIsLoading(true);

    setConversationList((previousConversations) =>
      previousConversations.map((item) =>
        item.id === conversation.id
          ? { ...item, unread: 0 }
          : item
      )
    );

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${encodeURIComponent(
          conversation.name
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to load messages.");
      }

      const savedMessages = await response.json();

      const formattedMessages = savedMessages.map((message) => ({
        id: message._id,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt,
      }));

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [conversation.id]: formattedMessages,
      }));

      const latestMessage = savedMessages[savedMessages.length - 1];

      setConversationList((previousConversations) =>
        previousConversations.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                lastMessage: latestMessage
                  ? latestMessage.text
                  : "No messages yet",
                time: latestMessage
                  ? new Date(latestMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "",
              }
            : item
        )
      );

    } catch (error) {
      console.error(error);
      alert("The messages could not be loaded.");
    } finally {
      setIsLoading(false);
    }

  };
    
const handleSendMessage = async () => {
    if (!selectedConversation || newMessage.trim() === "") {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: "You",
          receiver: selectedConversation.name,
          text: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save message.");
      }

      const savedMessage = await response.json();

      const messageForChat = {
        id: savedMessage._id,
        sender: savedMessage.sender,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [selectedConversation.id]: [
          ...(previousMessages[selectedConversation.id] || []),
          messageForChat,
        ],
      }));

      setConversationList((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                lastMessage: savedMessage.text,
                time: "Now",
              }
            : conversation
        )
      );

      setNewMessage("");
    } catch (error) {
      console.error(error);
      alert("The message could not be saved.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) {
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete message.");
      }

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [selectedConversation.id]: previousMessages[
          selectedConversation.id
        ].filter((message) => message.id !== messageId),
      }));
    } catch (error) {
      console.error(error);
      alert("Could not delete the message.");
    }
  };

  const handleUpdateMessage = async () => {
  if (!editingMessageId || newMessage.trim() === "") {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/messages/${editingMessageId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newMessage.trim(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update message.");
    }

    const updatedMessage = await response.json();

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [selectedConversation.id]: previousMessages[
          selectedConversation.id
        ].map((message) =>
          message.id === editingMessageId
            ? {
                ...message,
                text: updatedMessage.text,
                createdAt: updatedMessage.updatedAt,
              }
            : message
        ),
      }));

      setConversationList((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                lastMessage: updatedMessage.text,
                time: "Now",
              }
            : conversation
        )
      );

      setEditingMessageId(null);
      setNewMessage("");
    } catch (error) {
      console.error(error);
      alert("The message could not be updated.");
    }
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [selectedMessages]);

  useEffect(() => {
    const loadConversationPreviews = async () => {
      try {
        const updatedConversations = await Promise.all(
          initialConversations.map(async (conversation) => {
            const response = await fetch(
              `${API_URL}/api/messages/${encodeURIComponent(
                conversation.name
              )}`
            );

            if (!response.ok) {
              return conversation;
            }

            const savedMessages = await response.json();
            const latestMessage = savedMessages[savedMessages.length - 1];

            return {
              ...conversation,
              lastMessage: latestMessage
                ? latestMessage.text
                : "No messages yet",
              time: latestMessage
                ? new Date(latestMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              unread: 0,
            };
          })
        );

        setConversationList(updatedConversations);
      } catch (error) {
        console.error("Failed to load conversation previews:", error);
      }
    };

    loadConversationPreviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="bg-blue-600 p-5 text-white">
          <h1 className="text-3xl font-bold">SkillSwap Inbox</h1>
          <p className="mt-1 text-sm text-blue-100">
            Continue learning and sharing skills
          </p>
        </div>

        <div className="grid min-h-[700px] grid-cols-1 md:grid-cols-3">
          <div className="border-r border-gray-200 bg-gray-50 md:col-span-1">
            <div className="border-b border-gray-200 p-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={
                    selectedConversation?.id === conversation.id
                  }
                  onSelect={handleSelectConversation}
                />
              ))}
            </div>
          </div>

          <div className="bg-white md:col-span-2">
            {selectedConversation ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                      {selectedConversation.avatar}
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">
                        {selectedConversation.name}
                      </h2>

                      <p className="text-sm text-gray-500">
                        Skill: {selectedConversation.skill}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-gray-500">Loading messages...</p>
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="mb-3 text-4xl">💬</div>
                        <p className="font-medium">No messages yet</p>
                        <p className="mt-1 text-sm">
                          Send the first message to {selectedConversation.name}.
                        </p>
                      </div>
                    </div>
                 ) : (
                  <>
                    {selectedMessages.map((message) => {
                      const isCurrentUser = message.sender === "You";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isCurrentUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isCurrentUser
                                ? "rounded-br-sm bg-blue-600 text-white"
                                : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
                            }`}
                          >
                            <p>{message.text}</p>

                            <p
                              className={`mt-1 text-right text-xs ${
                                isCurrentUser
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}
                            >
                              {message.createdAt
                                ? new Date(
                                    message.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </p>

                            {isCurrentUser && (
                              <div className="mt-2 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setNewMessage(message.text);
                                  }}
                                  className="text-xs text-blue-100 hover:text-white"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-xs text-blue-100 hover:text-white"
                                >
                                  Delete
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef}></div>
                  </>
                )}
                </div>

                <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-3">
                        <input
                        type="text"
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            editingMessageId
                              ? handleUpdateMessage()
                              : handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        {editingMessageId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(null);
                              setNewMessage("");
                            }}
                            className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={
                            editingMessageId
                              ? handleUpdateMessage
                              : handleSendMessage
                          }
                          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                          {editingMessageId ? "Update" : "Send"}
                        </button>
                    </div>
                </div>
                </div>
                ) : (
              <div className="hidden h-full items-center justify-center md:flex">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
                    💬
                  </div>

                  <h2 className="text-2xl font-semibold text-gray-700">
                    Select a conversation
                  </h2>

                  <p className="mt-2 text-gray-500">
                    Choose a person from your inbox to view the messages.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inbox;
