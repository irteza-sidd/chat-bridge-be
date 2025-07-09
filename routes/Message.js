import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import {
  getMessagesByRoomId,
  sendMessage,
} from "../controllers/MessageController.js";

const router = express.Router();

router.post("/", verifyToken, sendMessage);
router.get("/:chatRoomId", verifyToken, getMessagesByRoomId);

export default router;
