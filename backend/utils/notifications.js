const Notification = require("../models/Notification")

const createNotification = async (recipientId, senderId, type, title, message, questionId = null, answerId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      question: questionId,
      answer: answerId,
      link: questionId ? `/questions/${questionId}` : null,
    })

    await notification.save()
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

const createAnswerNotification = async (questionAuthorId, answerAuthorId, questionId, questionTitle) => {
  if (questionAuthorId.toString() === answerAuthorId.toString()) return

  return await createNotification(
    questionAuthorId,
    answerAuthorId,
    "answer",
    "New Answer",
    `Someone answered your question: "${questionTitle}"`,
    questionId
  )
}

const createVoteNotification = async (contentAuthorId, voterId, contentType, contentId, questionId, questionTitle) => {
  if (contentAuthorId.toString() === voterId.toString()) return

  return await createNotification(
    contentAuthorId,
    voterId,
    "vote",
    "New Vote",
    `Someone voted on your ${contentType} in: "${questionTitle}"`,
    questionId,
    contentType === "answer" ? contentId : null
  )
}

const createAcceptNotification = async (answerAuthorId, questionAuthorId, questionId, questionTitle) => {
  return await createNotification(
    answerAuthorId,
    questionAuthorId,
    "accept",
    "Answer Accepted",
    `Your answer was accepted for: "${questionTitle}"`,
    questionId
  )
}

module.exports = {
  createNotification,
  createAnswerNotification,
  createVoteNotification,
  createAcceptNotification,
} 