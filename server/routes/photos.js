import express from "express"
import { auth, creatorOnly } from "../middleware/auth.js"
import Photo from "../models/Photo.js"
import Comment from "../models/Comment.js"
import Rating from "../models/Rating.js"
import upload from "../middleware/upload.js"
import cloudinary from "../config/cloudinary.js"
import { invalidateTrendingCache } from "../services/trendingServices.js"

const router = express.Router()

// Get all photos
router.get("/", auth, async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).populate("user", "username").limit(50)

    res.json(photos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get photos by user ID
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.params.userId }).sort({ createdAt: -1 }).populate("user", "username")

    res.json(photos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current user's photos
router.get("/my-photos", auth, async (req, res) => {
  try {
    const photos = await Photo.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("user", "username")

    res.json(photos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Search photos
router.get("/search", auth, async (req, res) => {
  try {
    const { term } = req.query

    if (!term) {
      return res.status(400).json({ message: "Search term is required" })
    }

    const photos = await Photo.find({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { caption: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("user", "username")

    res.json(photos)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get photo by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate("user", "username")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username",
        },
        options: { sort: { createdAt: -1 } },
      })

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" })
    }

    res.json(photo)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create a new photo
router.post("/", [auth, creatorOnly, upload.single("media")], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" })
    }

    // Upload to 
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "photoshare",
      resource_type: "auto", // Auto-detect if it's an image or video
    })

    // Parse people array if provided
    let people = []
    if (req.body.people) {
      try {
        people = JSON.parse(req.body.people)
      } catch (e) {
        // If parsing fails, assume it's a comma-separated string
        people = req.body.people.split(",").map((p) => p.trim())
      }
    }

    // Determine media type
    const mediaType = result.resource_type === "video" ? "video" : "image"

    // Create new photo
    const newPhoto = new Photo({
      user: req.user._id,
      title: req.body.title,
      caption: req.body.caption,
      location: req.body.location,
      people,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      mediaType,
    })

    const photo = await newPhoto.save()

    // Populate user data
    await photo.populate("user", "username")

    // Invalidate trending cache
    await invalidateTrendingCache()

    res.status(201).json(photo)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add a comment to a photo
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" })
    }

    const newComment = new Comment({
      photo: photo._id,
      user: req.user._id,
      text: req.body.text,
    })

    const comment = await newComment.save()

    // Add comment to photo's comments array
    photo.comments.push(comment._id)
    await photo.save()

    // Populate user data
    await comment.populate("user", "username")

    // Invalidate trending cache
    await invalidateTrendingCache()

    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Add a rating to a photo
router.post("/:id/ratings", auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" })
    }

    // Check if user has already rated this photo
    const existingRating = await Rating.findOne({
      photo: photo._id,
      user: req.user._id,
    })

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this photo" })
    }

    const newRating = new Rating({
      photo: photo._id,
      user: req.user._id,
      rating: req.body.rating,
    })

    const rating = await newRating.save()

    // Add rating to photo's ratings array
    photo.ratings.push(rating._id)

    // Update average rating
    const ratings = await Rating.find({ photo: photo._id })
    const totalRating = ratings.reduce((sum, item) => sum + item.rating, 0)
    photo.averageRating = totalRating / ratings.length

    await photo.save()

    // Invalidate trending cache
    await invalidateTrendingCache()

    res.status(201).json({
      rating,
      newAverage: photo.averageRating,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete a photo
router.delete("/:id", auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" })
    }

    // Check if user is authorized to delete this photo
    if (photo.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this photo" })
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(photo.cloudinaryId)

    // Delete all comments associated with this photo
    await Comment.deleteMany({ photo: photo._id })

    // Delete all ratings associated with this photo
    await Rating.deleteMany({ photo: photo._id })

    // Delete the photo
    await photo.deleteOne()

    // Invalidate trending cache
    await invalidateTrendingCache()

    res.json({ message: "Photo deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
