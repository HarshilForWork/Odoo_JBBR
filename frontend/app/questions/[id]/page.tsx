"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useSocket } from "@/lib/socket-context";
import { formatTimeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Check,
  Home,
  UserCircle,
  LogOut,
  Edit,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { TagInput } from "@/components/tag-input";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Answer {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  votes: number;
  upvotes: string[];
  downvotes: string[];
  isAccepted: boolean;
  createdAt: string;
  question?: string;
  images?: string[];
}

interface Question {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  images?: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  votes: number;
  upvotes: string[];
  downvotes: string[];
  answers: Answer[];
  views: number;
  createdAt: string;
}

export default function QuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAnswerContent, setEditAnswerContent] = useState("");
  const [answerImages, setAnswerImages] = useState<File[]>([]);
  const [answerImagePreview, setAnswerImagePreview] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    fetchQuestion();
  }, [params.id]);

  useEffect(() => {
    if (socket) {
      socket.on("new-answer", (answer: Answer) => {
        if (question && answer.question === question._id) {
          // Ensure the answer has the required author data
          const answerWithAuthor = {
            ...answer,
            author: answer.author || {
              _id: "",
              username: "Unknown",
              avatar: "",
            },
          };
          setQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  answers: [...prev.answers, answerWithAuthor],
                }
              : null
          );
          toast.success("New answer posted!");
        }
      });
      return () => {
        socket.off("new-answer");
      };
    }
  }, [socket, question]);

  // Check login state and fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data.user))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out!");
    window.location.reload();
  };

  const handleAnswerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + answerImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setAnswerImages((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAnswerImagePreview((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAnswerImage = (index: number) => {
    setAnswerImages((prev) => prev.filter((_, i) => i !== index));
    setAnswerImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/questions/${params.id}`
      );
      const questionData = response.data.question;

      // Ensure all answers have proper author data
      const answersWithAuthors = questionData.answers.map((answer: any) => ({
        ...answer,
        author: answer.author || { _id: "", username: "Unknown", avatar: "" },
      }));

      setQuestion({
        ...questionData,
        answers: answersWithAuthors,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Question not found");
        router.push("/");
      } else {
        toast.error("Failed to fetch question");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!answerContent.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("content", answerContent);
      formData.append("questionId", params.id as string);

      answerImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await axios.post(
        "http://localhost:5000/api/answers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAnswerContent("");
      setAnswerImages([]);
      setAnswerImagePreview([]);
      toast.success("Answer posted successfully!");
      if (question) {
        const answerWithAuthor = {
          ...response.data.answer,
          author: response.data.answer.author || {
            _id: "",
            username: "Unknown",
            avatar: "",
          },
        };
        setQuestion({
          ...question,
          answers: [...question.answers, answerWithAuthor],
        });
      }
    } catch (error) {
      toast.error("Failed to post answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (
    type: "up" | "down",
    itemId: string,
    itemType: "question" | "answer"
  ) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        itemType === "question"
          ? `http://localhost:5000/api/questions/${itemId}/vote`
          : `http://localhost:5000/api/answers/${itemId}/vote`;
      const response = await axios.post(
        endpoint,
        { voteType: type },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Both endpoints now return { question: updatedQuestion }
      if (question) {
        setQuestion(response.data.question);
      }
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const handleEditQuestion = () => {
    if (!question) return;
    setEditTitle(question.title);
    setEditDescription(question.description);
    setEditTags(question.tags);
    setEditingQuestion(true);
  };

  const handleSaveQuestion = async () => {
    if (!question) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/questions/${question._id}`,
        {
          title: editTitle,
          description: editDescription,
          tags: editTags,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestion(response.data.question);
      setEditingQuestion(false);
      toast.success("Question updated successfully!");
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question) return;
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/questions/${question._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Question deleted successfully!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const handleEditAnswer = (answerId: string, content: string) => {
    setEditingAnswer(answerId);
    setEditAnswerContent(content);
  };

  const handleSaveAnswer = async (answerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/answers/${answerId}`,
        {
          content: editAnswerContent,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (question) {
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                answers: prev.answers.map((answer) =>
                  answer._id === answerId
                    ? {
                        ...response.data.answer,
                        author: response.data.answer.author || {
                          _id: "",
                          username: "Unknown",
                          avatar: "",
                        },
                      }
                    : answer
                ),
              }
            : null
        );
      }
      setEditingAnswer(null);
      setEditAnswerContent("");
      toast.success("Answer updated successfully!");
    } catch (error) {
      toast.error("Failed to update answer");
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!confirm("Are you sure you want to delete this answer?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/answers/${answerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Answer deleted successfully!");
      fetchQuestion();
    } catch (error) {
      toast.error("Failed to delete answer");
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/answers/${answerId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestion(response.data.question);
      toast.success("Answer marked as accepted!");
    } catch (error) {
      toast.error("Failed to accept answer");
    }
  };

  const handleUnacceptAnswer = async (answerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/answers/${answerId}/unaccept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestion(response.data.question);
      toast.success("Answer unmarked as accepted!");
    } catch (error) {
      toast.error("Failed to unaccept answer");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Question not found</div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.header
        className="bg-white border-b border-gray-200 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/" className="text-2xl font-bold text-primary-600">
                StackIt
              </Link>
            </motion.div>
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              {user ? (
                <div className="relative">
                  <button
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                    onClick={() => setShowProfileMenu((v) => !v)}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline text-primary-600">
            Questions
          </Link>
          <span className="mx-2">&gt;</span>
          <span
            className="truncate max-w-xs inline-block align-bottom"
            title={question.title}
          >
            {question.title.slice(0, 40)}
            {question.title.length > 40 ? "..." : ""}
          </span>
        </div>
        {/* Question */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex gap-4">
            {/* Voting */}
            <div className="flex flex-col items-center space-y-2">
              <motion.button
                onClick={() => handleVote("up", question._id, "question")}
                className={`p-1 hover:bg-gray-100 rounded ${
                  user?._id &&
                  question.upvotes &&
                  question.upvotes.some((id) => id === user._id)
                    ? "text-blue-500"
                    : "text-gray-400"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ThumbsUp className="h-5 w-5" />
              </motion.button>
              <span className="text-lg font-semibold">{question.votes}</span>
              <motion.button
                onClick={() => handleVote("down", question._id, "question")}
                className={`p-1 hover:bg-gray-100 rounded ${
                  user?._id &&
                  question.downvotes &&
                  question.downvotes.some((id) => id === user._id)
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ThumbsDown className="h-5 w-5" />
              </motion.button>
            </div>
            {/* Question Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {editingQuestion ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {question.title}
                      {question.answers.some((answer) => answer.isAccepted) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Solved
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </h1>
                {user &&
                  question.author?._id === user._id &&
                  !editingQuestion && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditQuestion}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleDeleteQuestion}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
              </div>

              {editingQuestion ? (
                <div className="space-y-4 mb-4">
                  <RichTextEditor
                    value={editDescription}
                    onChange={setEditDescription}
                    placeholder="Edit your question description..."
                  />
                  <TagInput
                    value={editTags}
                    onChange={setEditTags}
                    placeholder="Tags (up to 5)"
                    maxTags={5}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveQuestion}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingQuestion(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prose max-w-none mb-4">
                    <div
                      dangerouslySetInnerHTML={{ __html: question.description }}
                    />
                  </div>

                  {/* Question Images */}
                  {question.images && question.images.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {question.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Question image ${index + 1}`}
                            className="max-w-xs max-h-64 object-cover rounded-md border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{question.views} views</span>
                  <span>{question.answers.length} answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>asked by {question.author?.username || "Unknown"}</span>
                  <span>{formatTimeAgo(question.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Answers */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {question.answers.length} Answer
            {question.answers.length !== 1 ? "s" : ""}
            {question.answers.length > 0 &&
              !question.answers.some((answer) => answer.isAccepted) && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (No accepted answer yet)
                </span>
              )}
          </h3>
          {question.answers
            .sort((a, b) => {
              // Sort accepted answers first
              if (a.isAccepted && !b.isAccepted) return -1;
              if (!a.isAccepted && b.isAccepted) return 1;
              // Then sort by votes (descending)
              if (a.votes !== b.votes) return b.votes - a.votes;
              // Finally sort by creation date (newest first)
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            })
            .map((answer) => (
              <motion.div
                key={answer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-lg shadow-sm border p-6 ${
                  answer.isAccepted
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                {answer.isAccepted && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-green-100 rounded-md">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      ✓ Accepted Answer
                    </span>
                  </div>
                )}
                <div className="flex gap-4">
                  {/* Voting */}
                  <div className="flex flex-col items-center space-y-2">
                    <motion.button
                      onClick={() => handleVote("up", answer._id, "answer")}
                      className={`p-1 hover:bg-gray-100 rounded ${
                        user?._id &&
                        answer.upvotes &&
                        answer.upvotes.some((id) => id === user._id)
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsUp className="h-5 w-5" />
                    </motion.button>
                    <span className="text-lg font-semibold">
                      {answer.votes}
                    </span>
                    <motion.button
                      onClick={() => handleVote("down", answer._id, "answer")}
                      className={`p-1 hover:bg-gray-100 rounded ${
                        user?._id &&
                        answer.downvotes &&
                        answer.downvotes.some((id) => id === user._id)
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <ThumbsDown className="h-5 w-5" />
                    </motion.button>
                    {answer.isAccepted && (
                      <motion.div
                        className="mt-2 p-1 bg-green-100 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </motion.div>
                    )}
                  </div>
                  {/* Answer Content */}
                  <div className="flex-1">
                    {editingAnswer === answer._id ? (
                      <div className="space-y-4 mb-4">
                        <RichTextEditor
                          value={editAnswerContent}
                          onChange={setEditAnswerContent}
                          placeholder="Edit your answer..."
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveAnswer(answer._id)}>
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingAnswer(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="prose max-w-none mb-4">
                          <div
                            dangerouslySetInnerHTML={{ __html: answer.content }}
                          />
                        </div>

                        {/* Answer Images */}
                        {answer.images && answer.images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {answer.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Answer image ${index + 1}`}
                                  className="max-w-xs max-h-64 object-cover rounded-md border border-gray-200"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>
                              answered by {answer.author?.username || "Unknown"}
                            </span>
                            <span>{formatTimeAgo(answer.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            {user && answer.author?._id === user._id && (
                              <>
                                <motion.button
                                  onClick={() =>
                                    handleEditAnswer(answer._id, answer.content)
                                  }
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Edit className="h-3 w-3" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteAnswer(answer._id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </motion.button>
                              </>
                            )}
                            {user && question?.author?._id === user._id && (
                              <>
                                {answer.isAccepted ? (
                                  <motion.button
                                    onClick={() =>
                                      handleUnacceptAnswer(answer._id)
                                    }
                                    className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                                    title="Unaccept Answer"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="h-3 w-3" />
                                  </motion.button>
                                ) : (
                                  <motion.button
                                    onClick={() =>
                                      handleAcceptAnswer(answer._id)
                                    }
                                    className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                                    title="Accept Answer"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </motion.button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
        {/* Add Answer */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Submit Your Answer
          </h3>
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor
              value={answerContent}
              onChange={setAnswerContent}
              placeholder="Write your answer here..."
            />

            {/* Image Upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Images (max 5, 10MB each)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {answerImagePreview.map((preview, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <motion.button
                      type="button"
                      onClick={() => removeAnswerImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 flex items-center justify-center"
                      title="Remove image"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                ))}
                <label htmlFor="answer-image-upload" className="cursor-pointer">
                  <motion.div
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Upload className="h-6 w-6" />
                  </motion.div>
                  <input
                    type="file"
                    id="answer-image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleAnswerImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Posting..." : "Submit"}
                </Button>
              </motion.div>
            </div>
          </form>
        </motion.div>
        {/* Login Prompt Modal (placeholder) */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Login Required</h2>
              <p className="mb-4">
                You must be logged in to vote. Please login or sign up to
                continue.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </Button>
                <Link href="/auth/login">
                  <Button>Login</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">
                Please Login or Sign Up
              </h2>
              <p className="mb-4">
                You must be logged in to answer a question.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => router.push("/auth/login")}>
                  Login
                </Button>
                <Button onClick={() => router.push("/auth/register")}>
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
