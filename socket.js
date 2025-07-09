import { Server } from "socket.io";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ChatRoom from "./models/ChatRoom.js";
import Message from "./models/Message.js";

dotenv.config();

export let io;
export let usersio = {};
let onlineUsers = {};

async function handleAllMessagesDelivered(userEmail, socket) {
  try {
    const rooms = await ChatRoom.find({
      "participants.email": userEmail,
    }).lean();

    if (!rooms.length) {
      console.log("No chat rooms found for the user.");
      return;
    }

    for (const room of rooms) {
      const chatRoomId = room._id;

      await Message.updateMany(
        { chatRoomId, status: "sent", "sender.email": { $ne: userEmail } },
        {
          $set: {
            status: "delivered",
            isSeen: false,
          },
        }
      );

      room.participants.forEach((participant) => {
        if (participant.email !== userEmail) {
          const otherUserEmail = participant.email;

          if (usersio[otherUserEmail]) {
            const socketId = usersio[otherUserEmail];
            const payLoad = {
              message: "Messages delivered",
              deliveredAt: new Date(),
              chatRoomId,
            };

            io.to(socketId).emit("messages-delivered", payLoad);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error updating messages:", error);

    // Emit an error to the current user if something goes wrong
    socket.emit("messages-delivered", {
      status: "error",
      message: "An error occurred while updating messages.",
    });
  }
}

const initializeSocket = (app) => {
  const server = createServer(app);
  io = new Server(server, {
    cors: {
      origin: "*",
    },
    path: "/chat/socket.io",
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        if (err) {
          console.error("Authentication error:", err);
          return next(new Error("Authentication error"));
        }
        socket.email = decoded.user.email;
        usersio[decoded.user.email] = socket.id;
        socket.user = decoded.user;
        next();
      });
    } else {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers[socket.email] = socket.id;
    socket.emit("allOnlineUsers", onlineUsers);
    setTimeout(() => {
      io.emit("userOnlineStatus", { email: socket.email, status: "online" });
    }, 5000);

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
            status: status,
            messageType,
          });

          io.to(chatRoomId).emit("new-message", {
            ...message.toObject(),
            identifier,
          });

          if (room.type === "one-to-one") {
            const socketId = usersio[otherUser.email];

            io.to(socketId).emit("msg-received", {
              ...message.toObject(),
              identifier,
            });
          } else {
            userGroups?.forEach((participant) => {
              const socketId = usersio[participant.email];
              if (socketId) {
                io.to(socketId).emit("msg-received", {
                  ...message.toObject(),
                  identifier,
                });
              }
            });
          }

          if (isFirstMsg) {
            const payLoad = { room, latestMessage: message };
            const socketId = usersio[otherUser.email];
            if (socketId) {
              io.to(socketId).emit("new-chat", payLoad);
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
      const currentUserEmail = socket?.user?.email;
      await Message.updateMany(
        {
          chatRoomId,
          "sender.email": { $ne: currentUserEmail },
          isSeen: false,
        },
        {
          $set: {
            isSeen: true,
            status: "seen",
          },
        }
      );
      io.to(chatRoomId).emit("message-seen");
    });

    socket.on("leave-room", (chatRoomId) => {
      socket.leave(chatRoomId);
    });

    socket.on("seen-message", async (message) => {
      const updatedMessage = await Message.findByIdAndUpdate(
        message._id,
        {
          isSeen: true,
          status: "seen",
        },
        { new: true }
      );

      io.to(message.chatRoomId).emit("message-seen", updatedMessage);
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
      io.emit("userOnlineStatus", { email: socket.email, status: "offline" });
      if (socket.userId) {
        delete usersio[socket.userId];
      }
    });
  });

  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  return io;
};

export { initializeSocket };
