import express from "express";
import chatRoutes from "./ChatRoute.js";
import MessageRoutes from "./MessageRoutes.js";
import BroadcastRoutes from "./BroadcastRoute.js";
import NotificationRoutes from "./NotificationRoutes.js";

const router = express.Router();

router.use("/", chatRoutes);
router.use("/message", MessageRoutes);
router.use("/broadcast", BroadcastRoutes);
router.use("/notification", NotificationRoutes);

export default router;
