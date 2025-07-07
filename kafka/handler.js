import Notification from "../models/Notification.Model.js";
import { usersio, io } from "../socket.js";

export const handleSendNotification = async (data) => {
  try {
    const notificationData = {
      userEmail: data?.userEmail,
      notificationType: data?.notificationType || "General Notification",
      notificationText: data?.notificationText || "You have a new notification",
      notificationTitle: data?.notificationTitle || "New Notification",
      isRead: false,
      action: data?.action || null,
    };

    const savedNotification = await Notification.create(notificationData);

    const socketId = usersio[data.userEmail];
    if (socketId) {
      io.to(socketId).emit("new-notification", savedNotification);
    }
  } catch (err) {
    console.error("Error handling send notification:", err);
  }
};
