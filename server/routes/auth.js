import express from "express"
import User from "../models/User.js"
import { isAuthenticated } from "../middleware/auth.js"
import redisClient from "../config/redis.js"

const router = express.Router()

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: "User already exists" })
    }

    user = new User({
      name,
      email,
      password,
      role: role || "viewer",
    })

    await user.save()

    req.session.userId = user._id

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    res.status(201).json({ user: userResponse })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    req.session.userId = user._id

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return reject(err);
        }
        console.log('Session saved to Upstash Redis, ID:', req.sessionID);
        resolve();
      });
    });

    redisClient
      .get(`sess:${req.sessionID}`)
      .then((data) => console.log('Redis session data:', data))
      .catch((err) => console.error('Redis get error:', err));

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    res.json({ user: userResponse })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" })
    }

    res.clearCookie("connect.sid")
    res.json({ message: "Logged out successfully" })
  })
})

export default router
