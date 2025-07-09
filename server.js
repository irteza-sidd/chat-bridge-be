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
import { initializeSocket } from "./socket.js";

dotenv.config();

connectDB();

const app = express();

const io = initializeSocket(app);

app.use(
  cors({
    origin: "*",
  })
);

app.use((req, res, next) => {
  req.io = io;
  next();
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

app.use(errorHandler);

export default app;
