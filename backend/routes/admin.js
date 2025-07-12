const express = require("express");
const User = require("../models/User");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const GlobalMessage = require("../models/GlobalMessage");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(auth);
router.use(admin);

// Get comprehensive platform statistics
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalAnswers = await Answer.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const activeUsers = await User.countDocuments({ isBanned: false });
    
    // Get recent activity
    const recentQuestions = await Question.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const recentAnswers = await Answer.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get top users
    const topUsers = await User.find({})
      .sort({ questionCount: -1, answerCount: -1 })
      .limit(5)
      .select("username questionCount answerCount");

    res.json({
      totalUsers,
      totalQuestions,
      totalAnswers,
      adminUsers,
      bannedUsers,
      activeUsers,
      recentQuestions,
      recentAnswers,
      topUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all users with detailed information
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "", banned = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    
    if (role && role !== "all") {
      query.role = role;
    }
    
    if (banned === "true") {
      query.isBanned = true;
    } else if (banned === "false") {
      query.isBanned = false;
    }

    const users = await User.find(query)
      .select("-password")
      .populate("bannedBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user details with their questions and answers
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const questions = await Question.find({ author: req.params.id })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    const answers = await Answer.find({ author: req.params.id })
      .populate("author", "username")
      .populate("question", "title")
      .sort({ createdAt: -1 });

    res.json({
      user,
      questions,
      answers,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!["guest", "user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Don't allow admin to change their own role
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Ban/Unban user
router.put("/users/:id/ban", async (req, res) => {
  try {
    const { isBanned, banReason } = req.body;
    const { id } = req.params;

    // Don't allow admin to ban themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot ban yourself" });
    }

    const updateData = {
      isBanned,
      banReason: isBanned ? banReason : "",
      bannedBy: isBanned ? req.user._id : null,
      bannedAt: isBanned ? new Date() : null,
    };

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow admin to delete themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all questions and answers by this user
    await Question.deleteMany({ author: id });
    await Answer.deleteMany({ author: id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all questions with admin controls
router.get("/questions", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", author = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    if (author) {
      query.author = author;
    }

    const questions = await Question.find(query)
      .populate("author", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete question (admin can delete any question)
router.delete("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Delete all answers for this question
    await Answer.deleteMany({ question: id });

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all answers with admin controls
router.get("/answers", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", author = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.content = { $regex: search, $options: "i" };
    }
    
    if (author) {
      query.author = author;
    }

    const answers = await Answer.find(query)
      .populate("author", "username email")
      .populate("question", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Answer.countDocuments(query);

    res.json({
      answers,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete answer (admin can delete any answer)
router.delete("/answers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findByIdAndDelete(id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create global message
router.post("/global-messages", async (req, res) => {
  try {
    const { title, message, priority, targetAudience, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const globalMessage = new GlobalMessage({
      title,
      message,
      author: req.user._id,
      priority: priority || "medium",
      targetAudience: targetAudience || "all",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await globalMessage.save();
    await globalMessage.populate("author", "username");

    // Create notifications for all users (except admins if targetAudience is "users")
    let targetUsers;
    if (targetAudience === "users") {
      targetUsers = await User.find({ role: "user" });
    } else if (targetAudience === "admins") {
      targetUsers = await User.find({ role: "admin" });
    } else {
      targetUsers = await User.find({});
    }

    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      sender: req.user._id,
      type: "global_message",
      title: "Global Message",
      message: title,
      link: `/admin/messages/${globalMessage._id}`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ globalMessage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all global messages
router.get("/global-messages", async (req, res) => {
  try {
    const messages = await GlobalMessage.find({})
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update global message
router.put("/global-messages/:id", async (req, res) => {
  try {
    const { title, message, priority, targetAudience, isActive, expiresAt } = req.body;
    const { id } = req.params;

    const globalMessage = await GlobalMessage.findByIdAndUpdate(
      id,
      {
        title,
        message,
        priority,
        targetAudience,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      { new: true }
    ).populate("author", "username");

    if (!globalMessage) {
      return res.status(404).json({ message: "Global message not found" });
    }

    res.json({ globalMessage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete global message
router.delete("/global-messages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const globalMessage = await GlobalMessage.findByIdAndDelete(id);
    if (!globalMessage) {
      return res.status(404).json({ message: "Global message not found" });
    }

    res.json({ message: "Global message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; 