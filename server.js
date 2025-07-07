import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import path from "path";
import errorHandler from "./middlewares/errorHandler.js";
import routes from "./routes/indexRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middlewares/rateLimiter.js";
import redis from "./config/redis/redis.js";
import setupMorganLogger from "./config/morgan.js";
import { initializeSocket } from "./socket.js";
import pkg from "agora-access-token";
import "./kafka/consumer.js";

const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

connectDB();

const app = express();

const APP_ID = "cc5627c52d584d4db68ade84b0086062";
const APP_CERTIFICATE = "7fb795dc6d424f14badf7d456937b8db";

const io = initializeSocket(app);

setupMorganLogger(app);

app.use(
  cors({
    origin: "*",
  })
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/rtc-token", (req, res) => {
  try {
    const { channelName, uid } = req.query;

    if (!channelName) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    // Generate random UID if not provided
    const userUid = uid || Math.floor(Math.random() * 100000);
    const role = RtcRole.PUBLISHER;
    const expirationTime = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userUid,
      role,
      privilegeExpiredTs
    );

    res.json({
      token,
      appId: APP_ID,
      channel: channelName,
      uid: userUid, // Return the UID to the client
    });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.use(rateLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/v1/logs", express.static(path.join(__dirname, "/logs")));
app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

app.use(routes);

app.get("/health", (req, res, next) => {
  res.send("Hello I am up");
});

app.get("/cache", async (req, res) => {
  const value = await redis.get("name");
  if (value) {
    return res.status(200).json({ name: value });
  }
  // DB CALL

  // Set the value in the cache
  await redis.set("name", "Name from cache");
  await redis.expire("name", 10);
  const foundValue = await redis.get("name");
  return res.status(200).json({ name: foundValue });
});

app.use(errorHandler);

export default app;
