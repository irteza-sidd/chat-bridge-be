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
    participants: [
      {
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
          isAdmin: {
            type: Boolean,
            default: false,
          },
        },
      },
    ],
    initiator: {
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChatRoom", ChatRoomSchema);
