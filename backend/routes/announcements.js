const express = require("express");
const Announcement = require("../models/Announcement");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();

// Get all announcements (public)
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create announcement (admin only)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const announcement = new Announcement({
      title,
      message,
      author: req.user._id,
    });

    await announcement.save();
    await announcement.populate("author", "username");

    res.status(201).json({ announcement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update announcement (admin only)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { title, message, isActive } = req.body;
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { title, message, isActive },
      { new: true }
    ).populate("author", "username");

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ announcement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete announcement (admin only)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all announcements for admin management
router.get("/admin", auth, admin, async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 