const mongoose = require("mongoose")
const User = require("../backend/models/User")
const Question = require("../backend/models/Question")
const Answer = require("../backend/models/Answer")

async function setupDatabase() {
  try {
    await mongoose.connect("mongodb://localhost:27017/stackit")

    // Create sample user
    const user = new User({
      username: "admin",
      email: "admin@stackit.com",
      password: "password123",
      role: "admin",
    })
    await user.save()

    // Create sample question
    const question = new Question({
      title: "How to join 2 columns in a data set to make a separate column in SQL?",
      description:
        "<p>I do not know the code for it as I am a beginner. As an example what I need to do is like there is a column 1 containing First name and column 2 consists of last name I want a column to combine...</p>",
      tags: ["sql", "database"],
      author: user._id,
    })
    await question.save()

    console.log("Database setup complete!")
    process.exit(0)
  } catch (error) {
    console.error("Database setup failed:", error)
    process.exit(1)
  }
}

setupDatabase()
