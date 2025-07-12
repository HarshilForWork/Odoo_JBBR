const express = require("express");
const Answer = require("../models/Answer");
const Question = require("../models/Question");
const auth = require("../middleware/auth");
const {
  createAnswerNotification,
  createVoteNotification,
  createAcceptNotification,
} = require("../utils/notifications");
const router = express.Router();

// Get answers for a question
router.get("/question/:questionId", async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate("author", "username avatar")
      .sort({ votes: -1, createdAt: 1 });

    res.json({ answers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create answer
router.post("/", auth, async (req, res) => {
  try {
    const upload = req.app.locals.upload;

    // Handle file upload
    upload.array("images", 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        const { content, questionId } = req.body;
        const authorId = req.user._id;

        // Process uploaded images
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            imageUrls.push(`http://localhost:5000/uploads/${file.filename}`);
          });
        }

        const answer = new Answer({
          content,
          images: imageUrls,
          question: questionId,
          author: authorId,
        });

        await answer.save();
        await answer.populate("author", "username avatar");

        // Add answer to question
        const question = await Question.findByIdAndUpdate(questionId, {
          $push: { answers: answer._id },
        });

        // Create notification for question author
        if (question) {
          const io = req.app.locals.io;
          await createAnswerNotification(
            question.author,
            authorId,
            questionId,
            question.title,
            io
          );
        }

        res.status(201).json({ answer });
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update answer
router.put("/:id", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user is author
    if (answer.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this answer" });
    }

    answer.content = content;
    await answer.save();
    await answer.populate("author", "username avatar");

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete answer
router.delete("/:id", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user is author
    if (answer.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this answer" });
    }

    // Remove answer from question
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id },
    });

    await Answer.findByIdAndDelete(req.params.id);

    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Vote on answer
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { voteType } = req.body; // "up" or "down"
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Ensure votes arrays are initialized
    if (!answer.upvotes) answer.upvotes = [];
    if (!answer.downvotes) answer.downvotes = [];

    const userId = req.user._id;
    const hasUpvoted = answer.upvotes.some(
      (id) => id.toString() === userId.toString()
    );
    const hasDownvoted = answer.downvotes.some(
      (id) => id.toString() === userId.toString()
    );

    // Remove existing votes
    if (hasUpvoted) {
      answer.upvotes = answer.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      answer.votes -= 1;
    }
    if (hasDownvoted) {
      answer.downvotes = answer.downvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
      answer.votes += 1;
    }

    // Add new vote
    if (voteType === "up") {
      if (!hasUpvoted) {
        answer.upvotes.push(userId);
        answer.votes += 1;
      }
    } else if (voteType === "down") {
      if (!hasDownvoted) {
        answer.downvotes.push(userId);
        answer.votes -= 1;
      }
    }

    await answer.save();
    await answer.populate("author", "username avatar");

    // Create vote notification
    const question = await Question.findById(answer.question);
    if (question) {
      const io = req.app.locals.io;
      await createVoteNotification(
        answer.author,
        userId,
        "answer",
        answer._id,
        answer.question,
        question.title,
        io
      );
    }

    const updatedQuestion = await Question.findById(answer.question)
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

// Mark answer as accepted
router.post("/:id/accept", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user is question author
    const question = await Question.findById(answer.question);
    if (!question || question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    answer.isAccepted = true;
    await answer.save();
    await answer.populate("author", "username avatar");

    // Create accept notification
    const io = req.app.locals.io;
    await createAcceptNotification(
      answer.author,
      question.author,
      question._id,
      question.title,
      io
    );

    // Return the updated question with all answers
    const updatedQuestion = await Question.findById(answer.question)
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

// Unmark answer as accepted
router.post("/:id/unaccept", auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user is question author
    const question = await Question.findById(answer.question);
    if (!question || question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    answer.isAccepted = false;
    await answer.save();
    await answer.populate("author", "username avatar");

    // Return the updated question with all answers
    const updatedQuestion = await Question.findById(answer.question)
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
