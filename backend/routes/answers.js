const express = require("express")
const Answer = require("../models/Answer")
const Question = require("../models/Question")
const router = express.Router()

// Get answers for a question
router.get("/question/:questionId", async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate("author", "username avatar")
      .sort({ votes: -1, createdAt: 1 })

    res.json({ answers })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create answer
router.post("/", async (req, res) => {
  try {
    const { content, questionId } = req.body
    const authorId = req.user?.id || "64f8b8b8b8b8b8b8b8b8b8b8" // Default user for demo

    const answer = new Answer({
      content,
      question: questionId,
      author: authorId,
    })

    await answer.save()
    await answer.populate("author", "username avatar")

    // Add answer to question
    await Question.findByIdAndUpdate(questionId, {
      $push: { answers: answer._id },
    })

    res.status(201).json({ answer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update answer
router.put("/:id", async (req, res) => {
  try {
    const { content } = req.body
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is author (for demo, allow all updates)
    // if (answer.author.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not authorized" })
    // }

    answer.content = content
    await answer.save()
    await answer.populate("author", "username avatar")

    res.json({ answer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete answer
router.delete("/:id", async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is author (for demo, allow all deletes)
    // if (answer.author.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not authorized" })
    // }

    // Remove answer from question
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id },
    })

    await Answer.findByIdAndDelete(req.params.id)

    res.json({ message: "Answer deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Vote on answer
router.post("/:id/vote", async (req, res) => {
  try {
    const { voteType } = req.body // "up" or "down"
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    if (voteType === "up") {
      answer.votes += 1
    } else if (voteType === "down") {
      answer.votes -= 1
    }

    await answer.save()

    res.json({ answer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Mark answer as accepted
router.post("/:id/accept", async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" })
    }

    // Check if user is question author (for demo, allow all accepts)
    // const question = await Question.findById(answer.question)
    // if (question.author.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Not authorized" })
    // }

    answer.isAccepted = true
    await answer.save()

    res.json({ answer })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router 