import { getTenantDB } from "../config/tenantDB.js";
import ChatRoomSchema from "../models/ChatRoom.js";
import MessageSchema from "../models/Message.js";

export const sendMessage = async (req, res) => {
  const { tenantId, chatRoomId, content, contentType, media } = req.body;
  const { email, name, profilePicture } = req.user;

  if (!tenantId || !chatRoomId || !contentType) {
    return res
      .status(400)
      .json({ error: "tenantId, chatRoomId, and contentType are required" });
  }

  const messageContent = contentType === "audio" ? "" : content;
  const messageMedia = Array.isArray(media) ? media : [];

  if (!messageContent && messageMedia.length === 0) {
    return res.status(400).json({ error: "No content or media to send" });
  }

  const tenantDB = await getTenantDB(tenantId);
  const ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);
  const Message = tenantDB.model("Message", MessageSchema);

  const room = await ChatRoom.findById(chatRoomId);
  if (!room) {
    return res.status(404).json({ error: "Chat room not found" });
  }

  const message = await Message.create({
    chatRoomId,
    contentType,
    content: messageContent,
    media: messageMedia,
    sender: { email, name, profilePicture },
    status: "sent",
  });

  res.status(201).json({
    success: true,
    message: "Message sent",
    data: message,
  });
};

export const getMessagesByRoomId = async (req, res) => {
  const { tenantId } = req.query;
  const { chatRoomId } = req.params;

  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  const tenantDB = await getTenantDB(tenantId);
  const Message = tenantDB.model("Message", MessageSchema);

  const messages = await Message.find({ chatRoomId }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    message: "Messages fetched",
    data: messages,
  });
};
