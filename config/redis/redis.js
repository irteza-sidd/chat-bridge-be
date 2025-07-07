import Redis from "ioredis";
import { getInt, getString } from "../../utils/env/env.js";

const redis = new Redis({
  port: getInt("REDIS_PORT", 6379),
  host: getString("REDIS_HOST", "localhost"),
  db: getInt("REDIS_DB", 0),
});

export default redis;
