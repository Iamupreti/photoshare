import redis from "redis"

// Initialize Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
})

// Connect to Redis if not already connected
const getRedisClient = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect().catch(console.error)
  }
  return redisClient
}

// Cache key for trending photos
const TRENDING_CACHE_KEY = "trending:photos"
// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 60 * 15

/**
 * Invalidate the trending cache when a photo, comment, or rating is added/deleted
 */
export const invalidateTrendingCache = async () => {
  try {
    const client = await getRedisClient()
    await client.del(TRENDING_CACHE_KEY)
    console.log("Trending cache invalidated")
  } catch (error) {
    console.error("Error invalidating trending cache:", error)
  }
}

/**
 * Get trending photos from cache or database
 */
export const getTrendingPhotos = async () => {
  try {
    const client = await getRedisClient()

    // Try to get from cache first
    const cachedData = await client.get(TRENDING_CACHE_KEY)

    if (cachedData) {
      console.log("Returning trending photos from cache")
      return JSON.parse(cachedData)
    }

    // If not in cache, it will be fetched from the database by the controller
    return null
  } catch (error) {
    console.error("Error getting trending photos from cache:", error)
    return null
  }
}

/**
 * Cache trending photos
 */
export const cacheTrendingPhotos = async (photos) => {
  try {
    const client = await getRedisClient()

    // Cache for 15 minutes
    await client.set(TRENDING_CACHE_KEY, JSON.stringify(photos), {
      EX: CACHE_EXPIRATION,
    })

    console.log("Trending photos cached successfully")
  } catch (error) {
    console.error("Error caching trending photos:", error)
  }
}
