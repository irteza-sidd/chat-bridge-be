import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
    },
    notificationType: {
      type: String,
      enum: [
        "Leave Created",
        "Leave Approved",
        "Leave Rejected",
        "Correction Approved",
        "Correction Rejected",
        "Birthday Wish",
      ],
      required: true,
    },
    notificationText: {
      type: String,
    },
    notificationTitle: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
