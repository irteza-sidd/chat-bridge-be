import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import {
  getUserNotifications,
  markAllAsRead,
  markSingleAsRead,
} from "../controllers/NotificationController.js";

const router = express.Router();

router.get("/:id", verifyToken, getUserNotifications);
router.patch("/:id/mark-all", verifyToken, markAllAsRead);
router.patch("/mark/:notificationId", verifyToken, markSingleAsRead);

export default router;
