import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema(
  {
    channelName: {
      type: String,
      required: true,
    },
    sendTo: {
      type: String,
      enum: ["all-employee", "departments"]
    },
  },
  { timestamps: true }
);

export default mongoose.model("Channel", ChannelSchema);
