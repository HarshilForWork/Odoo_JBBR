const express = require("express")
const router = express.Router()
const Notification = require("../models/Notification")
const auth = require("../middleware/auth")

// Get user's notifications
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "username avatar")
      .populate("question", "title")
      .populate("answer", "content")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Mark notification as read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.json(notification)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Mark all notifications as read
router.patch("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    )

    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// Get unread count
router.get("/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    })

    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router 