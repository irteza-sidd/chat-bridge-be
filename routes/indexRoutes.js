import express from "express";
import chatRoutes from "./ChatRoute.js";
import MessageRoutes from "./MessageRoutes.js";

const router = express.Router();

router.use("/chat", chatRoutes);
router.use("/message", MessageRoutes);

export default router;
