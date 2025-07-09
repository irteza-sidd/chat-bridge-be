import { getTenantDB } from "../config/tenantDB.js";
import ChatRoomSchema from "../models/ChatRoom.js";
import MessageSchema from "../models/Message.js";
import { io } from "../socket.js";

export const getOrCreateOneToOneRoom = async (req, res) => {
  const { tenantId, recipientEmail, recipientName, recipientProfilePicture } =
    req.body;
  const { email, name, profilePicture } = req.user;

  if (!tenantId || !recipientEmail || !recipientName) {
    return res
      .status(400)
      .json({ error: "tenantId and recipient details required" });
  }

  const tenantDB = await getTenantDB(tenantId);
  const ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);

  const participants = [
    { email, name, profilePicture },
    {
      email: recipientEmail,
      name: recipientName,
      profilePicture: recipientProfilePicture,
    },
  ].sort((a, b) => a.email.localeCompare(b.email));

  const existing = await ChatRoom.findOne({
    type: "one-to-one",
    "participants.email": { $all: [email, recipientEmail] },
    participants: { $size: 2 },
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: "Room already exists",
      data: existing,
      isExist: true,
    });
  }

  const room = await ChatRoom.create({
    type: "one-to-one",
    participants,
    initiator: { email, name },
  });

  return res.status(201).json({
    success: true,
    message: "Room created successfully",
    data: room,
    isExist: false,
  });
};

export const getMyChats = async (req, res) => {
  const { tenantId } = req.query;
  const { email } = req.user;

  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  const tenantDB = await getTenantDB(tenantId);
  const ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);
  const Message = tenantDB.model("Message", MessageSchema);

  const rooms = await ChatRoom.find({ "participants.email": email }).lean();

  const grouped = { groups: [], oneToOne: [] };
  const roomIds = rooms.map((room) => room._id);

  const latestMessages = await Message.aggregate([
    { $match: { chatRoomId: { $in: roomIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$chatRoomId", latestMessage: { $first: "$$ROOT" } } },
  ]);

  const messageMap = {};
  latestMessages.forEach((m) => {
    messageMap[m._id.toString()] = m.latestMessage;
  });

  const filteredRooms = rooms.filter((room) => messageMap[room._id.toString()]);

  for (const room of filteredRooms) {
    const unseenMessages = await Message.countDocuments({
      chatRoomId: room._id,
      "sender.email": { $ne: email },
      isSeen: false,
    });

    const roomWithMsg = {
      ...room,
      latestMessage: messageMap[room._id.toString()] || null,
      unseenCount: unseenMessages,
    };

    if (room.type === "group") {
      grouped.groups.push(roomWithMsg);
    } else {
      grouped.oneToOne.push(roomWithMsg);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Rooms fetched successfully",
    data: grouped,
  });
};

export const createGroupChat = async (req, res) => {
  const { tenantId, groupName, participants, groupPhoto } = req.body;
  const { email, name, profilePicture } = req.user;

  if (!tenantId || !groupName || !participants || participants.length < 2) {
    return res.status(400).json({
      error: "tenantId, group name, and at least two participants are required",
    });
  }

  const tenantDB = await getTenantDB(tenantId);
  const ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);
  const Message = tenantDB.model("Message", MessageSchema);

  const groupParticipants = [
    { email, name, profilePicture, isAdmin: true },
    ...participants.map((p) => ({ ...p, isAdmin: false })),
  ].sort((a, b) => a.email.localeCompare(b.email));

  const existing = await ChatRoom.findOne({
    type: "group",
    name: groupName,
    "participants.email": { $all: participants.map((p) => p.email) },
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      message: "Group already exists",
      data: existing,
      isExist: true,
    });
  }

  const room = await ChatRoom.create({
    type: "group",
    name: groupName,
    groupPhoto,
    participants: groupParticipants,
    initiator: { email, name },
  });

  const defaultMessage = {
    chatRoomId: room._id,
    content: "You have been added to this group.",
    contentType: "text",
    media: [],
    sender: { email, name, profilePicture },
    status: "seen",
    messageType: "group",
  };

  await Message.create(defaultMessage);

  const payLoad = { room, latestMessage: defaultMessage };
  room.participants.forEach((participant) => {
    if (participant.email !== email) {
      const socketId = io
        .of(`/chat/${tenantId}`)
        .sockets.get(usersio[tenantId]?.[participant.email])?.id;
      if (socketId) {
        io.of(`/chat/${tenantId}`).to(socketId).emit("new-chat", payLoad);
      }
    }
  });

  return res.status(201).json({
    success: true,
    message: "Group chat created successfully",
    room,
    latestMessage: defaultMessage,
    isExist: false,
  });
};

export const getChatRoomMembers = async (req, res) => {
  const { tenantId } = req.query;
  const { chatRoomId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  try {
    const tenantDB = await getTenantDB(tenantId);
    const ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);

    const chatRoom = await ChatRoom.findById(chatRoomId)
      .select("participants")
      .lean();
    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const total = chatRoom.participants.length;
    const paginatedParticipants = chatRoom.participants.slice(
      skip,
      skip + limit
    );

    const members = paginatedParticipants.map((participant) => ({
      name: participant.name,
      email: participant.email,
      isOnline: !!io
        .of(`/chat/${tenantId}`)
        .sockets.get(usersio[tenantId]?.[participant.email]),
    }));

    const onlineUserCount = chatRoom.participants.reduce(
      (count, participant) =>
        count +
        (io
          .of(`/chat/${tenantId}`)
          .sockets.get(usersio[tenantId]?.[participant.email])
          ? 1
          : 0),
      0
    );

    return res.status(200).json({
      success: true,
      message: "Members fetched successfully",
      data: {
        total,
        page,
        limit,
        count: members.length,
        members,
        onlineUserCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getChatRoomMedia = async (req, res) => {
  const { tenantId } = req.query;
  const { chatRoomId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  try {
    const tenantDB = await getTenantDB(tenantId);
    const Message = tenantDB.model("Message", MessageSchema);

    const messages = await Message.find({
      chatRoomId,
      contentType: { $in: ["image", "video"] },
    })
      .select("contentType media createdAt sender")
      .skip(skip)
      .limit(limit)
      .lean();

    const mediaItems = messages.flatMap((message) =>
      message.media.map((item) => ({
        contentType: message.contentType,
        location: item.location,
        name: item.name,
        key: item.key,
        sender: { email: message.sender.email, name: message.sender.name },
        createdAt: message.createdAt,
      }))
    );

    const total = await Message.countDocuments({
      chatRoomId,
      contentType: { $in: ["image", "video"] },
    });

    return res.status(200).json({
      success: true,
      message: "Media fetched successfully",
      data: { total, page, limit, media: mediaItems },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
