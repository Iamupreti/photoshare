export const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" })
    }
  
    req.userId = req.session.userId
    next()
  }
  
  export const isCreator = async (req, res, next) => {
    try {
      const User = (await import("../models/User.js")).default
      const user = await User.findById(req.userId)
  
      if (!user || user.role !== "creator") {
        return res.status(403).json({ message: "Creator access required" })
      }
  
      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Server error" })
    }
  }
  