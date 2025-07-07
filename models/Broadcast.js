import mongoose from "mongoose";
import autoIncrementID from "../config/plugin.js";

const BroadcastSchema = new mongoose.Schema(
  {
    broadcastId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachment: {
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
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    messageType: {
      type: String,
      required: true,
      enum: ["regular", "high"],
    },
    sendTo: {
      type: String,
      enum: ["allEmployees", "department"],
    },
    recipentEmail: [
      {
        type: String,
      },
    ],
    sentBy: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "un-active"],
      required: true
    }
  },
  { timestamps: true }
);

BroadcastSchema.plugin(autoIncrementID, {
  modelName: "Broadcast",
  field: "broadcastId",
  length: 1,
  prefix: "BR",
});
export default mongoose.model("Broadcast", BroadcastSchema);
