import express from "express"
import User from "../models/User.js"

const router = express.Router()

router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.username }).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ message: "Search query is required" })
    }

    const users = await User.find({
      name: { $regex: q, $options: "i" },
    })
      .select("-password")
      .sort({ role: -1 })

    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
