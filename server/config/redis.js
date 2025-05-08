import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL)

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err)
})

console.log("✅ Redis connected successfully")

export default redisClient