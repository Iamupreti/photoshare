import express from "express"
import { auth } from "../middleware/auth.js"
import Comment from "../models/Comment.js"
import Photo from "../models/Photo.js"
import { invalidateTrendingCache } from "../services/trendingServices.js"

const router = express.Router()

// Delete a comment
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    // Get the photo to check ownership
    const photo = await Photo.findById(comment.photo)

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" })
    }

    // Check if user is authorized to delete this comment
    // User can delete if they are the comment author OR the photo owner
    if (comment.user.toString() !== req.user._id.toString() && photo.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" })
    }

    // Remove comment from photo's comments array
    photo.comments = photo.comments.filter((commentId) => commentId.toString() !== comment._id.toString())
    await photo.save()

    // Delete the comment
    await comment.deleteOne()

    // Invalidate trending cache
    await invalidateTrendingCache()

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
