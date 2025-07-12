const express = require("express")
const Question = require("../models/Question")
const router = express.Router()

// Get all questions with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "newest", search = "" } = req.query
    const skip = (page - 1) * limit

    let query = {}
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      }
    }

    let sortOption = {}
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 }
        break
      case "oldest":
        sortOption = { createdAt: 1 }
        break
      case "votes":
        sortOption = { votes: -1 }
        break
      case "unanswered":
        query.answers = { $size: 0 }
        sortOption = { createdAt: -1 }
        break
      default:
        sortOption = { createdAt: -1 }
    }

    const questions = await Question.find(query)
      .populate("author", "username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Question.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    res.json({
      questions,
      totalPages,
      currentPage: parseInt(page),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get single question
router.get("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("author", "username avatar")
      .populate({
        path: "answers",
        populate: { path: "author", select: "username avatar" },
      })

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Increment views
    question.views += 1
    await question.save()

    res.json({ question })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create question
router.post("/", async (req, res) => {
  try {
    const { title, description, tags } = req.body
    const authorId = req.user?.id || "64f8b8b8b8b8b8b8b8b8b8b8" // Default user for demo

    const question = new Question({
      title,
      description,
      tags: tags || [],
      author: authorId,
    })

    await question.save()
    await question.populate("author", "username avatar")

    res.status(201).json({ question })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update question
router.put("/:id", async (req, res) => {
  try {
    const { title, description, tags } = req.body
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is author (for demo, allow all updates)
    // if (question.author.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not authorized" })
    // }

    question.title = title || question.title
    question.description = description || question.description
    question.tags = tags || question.tags

    await question.save()
    await question.populate("author", "username avatar")

    res.json({ question })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete question
router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    // Check if user is author (for demo, allow all deletes)
    // if (question.author.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not authorized" })
    // }

    await Question.findByIdAndDelete(req.params.id)

    res.json({ message: "Question deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Vote on question
router.post("/:id/vote", async (req, res) => {
  try {
    const { voteType } = req.body // "up" or "down"
    const question = await Question.findById(req.params.id)

    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }

    if (voteType === "up") {
      question.votes += 1
    } else if (voteType === "down") {
      question.votes -= 1
    }

    await question.save()

    res.json({ question })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router 