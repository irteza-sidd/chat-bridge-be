import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
        name: {
          type: String,
        },
        location: {
          type: String,
        },
        key: {
          type: String,
        },
      },
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
    },
    content: {
      type: String,
    },
    media: [
      {
        location: {
          type: String,
        },
        key: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    ],
    isSeen: {
      type: Boolean,
      default: false,
    },
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

export default mongoose.model("Message", messageSchema);
