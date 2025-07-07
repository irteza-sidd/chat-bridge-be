import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "./logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logStream = fs.createWriteStream(
  path.join(__dirname, "./logs/access.log"),
  { flags: "a" } // Append mode
);

const formatDate = (date) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour format
  });

  return `${formattedDate} ${formattedTime}`;
};

const setupMorganLogger = (app) => {
  // Custom development format function
  const developmentFormat = (tokens, req, res) => {
    return [
      `[${formatDate(new Date())}]`,
      `IP: ${tokens["remote-addr"](req, res)}`,
      tokens.method(req, res),
      tokens.url(req, res),
      `Status Code: ${tokens.status(req, res)}`,
      `User-Agent: ${req.headers["user-agent"]}`,
    ].join(" | ");
  };

  app.use(morgan(developmentFormat, { stream: logStream }));
};

export default setupMorganLogger;
