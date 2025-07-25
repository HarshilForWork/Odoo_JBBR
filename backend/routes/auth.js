const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body

    // Check for hardcoded admin credentials
    const isAdmin = (email === "admin@stackit.com" || username === "admin") && password === "admin123"

    // Find user by email or username
    let user = null
    if (email) {
      user = await User.findOne({ email })
    } else if (username) {
      user = await User.findOne({ username })
    }

    // If admin credentials match but user doesn't exist, create admin user
    if (isAdmin && !user) {
      user = new User({
        username: "admin",
        email: "admin@stackit.com",
        password: "admin123",
        role: "admin"
      })
      await user.save()
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // If admin credentials match, ensure admin role
    if (isAdmin) {
      user.role = "admin"
      await user.save()
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
    const user = await User.findById(decoded.userId).select("-password")
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
})

module.exports = router 