const Notification = require("../models/Notification");

const createNotification = async (
  recipientId,
  senderId,
  type,
  title,
  message,
  questionId = null,
  answerId = null,
  io = null
) => {
  try {
    console.log("Creating notification:", {
      recipientId,
      senderId,
      type,
      title,
      message,
      questionId,
      answerId,
    });

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      question: questionId,
      answer: answerId,
      link: questionId ? `/questions/${questionId}` : null,
    });

    await notification.save();
    await notification.populate("sender", "username avatar");
    await notification.populate("question", "title");
    await notification.populate("answer", "content");

    console.log("Notification created successfully:", notification._id);

    // Emit socket event if io is available
    if (io) {
      io.to(`user-${recipientId}`).emit("new-notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

const createAnswerNotification = async (
  questionAuthorId,
  answerAuthorId,
  questionId,
  questionTitle,
  io = null
) => {
  console.log("Creating answer notification:", {
    questionAuthorId,
    answerAuthorId,
    questionId,
    questionTitle,
  });

  if (questionAuthorId.toString() === answerAuthorId.toString()) {
    console.log("Skipping notification - same user");
    return;
  }

  return await createNotification(
    questionAuthorId,
    answerAuthorId,
    "answer",
    "New Answer",
    `Someone answered your question: "${questionTitle}"`,
    questionId,
    null,
    io
  );
};

const createVoteNotification = async (
  contentAuthorId,
  voterId,
  contentType,
  contentId,
  questionId,
  questionTitle,
  io = null
) => {
  console.log("Creating vote notification:", {
    contentAuthorId,
    voterId,
    contentType,
    contentId,
    questionId,
    questionTitle,
  });

  if (contentAuthorId.toString() === voterId.toString()) {
    console.log("Skipping vote notification - same user");
    return;
  }

  return await createNotification(
    contentAuthorId,
    voterId,
    "vote",
    "New Vote",
    `Someone voted on your ${contentType} in: "${questionTitle}"`,
    questionId,
    contentType === "answer" ? contentId : null,
    io
  );
};

const createAcceptNotification = async (
  answerAuthorId,
  questionAuthorId,
  questionId,
  questionTitle,
  io = null
) => {
  console.log("Creating accept notification:", {
    answerAuthorId,
    questionAuthorId,
    questionId,
    questionTitle,
  });

  return await createNotification(
    answerAuthorId,
    questionAuthorId,
    "accept",
    "Answer Accepted",
    `Your answer was accepted for: "${questionTitle}"`,
    questionId,
    null,
    io
  );
};

module.exports = {
  createNotification,
  createAnswerNotification,
  createVoteNotification,
  createAcceptNotification,
};
