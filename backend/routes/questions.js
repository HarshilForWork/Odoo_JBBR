const express = require("express");
const Question = require("../models/Question");
const auth = require("../middleware/auth");
const { createVoteNotification } = require("../utils/notifications");
const router = express.Router();

// Get all questions with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "newest", search = "" } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "votes":
        sortOption = { votes: -1 };
        break;
      case "unanswered":
        query.answers = { $size: 0 };
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const questions = await Question.find(query)
      .populate("author", "username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      questions,
      totalPages,
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single question
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "username avatar")
      .populate({
        path: "answers",
        populate: { path: "author", select: "username avatar" },
      });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Increment views
    question.views += 1;
    await question.save();

    res.json({ question });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create question
router.post("/", auth, async (req, res) => {
  try {
    const upload = req.app.locals.upload;

    // Handle file upload
    upload.array("images", 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        const { title, description, tags } = req.body;
        const authorId = req.user._id;

        // Process uploaded images
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            imageUrls.push(`http://localhost:5000/uploads/${file.filename}`);
          });
        }

        const question = new Question({
          title,
          description,
          tags: tags ? JSON.parse(tags) : [],
          images: imageUrls,
          author: authorId,
        });

        await question.save();
        await question.populate("author", "username avatar");

        res.status(201).json({ question });
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update question
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if user is author
    if (question.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this question" });
    }

    question.title = title || question.title;
    question.description = description || question.description;
    question.tags = tags || question.tags;

    await question.save();
    await question.populate("author", "username avatar");

    res.json({ question });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete question
router.delete("/:id", auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if user is author
    if (question.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this question" });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Vote on question
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body; // "up" or "down"
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Ensure votes arrays are initialized
    if (!question.upvotes) question.upvotes = [];
    if (!question.downvotes) question.downvotes = [];

    const userId = req.user._id;
    const hasUpvoted = question.upvotes.some(
      (id) => id.toString() === userId.toString()
    );
    const hasDownvoted = question.downvotes.some(
      (id) => id.toString() === userId.toString()
    );

    // Remove existing votes
    if (hasUpvoted) {
      question.upvotes = question.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      question.votes -= 1;
    }
    if (hasDownvoted) {
      question.downvotes = question.downvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      question.votes += 1;
    }

    // Add new vote
    if (voteType === "up") {
      if (!hasUpvoted) {
        question.upvotes.push(userId);
        question.votes += 1;
      }
    } else if (voteType === "down") {
      if (!hasDownvoted) {
        question.downvotes.push(userId);
        question.votes -= 1;
      }
    }

    await question.save();

    // Create vote notification
    const io = req.app.locals.io;
    await createVoteNotification(
      question.author,
      userId,
      "question",
      question._id,
      question._id,
      question.title,
      io
    );

    // Return the updated question with populated answers
    const updatedQuestion = await Question.findById(question._id)
      .populate("author", "username avatar")
      .populate({
        path: "answers",
        populate: { path: "author", select: "username avatar" },
      });

    res.json({ question: updatedQuestion });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
