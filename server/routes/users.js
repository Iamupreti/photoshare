import express from "express"
import User from "../models/User.js"
import { auth } from "../middleware/auth.js"

const router = express.Router()

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    res.json(req.user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
