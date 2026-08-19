import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import ConversationItem from "../components/ConversationItem";

const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const socket = io(API_URL);

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
  const [attachmentError, setAttachmentError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [searchParams] = useSearchParams();
  

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  const currentUserId =
    localStorage.getItem("userId") ||
    sessionStorage.getItem("userId");
  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("joinUser", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const senderId = message.senderId?.toString();

      const messageForChat = {
        id: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        attachment: message.attachment || null,
        isRead: message.isRead || false,
      };
      setIsTyping(false);

      setAllMessages((previousMessages) => ({
        ...previousMessages,
        [senderId]: [
          ...(previousMessages[senderId] || []),
          messageForChat,
        ],
      }));

      setConversationList((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === senderId
            ? {
                ...conversation,
                lastMessage:
                  message.text ||
                  message.attachment?.name ||
                  "Attachment",
                time: "Now",
                unread:
                  selectedConversation && selectedConversation.id === senderId
                    ? 0
                    : Number(conversation.unread || 0) + 1,
              }
            : conversation
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [selectedConversation]);

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
      isRead: message.isRead || false,
    }));

  const handleTranslateMessage = async (message) => {
    // If already translated, clicking again shows the original
    if (translatedMessages[message.id]) {
      setTranslatedMessages((previous) => {
        const updated = { ...previous };
        delete updated[message.id];
        return updated;
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message.text,
          sourceLanguage: selectedConversation?.preferredLanguage || "en",
          targetLanguage: currentUser?.preferredLanguage || "en",
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed.");
      }

      const data = await response.json();

      setTranslatedMessages((previous) => ({
        ...previous,
        [message.id]: data.translatedText,
      }));
    } catch (error) {
      console.error("Translation error:", error);
      setAttachmentError("Could not translate this message.");
    }
  };

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
    setIsTyping(false);
    setEditingMessageId(null);
    setNewMessage("");
    setPendingAttachment(null);
    setIsLoading(true);

    try {
      await fetch(
        `${API_URL}/api/messages/read/${conversation.id}/${currentUserId}`,
        {
          method: "PATCH",
        }
      );
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }

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
        isRead: savedMessage.isRead || false,
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

    setAttachmentError("");

    if (!file) return;

    const maxFileSize = 5 * 1024 * 1024;

    const allowedExtensions = [
      // Documents
      ".pdf",
      ".doc",
      ".docx",
      ".txt",

      // Images
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",

      // Audio / voice notes
      ".mp3",
      ".wav",
      ".m4a",
      ".ogg",
      ".webm",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowedFile = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowedFile) {
      setAttachmentError(
        "File type not allowed. Only documents, images, and audio files are accepted."
      );

      event.target.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      setAttachmentError(
        `Attachment is ${fileSizeInMB} MB. Maximum allowed size is 5 MB.`
      );

      event.target.value = "";
      return;
    }

    try {
      const data = await fileToDataUrl(file);

      setPendingAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        data,
      });
    } catch (error) {
      console.error(error);
      setAttachmentError("Could not attach that file.");
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
            size: voiceFile.size,
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
        <a
          href={attachment.data}
          download={attachment.name}
          className="mb-2 block overflow-hidden rounded-xl"
        >
          <img
            src={attachment.data}
            alt={attachment.name}
            className="max-h-72 w-full rounded-xl object-cover"
          />
        </a>
      );
    }

    if (attachment.type?.startsWith("audio/")) {
      return (
        <div
          className={`mb-2 w-[280px] max-w-full rounded-xl border p-3 ${
            isCurrentUser
              ? "border-white/20 bg-white/10"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                isCurrentUser
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              🎙️
            </div>

            <div>
              <p className="text-sm font-semibold">Voice message</p>
              <p
                className={`text-xs ${
                  isCurrentUser ? "text-blue-100" : "text-gray-500"
                }`}
              >
                Audio attachment
              </p>
            </div>
          </div>

          <audio
            controls
            src={attachment.data}
            className="w-full"
          />
        </div>
      );
    }

    const extension =
      attachment.name?.split(".").pop()?.toUpperCase() || "FILE";

    return (
      <a
        href={attachment.data}
        download={attachment.name}
        className={`mb-2 flex max-w-md items-center gap-3 rounded-xl border p-3 transition ${
          isCurrentUser
            ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50"
        }`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg ${
            isCurrentUser
              ? "bg-white/20"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          📄
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {attachment.name}
          </p>

          <p
            className={`mt-0.5 text-xs ${
              isCurrentUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {extension} document · Click to download
          </p>
        </div>

        <span
          className={`text-lg ${
            isCurrentUser ? "text-blue-100" : "text-blue-600"
          }`}
        >
          ↓
        </span>
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

            // Load unread message count from this user
            let unreadCount = 0;

            try {
              const unreadResponse = await fetch(
                `${API_URL}/api/messages/unread/${user._id}/${currentUserId}`
              );

              if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                unreadCount = unreadData.unreadCount || 0;
              }
            } catch (error) {
              console.error(
                `Failed to load unread count for ${user.fullName}:`,
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
              unread: unreadCount,
              avatar: createAvatar(user.fullName),
              profilePicture: user.profilePicture || "",
              preferredLanguage: user.preferredLanguage || "en",
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

  useEffect(() => {
    const handleTyping = ({ senderId }) => {
      if (selectedConversation?.id === senderId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (selectedConversation?.id === senderId) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [selectedConversation]);

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  useEffect(() => {
    const handleMessagesRead = ({ readerId }) => {
      setAllMessages((previousMessages) => {
        const updatedMessages = { ...previousMessages };

        if (updatedMessages[readerId]) {
          updatedMessages[readerId] = updatedMessages[readerId].map(
            (message) =>
              message.senderId === currentUserId
                ? { ...message, isRead: true }
                : message
          );
        }

        return updatedMessages;
      });
    };

    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [currentUserId]);



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
    <div className="h-full overflow-hidden bg-gray-100 p-0 sm:p-2 lg:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-lg sm:rounded-xl">
        <div className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-sm backdrop-blur">
                  💬
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    SkillSwap Inbox
                  </h1>

                  <p className="mt-0.5 text-sm text-blue-100">
                    {currentUser
                      ? `Signed in as ${currentUser.fullName}`
                      : "Connect, learn and share skills"}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-blue-50 md:block">
              Secure Messaging
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3">
          <div
            className={`min-h-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50 lg:col-span-1 lg:flex ${
              selectedConversation ? "hidden" : "flex"
            }`}
          >
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                    conversation={{
                      ...conversation,
                      isOnline: onlineUsers.includes(conversation.id),
                    }}
                    isSelected={
                      selectedConversation?.id === conversation.id
                    }
                    onSelect={handleSelectConversation}
                  />
                ))
              )}
            </div>
          </div>

          <div
            className={`min-h-0 bg-white lg:col-span-2 lg:block ${
              selectedConversation ? "block" : "hidden"
            }`}
          >
            {selectedConversation ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedConversation(null)}
                      className="mr-1 rounded-lg p-2 text-xl text-gray-700 hover:bg-gray-100 lg:hidden"
                      aria-label="Back to conversations"
                    >
                      ←
                    </button>

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

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50/70 p-3 sm:p-5">
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
                            className={`group flex w-full ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex w-full items-start gap-1.5 ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              }`}
                            >

                              {isCurrentUser && (
                                <div className="relative mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMessageMenuId(
                                        openMessageMenuId === message.id
                                          ? null
                                          : message.id
                                      )
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-gray-700 opacity-0 transition hover:bg-gray-200 hover:text-gray-900 group-hover:opacity-100"
                                    title="Message options"
                                  >
                                    ⋮
                                  </button>

                                  {openMessageMenuId === message.id && (
                                    <div className="absolute right-full top-0 z-30 mr-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setNewMessage(message.text);
                                          setOpenMessageMenuId(null);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        ✏️ Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMessageMenuId(null);
                                          handleDeleteMessage(message.id);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex max-w-[90%] flex-col sm:max-w-[80%] lg:max-w-[70%] ${
                                  isCurrentUser ? "items-end" : "items-start"
                                }`}
                              >
                                <div
                                  className={`w-fit max-w-full rounded-2xl px-4 py-3 transition ${
                                    isCurrentUser
                                      ? "min-w-[150px] rounded-br-md bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm"
                                      : "min-w-[150px] rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm"
                                  }`}
                                >
                                  {renderAttachment(
                                    message.attachment,
                                    isCurrentUser
                                  )}

                                  {message.text && (
                                    <>
                                      <p>
                                        {translatedMessages[message.id]
                                          ? translatedMessages[message.id]
                                          : message.text}
                                      </p>

                                      {!isCurrentUser && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleTranslateMessage(message)
                                          }
                                          className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                                        >
                                          {translatedMessages[message.id]
                                            ? "Show original"
                                            : "Translate"}
                                        </button>
                                      )}
                                    </>
                                  )}

                                  <p
                                    className={`mt-1.5 text-right text-[11px] ${
                                      isCurrentUser
                                        ? "text-blue-100"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {formatTime(message.createdAt)}
                                  </p>
                                </div>

                                {/* Read receipt outside message bubble */}
                                {isCurrentUser && (
                                  <div className="mr-1 mt-1 text-xs">
                                    {message.isRead ? (
                                      <span
                                        className="font-bold text-blue-600"
                                        title="Read"
                                      >
                                        ✓✓
                                      </span>
                                    ) : (
                                      <span
                                        className="text-gray-400"
                                        title="Sent"
                                      >
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                              style={{ animationDelay: "150ms" }}
                            ></span>
                            <span
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                              style={{ animationDelay: "300ms" }}
                            ></span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef}></div>

                    </>
                  )}
                </div>

                <div className="shrink-0 border-t border-gray-200 bg-white/95 p-3 shadow-[0_-4px_18px_rgba(15,23,42,0.04)] backdrop-blur sm:p-4">
                  {attachmentError && !editingMessageId && (
                    <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {attachmentError}
                    </div>
                  )}

                  {pendingAttachment && !editingMessageId && (
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium text-blue-800">
                          📎 {pendingAttachment.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setPendingAttachment(null);
                            setAttachmentError("");

                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="ml-3 text-sm font-semibold text-blue-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        Size: {(pendingAttachment.size / (1024 * 1024)).toFixed(2)} MB · Maximum: 5 MB
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {!editingMessageId && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.ogg,.webm"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          title="Attach image or file"
                        >
                          📎
                        </button>
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg transition ${
                            isRecording
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
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
                      onChange={(event) => {
                        const value = event.target.value;
                        setNewMessage(value);

                        if (!selectedConversation || editingMessageId) {
                          return;
                        }

                        socket.emit("typing", {
                          senderId: currentUserId,
                          receiverId: selectedConversation.id,
                        });

                        clearTimeout(typingTimeoutRef.current);

                        typingTimeoutRef.current = setTimeout(() => {
                          socket.emit("stopTyping", {
                            senderId: currentUserId,
                            receiverId: selectedConversation.id,
                          });
                        }, 1200);
                      }}

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
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-500"
                    />

                    {editingMessageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null);
                          setNewMessage("");
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
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
                      className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow sm:px-5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {editingMessageId ? "Update" : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden h-full items-center justify-center lg:flex">
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
