import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConversationItem from "../components/ConversationItem";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Inbox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationList, setConversationList] = useState([]);
  const [allMessages, setAllMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [searchParams] = useSearchParams();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentUserId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");

  const selectedMessages = selectedConversation
    ? allMessages[selectedConversation.id] || []
    : [];

  const filteredConversations = conversationList.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createAvatar = (fullName) => {
    if (!fullName) {
      return "U";
    }

    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((namePart) => namePart[0].toUpperCase())
      .join("");
  };

  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return new Date(dateValue).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessages = (messages) =>
    messages.map((message) => ({
      id: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      text: message.text,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      attachment: message.attachment || null,
    }));

  const loadConversationMessages = async (otherUserId) => {
    const response = await fetch(
      `${API_URL}/api/messages/conversation/${currentUserId}/${otherUserId}`
    );

    if (!response.ok) {
      throw new Error("Failed to load messages.");
    }

    return response.json();
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setEditingMessageId(null);
    setNewMessage("");
    setPendingAttachment(null);
    setIsLoading(true);

    setConversationList((previousConversations) =>
      previousConversations.map((item) =>
        item.id === conversation.id
          ? { ...item, unread: 0 }
          : item
      )
    );

    try {
      const savedMessages = await loadConversationMessages(
        conversation.id
      );

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [conversation.id]: formatMessages(savedMessages),
      }));

      const latestMessage =
        savedMessages[savedMessages.length - 1];

      setConversationList((previousConversations) =>
        previousConversations.map((item) =>
          item.id === conversation.id
            ? {
              ...item,
              lastMessage: latestMessage
                ? latestMessage.text
                : "No messages yet",
              time: latestMessage
                ? formatTime(latestMessage.createdAt)
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
    if (
      !currentUserId ||
      !selectedConversation ||
      (newMessage.trim() === "" && !pendingAttachment)
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedConversation.id,
          text: newMessage.trim(),
          attachment: pendingAttachment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to save message."
        );
      }

      const savedMessage = await response.json();

      const messageForChat = {
        id: savedMessage._id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
        attachment: savedMessage.attachment || null,
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
              lastMessage: savedMessage.text || savedMessage.attachment?.name || "Attachment",
              time: "Now",
            }
            : conversation
        )
      );

      setNewMessage("");
      setPendingAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "The message could not be saved.");
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose a file smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      const data = await fileToDataUrl(file);
      setPendingAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        data,
      });
    } catch (error) {
      console.error(error);
      alert("Could not attach that file.");
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const voiceFile = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });

        if (voiceFile.size > 5 * 1024 * 1024) {
          alert("Voice note is too large. Please record a shorter note.");
        } else {
          const data = await fileToDataUrl(voiceFile);
          setPendingAttachment({
            name: voiceFile.name,
            type: voiceFile.type,
            data,
          });
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone permission is needed to record a voice note.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const renderAttachment = (attachment, isCurrentUser) => {
    if (!attachment?.data) return null;

    if (attachment.type?.startsWith("image/")) {
      return (
        <a href={attachment.data} download={attachment.name} className="block">
          <img
            src={attachment.data}
            alt={attachment.name}
            className="mb-2 max-h-64 max-w-full rounded-lg object-cover"
          />
        </a>
      );
    }

    if (attachment.type?.startsWith("audio/")) {
      return (
        <div className="mb-2">
          <audio controls src={attachment.data} className="max-w-full" />
          <a
            href={attachment.data}
            download={attachment.name}
            className={`mt-1 block text-xs underline ${
              isCurrentUser ? "text-blue-100" : "text-blue-600"
            }`}
          >
            Download voice note
          </a>
        </div>
      );
    }

    return (
      <a
        href={attachment.data}
        download={attachment.name}
        className={`mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
          isCurrentUser
            ? "border-blue-300 bg-blue-500 text-white"
            : "border-gray-200 bg-gray-50 text-blue-600"
        }`}
      >
        <span>📎</span>
        <span className="break-all">{attachment.name}</span>
      </a>
    );
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete || !currentUserId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentUserId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete message."
        );
      }

      const remainingMessages = (
        allMessages[selectedConversation.id] || []
      ).filter((message) => message.id !== messageId);

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [selectedConversation.id]: remainingMessages,
      }));

      const latestMessage =
        remainingMessages[remainingMessages.length - 1];

      setConversationList((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
              ...conversation,
              lastMessage: latestMessage
                ? latestMessage.text
                : "No messages yet",
              time: latestMessage
                ? formatTime(latestMessage.createdAt)
                : "",
            }
            : conversation
        )
      );

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setNewMessage("");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not delete the message.");
    }
  };

  const handleUpdateMessage = async () => {
    if (
      !currentUserId ||
      !editingMessageId ||
      newMessage.trim() === ""
    ) {
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
            currentUserId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update message."
        );
      }

      const updatedMessage = await response.json();

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [selectedConversation.id]: (
          previousMessages[selectedConversation.id] || []
        ).map((message) =>
          message.id === editingMessageId
            ? {
              ...message,
              text: updatedMessage.text,
              updatedAt: updatedMessage.updatedAt,
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
      alert(error.message || "The message could not be updated.");
    }
  };

  useEffect(() => {
    const loadUsersAndPreviews = async () => {
      if (!currentUserId) {
        setIsLoadingUsers(false);
        return;
      }

      try {
        const usersResponse = await fetch(`${API_URL}/api/users`);

        if (!usersResponse.ok) {
          throw new Error("Failed to load registered users.");
        }

        const registeredUsers = await usersResponse.json();

        const authenticatedUser = registeredUsers.find(
          (user) => user._id === currentUserId
        );

        setCurrentUser(authenticatedUser || null);

        const otherUsers = registeredUsers.filter(
          (user) => user._id !== currentUserId
        );

        const conversationsWithPreviews = await Promise.all(
          otherUsers.map(async (user) => {
            let savedMessages = [];

            try {
              savedMessages = await loadConversationMessages(
                user._id
              );
            } catch (error) {
              console.error(
                `Failed to load messages for ${user.fullName}:`,
                error
              );
            }

            const latestMessage =
              savedMessages[savedMessages.length - 1];

            return {
              id: user._id,
              name: user.fullName,
              username: user.username,
              skill:
                user.jobTitle ||
                user.tagline ||
                "SkillSwap member",
              lastMessage: latestMessage
                ? latestMessage.text
                : "No messages yet",
              time: latestMessage
                ? formatTime(latestMessage.createdAt)
                : "",
              unread: 0,
              avatar: createAvatar(user.fullName),
              profilePicture: user.profilePicture || "",
            };
          })
        );

        setConversationList(conversationsWithPreviews);
      } catch (error) {
        console.error(error);
        alert("Registered users could not be loaded.");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsersAndPreviews();
  }, [currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [selectedMessages]);

  useEffect(() => {
    const chatWithId = searchParams.get("chatWith");
    if (chatWithId && conversationList.length > 0 && !selectedConversation) {
      const targetConvo = conversationList.find((c) => c.id === chatWithId);
      if (targetConvo) {
        handleSelectConversation(targetConvo);
      }
    }
  }, [searchParams, conversationList]);

  if (!currentUserId) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold text-gray-800">
            Please sign in first
          </h2>

          <p className="mt-2 text-gray-500">
            You must be signed in to access the Inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="bg-blue-600 p-5 text-white">
          <h1 className="text-3xl font-bold">SkillSwap Inbox</h1>

          <p className="mt-1 text-sm text-blue-100">
            {currentUser
              ? `Signed in as ${currentUser.fullName}`
              : "Continue learning and sharing skills"}
          </p>
        </div>

        <div className="grid min-h-[700px] grid-cols-1 md:grid-cols-3">
          <div className="border-r border-gray-200 bg-gray-50 md:col-span-1">
            <div className="border-b border-gray-200 p-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search registered users..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              {isLoadingUsers ? (
                <p className="p-5 text-center text-gray-500">
                  Loading users...
                </p>
              ) : filteredConversations.length === 0 ? (
                <p className="p-5 text-center text-gray-500">
                  No other registered users found.
                </p>
              ) : (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={
                      selectedConversation?.id === conversation.id
                    }
                    onSelect={handleSelectConversation}
                  />
                ))
              )}
            </div>
          </div>

          <div className="bg-white md:col-span-2">
            {selectedConversation ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-semibold text-white">
                      {selectedConversation.profilePicture ? (
                        <img
                          src={selectedConversation.profilePicture}
                          alt={selectedConversation.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        selectedConversation.avatar
                      )}
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">
                        {selectedConversation.name}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {selectedConversation.skill}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-gray-500">
                        Loading messages...
                      </p>
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="mb-3 text-4xl">💬</div>

                        <p className="font-medium">
                          No messages yet
                        </p>

                        <p className="mt-1 text-sm">
                          Send the first message to{" "}
                          {selectedConversation.name}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedMessages.map((message) => {
                        const isCurrentUser =
                          message.senderId === currentUserId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser
                              ? "justify-end"
                              : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 ${isCurrentUser
                                ? "rounded-br-sm bg-blue-600 text-white"
                                : "rounded-bl-sm bg-white text-gray-800 shadow-sm"
                                }`}
                            >
                              {renderAttachment(message.attachment, isCurrentUser)}

                              {message.text && <p>{message.text}</p>}

                              <p
                                className={`mt-1 text-right text-xs ${isCurrentUser
                                  ? "text-blue-100"
                                  : "text-gray-400"
                                  }`}
                              >
                                {formatTime(message.createdAt)}
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
                                    onClick={() =>
                                      handleDeleteMessage(message.id)
                                    }
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
                  {pendingAttachment && !editingMessageId && (
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      <span className="truncate">📎 {pendingAttachment.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAttachment(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="ml-3 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!editingMessageId && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border border-gray-300 px-3 py-3 text-xl hover:bg-gray-100"
                          title="Attach image or file"
                        >
                          📎
                        </button>
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`rounded-lg border px-3 py-3 text-xl ${
                            isRecording
                              ? "border-red-300 bg-red-50"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                          title={isRecording ? "Stop recording" : "Record voice note"}
                        >
                          {isRecording ? "⏹️" : "🎙️"}
                        </button>
                      </>
                    )}

                    <input
                      type="text"
                      value={newMessage}
                      onChange={(event) =>
                        setNewMessage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          editingMessageId
                            ? handleUpdateMessage()
                            : handleSendMessage();
                        }
                      }}
                      placeholder={
                        editingMessageId
                          ? "Edit your message..."
                          : "Type a message..."
                      }
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
                      disabled={
                        (!editingMessageId && newMessage.trim() === "" && !pendingAttachment) ||
                        (editingMessageId && newMessage.trim() === "") ||
                        !currentUser
                      }
                      className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                    Select a user
                  </h2>

                  <p className="mt-2 text-gray-500">
                    Choose a registered user to start messaging.
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
