import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URI;

if (!redisUrl) {
  console.error("🔴 REDIS_URI is missing in .env!");
}

// 1. Main client for data storage (saving live code, stdin, etc.)
export const redisClient = new Redis(redisUrl);

// 2. Pub/Sub clients required by Socket.io to sync messages across multiple servers
export const pubClient = new Redis(redisUrl);
export const subClient = pubClient.duplicate();

redisClient.on("connect", () => {
  console.log("🟢 Connected to Upstash Redis");
});

redisClient.on("error", (err) => {
  console.error("🔴 Redis Connection Error:", err);
});
