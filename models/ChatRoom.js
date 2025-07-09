import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["one-to-one", "group"],
      default: "one-to-one",
    },
    name: {
      type: String,
      required: function () {
        return this.type === "group";
      },
    },
    groupPhoto: {
      name: String,
      location: String,
      key: String,
    },
    participants: [
      {
        email: { type: String, required: true },
        name: { type: String, required: true },
        profilePicture: {
          name: String,
          location: String,
          key: String,
        },
        isAdmin: { type: Boolean, default: false },
      },
    ],
    initiator: {
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default ChatRoomSchema;
