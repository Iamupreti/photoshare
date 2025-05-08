import express from "express"
import fs from "fs"
import Media from "../models/Media.js"
import Comment from "../models/Comment.js"
import { isAuthenticated, isCreator } from "../middleware/auth.js"
import cloudinary from "../config/cloudinary.js"
import upload from "../config/multer.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const media = await Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("creator", "name").lean()

    const mediaWithCounts = await Promise.all(
      media.map(async (item) => {
        const commentsCount = await Comment.countDocuments({ media: item._id });
    
        const ratings = item.ratings || [];
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
          : 0;
    
        let userRating = null;
        if (req.session.userId) {
          const ratingObj = ratings.find((r) => r.user.toString() === req.session.userId);
          if (ratingObj) {
            userRating = ratingObj.value;
          }
        }
    
        return {
          ...item,
          commentsCount,
          userRating,
          averageRating
        };
      })
    );

    const totalCount = await Media.countDocuments()
    const hasMore = totalCount > skip + limit

    res.json({
      media: mediaWithCounts,
      hasMore,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/user/:userId", async (req, res) => {
  try {
    const media = await Media.find({ creator: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("creator", "name")
      .lean()

    const mediaWithCounts = await Promise.all(
      media.map(async (item) => {
        const commentsCount = await Comment.countDocuments({ media: item._id });
    
        const ratings = item.ratings || [];
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
          : 0;
    
        let userRating = null;
        if (req.session.userId) {
          const ratingObj = ratings.find((r) => r.user.toString() === req.session.userId);
          if (ratingObj) {
            userRating = ratingObj.value;
          }
        }
    
        return {
          ...item,
          commentsCount,
          userRating,
          averageRating
        };
      })
    );

    res.json(mediaWithCounts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/upload", isAuthenticated, isCreator, upload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { title, description, people, location } = req.body

    const peopleArray = people
      ? people
          .split(",")
          .map((person) => person.trim())
          .filter(Boolean)
      : []

    const isImage = req.file.mimetype.startsWith("image")
    const mediaType = isImage ? "image" : "video"

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: mediaType,
      folder: "media-sharing-app",
    })

    const media = new Media({
      title,
      description,
      mediaUrl: result.secure_url,
      mediaType,
      publicId: result.public_id,
      creator: req.userId,
      people: peopleArray,
      location,
    })

    await media.save()

    fs.unlinkSync(req.file.path)

    await media.populate("creator", "name")

    res.status(201).json(media)
  } catch (err) {
    console.error(err)

    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({ message: "Upload failed" })
  }
})

router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)

    if (!media) {
      return res.status(404).json({ message: "Media not found" })
    }

    if (media.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this media" })
    }

    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.mediaType,
    })

    await Comment.deleteMany({ media: media._id })

    await Media.findByIdAndDelete(req.params.id)

    res.json({ message: "Media deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/:id/rate", isAuthenticated, async (req, res) => {
  try {
    const { rating } = req.body

    if (!rating || rating < 1 || rating > 10) {
      return res.status(400).json({ message: "Rating must be between 1 and 10" })
    }

    const media = await Media.findById(req.params.id)

    if (!media) {
      return res.status(404).json({ message: "Media not found" })
    }

    const ratingIndex = media.ratings.findIndex((r) => r.user.toString() === req.userId)

    if (ratingIndex > -1) {
      media.ratings[ratingIndex].value = rating
    } else {
      media.ratings.push({
        user: req.userId,
        value: rating,
      })
    }

    await media.save()

    const averageRating = media.averageRating

    res.json({
      averageRating,
      userRating: rating,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ media: req.params.id }).sort({ createdAt: -1 }).populate("user", "name")

    res.json(comments)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/:id/comments", isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" })
    }

    const media = await Media.findById(req.params.id)

    if (!media) {
      return res.status(404).json({ message: "Media not found" })
    }

    const comment = new Comment({
      media: req.params.id,
      user: req.userId,
      content,
    })

    await comment.save()

    await comment.populate("user", "name")

    res.status(201).json(comment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
