import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      email: { type: String, required: true },
      name: { type: String, required: true },
      profilePicture: {
        name: String,
        location: String,
        key: String,
      },
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      required: true,
    },
    content: String,
    media: [
      {
        location: String,
        key: String,
        name: String,
      },
    ],
    isSeen: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    messageType: {
      type: String,
      enum: ["one-to-one", "group"],
      required: true,
    },
  },
  { timestamps: true }
);

export default MessageSchema;
