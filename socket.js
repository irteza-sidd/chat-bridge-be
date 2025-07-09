import { Server } from "socket.io";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { getTenantDB } from "./config/tenantDB.js";
import ChatRoomSchema from "./models/ChatRoom.js";
import MessageSchema from "./models/Message.js";

dotenv.config();

export let io;
const usersio = {};

export const initializeSocket = (app) => {
  const server = createServer(app);
  io = new Server(server, {
    cors: { origin: "*" },
    path: "/chat/socket.io",
  });

  io.use(async (socket, next) => {
    const { token, tenantId, apiKey } = socket.handshake.auth;
    if (!tenantId || !token || !apiKey) {
      return next(new Error("tenantId, token, and apiKey are required"));
    }

    try {
      const tenant = await mongoose.connection.db
        .collection("tenants")
        .findOne({ tenantId, apiKey });
      if (!tenant) {
        return next(new Error("Invalid API key or tenant"));
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      socket.tenantId = tenantId;
      socket.email = decoded.user.email;
      socket.user = decoded.user;

      const tenantDB = await getTenantDB(tenantId);
      socket.ChatRoom = tenantDB.model("ChatRoom", ChatRoomSchema);
      socket.Message = tenantDB.model("Message", MessageSchema);
      next();
    } catch (err) {
      console.error("Authentication error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.of(/^\/chat\/.+$/).on("connection", (socket) => {
    const tenantId = socket.nsp.name.split("/")[2];
    const { ChatRoom, Message } = socket;

    const tenantUsersio = usersio[tenantId] || (usersio[tenantId] = {});
    const onlineUsers = {};

    tenantUsersio[socket.email] = socket.id;
    onlineUsers[socket.email] = socket.id;

    socket.emit("allOnlineUsers", onlineUsers);
    setTimeout(() => {
      socket.nsp.emit("userOnlineStatus", {
        email: socket.email,
        status: "online",
      });
    }, 5000);

    async function handleAllMessagesDelivered(userEmail, socket) {
      try {
        const rooms = await ChatRoom.find({
          "participants.email": userEmail,
        }).lean();

        for (const room of rooms) {
          const chatRoomId = room._id;
          await Message.updateMany(
            { chatRoomId, status: "sent", "sender.email": { $ne: userEmail } },
            { $set: { status: "delivered", isSeen: false } }
          );

          room.participants.forEach((participant) => {
            if (participant.email !== userEmail) {
              const socketId = tenantUsersio[participant.email];
              if (socketId) {
                socket.nsp.to(socketId).emit("messages-delivered", {
                  message: "Messages delivered",
                  deliveredAt: new Date(),
                  chatRoomId,
                });
              }
            }
          });
        }
      } catch (error) {
        console.error("Error updating messages:", error);
        socket.emit("messages-delivered", {
          status: "error",
          message: "An error occurred while updating messages.",
        });
      }
    }

    handleAllMessagesDelivered(socket.email, socket);

    socket.on(
      "send-message",
      async ({
        chatRoomId,
        content,
        contentType,
        media,
        identifier,
        isFirstMsg,
      }) => {
        try {
          const { email, name } = socket.user;

          if (!chatRoomId || !contentType) {
            return socket.emit(
              "error",
              "chatRoomId and contentType are required"
            );
          }

          const messageContent = contentType === "audio" ? "" : content;
          const messageMedia = Array.isArray(media) ? media : [];

          if (!messageContent && messageMedia.length === 0) {
            return socket.emit("error", "No content or media to send.");
          }

          const room = await ChatRoom.findById(chatRoomId);
          if (!room) {
            return socket.emit("error", "Chat room not found");
          }

          let status = "delivered",
            otherUser = null;
          let userGroups = [];
          let messageType = room.type === "one-to-one" ? "one-to-one" : "group";

          if (room.type === "one-to-one") {
            otherUser = room.participants.find((user) => email !== user.email);
            const userOnline = onlineUsers[otherUser.email];
            status = userOnline ? "delivered" : "sent";
          } else {
            userGroups = room.participants.filter(
              (user) => email !== user.email
            );
          }

          const message = await Message.create({
            chatRoomId,
            contentType,
            content: messageContent,
            media: messageMedia,
            sender: { email, name },
            status,
            messageType,
          });

          socket.nsp.to(chatRoomId).emit("new-message", {
            ...message.toObject(),
            identifier,
          });

          if (room.type === "one-to-one") {
            const socketId = tenantUsersio[otherUser.email];
            if (socketId) {
              socket.nsp.to(socketId).emit("msg-received", {
                ...message.toObject(),
                identifier,
              });
            }
          } else {
            userGroups.forEach((participant) => {
              const socketId = tenantUsersio[participant.email];
              if (socketId) {
                socket.nsp.to(socketId).emit("msg-received", {
                  ...message.toObject(),
                  identifier,
                });
              }
            });
          }

          if (isFirstMsg) {
            const payLoad = { room, latestMessage: message };
            const socketId = tenantUsersio[otherUser.email];
            if (socketId) {
              socket.nsp.to(socketId).emit("new-chat", payLoad);
            }
          }
        } catch (error) {
          console.error("Socket send-message error:", error);
          socket.emit("error", "Internal server error");
        }
      }
    );

    socket.on("join-room", (chatRoomId) => {
      socket.join(chatRoomId);
    });

    socket.on("seen-all-messages", async (chatRoomId) => {
      const currentUserEmail = socket.user.email;
      await Message.updateMany(
        {
          chatRoomId,
          "sender.email": { $ne: currentUserEmail },
          isSeen: false,
        },
        { $set: { isSeen: true, status: "seen" } }
      );
      socket.nsp.to(chatRoomId).emit("message-seen");
    });

    socket.on("leave-room", (chatRoomId) => {
      socket.leave(chatRoomId);
    });

    socket.on("seen-message", async (message) => {
      const updatedMessage = await Message.findByIdAndUpdate(
        message._id,
        { isSeen: true, status: "seen" },
        { new: true }
      );
      socket.nsp.to(message.chatRoomId).emit("message-seen", updatedMessage);
    });

    socket.on("typing", ({ chatRoomId, isTyping }) => {
      const { email, name, profilePicture } = socket.user;
      socket.to(chatRoomId).emit("userTyping", {
        email,
        name,
        profilePicture,
        chatRoomId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      delete onlineUsers[socket.email];
      socket.nsp.emit("userOnlineStatus", {
        email: socket.email,
        status: "offline",
      });
      delete tenantUsersio[socket.email];
    });
  });

  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  return io;
};
