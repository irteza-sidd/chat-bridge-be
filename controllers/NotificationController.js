import Notification from "../models/Notification.Model.js";

export const getUserNotifications = async (req, res) => {
  const { id } = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  try {
    const totalNotifications = await Notification.countDocuments({
      userEmail: id,
    });
    const unreadCount = await Notification.countDocuments({
      userEmail: id,
      isRead: false,
    });

    const notifications = await Notification.find({ userEmail: id })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      unreadCount,
      pagination: {
        totalNotifications,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving notifications",
      error: error.message,
    });
  }
};

export const markAllAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Notification.updateMany(
      { userEmail: id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notifications as read",
      error: error.message,
    });
  }
};

export const markSingleAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const result = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};
