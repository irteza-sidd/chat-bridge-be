import express from "express";
import {
  createChannel,
  createBroadcast,
  getBroadcasts,
  getUserBroadcasts,
  getChannelsWithUserEmail,
  getBroadcastsByChannelAndEmail,
  allChannels,
} from "../controllers/BroadcastController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/channel", verifyToken, createChannel);
router.get("/channel", verifyToken, allChannels);
router.post("/", verifyToken, createBroadcast);
router.get("/", verifyToken, getBroadcasts);
router.get("/user-broadcasts", verifyToken, getUserBroadcasts);
router.get("/get-channel-email", verifyToken, getChannelsWithUserEmail);
router.get("/get-broadcasts/:channelId", verifyToken, getBroadcastsByChannelAndEmail);

export default router;
