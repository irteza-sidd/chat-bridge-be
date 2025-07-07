import express from "express";
import {
  createGroupChat,
  getChatRoomMedia,
  getChatRoomMembers,
  getMyChats,
  getOrCreateOneToOneRoom,
} from "../controllers/ChatController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/room/one-to-one", verifyToken, getOrCreateOneToOneRoom);
router.post("/room/group", verifyToken, createGroupChat);
router.get("/", verifyToken, getMyChats);
router.get("/room/:chatRoomId/members", verifyToken, getChatRoomMembers);
router.get("/room/:chatRoomId/media", verifyToken, getChatRoomMedia);

export default router;
