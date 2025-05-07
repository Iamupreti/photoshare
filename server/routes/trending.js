import express from "express"
import { auth } from "../middleware/auth.js"
import Photo from "../models/Photo.js"
import { getTrendingPhotos, cacheTrendingPhotos } from "../services/trendingServices.js"

const router = express.Router()

// Get trending photos
router.get("/", auth, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Try to get from cache first
    const cachedData = await getTrendingPhotos()

    if (cachedData) {
      // If we have cached data, paginate it here
      const startIndex = skip
      const endIndex = skip + limit
      const paginatedPhotos = cachedData.slice(startIndex, endIndex)

      return res.json({
        photos: paginatedPhotos,
        pagination: {
          page,
          limit,
          total: cachedData.length,
          pages: Math.ceil(cachedData.length / limit),
        },
      })
    }

    // If not in cache, fetch from database
    // Count total documents for pagination
    const total = await Photo.countDocuments()

    // Get trending photos sorted by engagement (comments count + ratings count)
    const photos = await Photo.aggregate([
      {
        $addFields: {
          engagementScore: {
            $add: [{ $size: "$comments" }, { $size: "$ratings" }],
          },
        },
      },
      { $sort: { engagementScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          title: 1,
          caption: 1,
          imageUrl: 1,
          location: 1,
          mediaType: 1,
          createdAt: 1,
          comments: 1,
          ratings: 1,
          averageRating: 1,
          engagementScore: 1,
          "user._id": 1,
          "user.username": 1,
        },
      },
    ])

    // Get all trending photos for caching (without pagination)
    const allTrendingPhotos = await Photo.aggregate([
      {
        $addFields: {
          engagementScore: {
            $add: [{ $size: "$comments" }, { $size: "$ratings" }],
          },
        },
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 100 }, // Cache top 100 trending photos
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          title: 1,
          caption: 1,
          imageUrl: 1,
          location: 1,
          mediaType: 1,
          createdAt: 1,
          comments: 1,
          ratings: 1,
          averageRating: 1,
          engagementScore: 1,
          "user._id": 1,
          "user.username": 1,
        },
      },
    ])

    // Cache the results
    await cacheTrendingPhotos(allTrendingPhotos)

    res.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
