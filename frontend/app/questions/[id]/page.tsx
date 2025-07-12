"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { useSocket } from "@/lib/socket-context"
import { formatTimeAgo } from "@/lib/utils"
import { ArrowLeft, ThumbsUp, ThumbsDown, Check, Home, UserCircle, LogOut } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import toast from "react-hot-toast"

interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

interface Answer {
  _id: string
  content: string
  author: {
    username: string
    avatar?: string
  }
  votes: number
  isAccepted: boolean
  createdAt: string
}

interface Question {
  _id: string
  title: string
  description: string
  tags: string[]
  author: {
    username: string
    avatar?: string
  }
  votes: number
  answers: Answer[]
  views: number
  createdAt: string
}

export default function QuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { socket } = useSocket()

  useEffect(() => {
    fetchQuestion()
  }, [params.id])

  useEffect(() => {
    if (socket) {
      socket.on("new-answer", (answer: Answer) => {
        if (question && answer.question === question._id) {
          setQuestion(prev => prev ? {
            ...prev,
            answers: [...prev.answers, answer]
          } : null)
          toast.success("New answer posted!")
        }
      })
      return () => {
        socket.off("new-answer")
      }
    }
  }, [socket, question])

  // Check login state and fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.get("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setUser(res.data.user))
        .catch(() => setUser(null))
    } else {
      setUser(null)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast.success("Logged out!")
    window.location.reload()
  }

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:5000/api/questions/${params.id}`)
      setQuestion(response.data.question)
    } catch (error) {
      toast.error("Failed to fetch question")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (!answerContent.trim()) {
      toast.error("Please enter an answer")
      return
    }
    try {
      setSubmitting(true)
      const response = await axios.post("http://localhost:5000/api/answers", {
        content: answerContent,
        questionId: params.id,
      })
      setAnswerContent("")
      toast.success("Answer posted successfully!")
      if (question) {
        setQuestion({
          ...question,
          answers: [...question.answers, response.data.answer]
        })
      }
    } catch (error) {
      toast.error("Failed to post answer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (type: "up" | "down", itemId: string, itemType: "question" | "answer") => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    try {
      const endpoint = itemType === "question" 
        ? `http://localhost:5000/api/questions/${itemId}/vote`
        : `http://localhost:5000/api/answers/${itemId}/vote`
      await axios.post(endpoint, { voteType: type })
      if (itemType === "question" && question) {
        setQuestion(prev => prev ? {
          ...prev,
          votes: prev.votes + (type === "up" ? 1 : -1)
        } : null)
      } else if (itemType === "answer" && question) {
        setQuestion(prev => prev ? {
          ...prev,
          answers: prev.answers.map(answer => 
            answer._id === itemId 
              ? { ...answer, votes: answer.votes + (type === "up" ? 1 : -1) }
              : answer
          )
        } : null)
      }
    } catch (error) {
      toast.error("Failed to vote")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading question...</div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Question not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              StackIt
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              {user ? (
                <div className="relative">
                  <button
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                    onClick={() => setShowProfileMenu((v) => !v)}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <UserCircle className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
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
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline text-primary-600">Questions</Link>
          <span className="mx-2">&gt;</span>
          <span className="truncate max-w-xs inline-block align-bottom" title={question.title}>{question.title.slice(0, 40)}{question.title.length > 40 ? "..." : ""}</span>
        </div>
        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-4">
            {/* Voting */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleVote("up", question._id, "question")}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ThumbsUp className="h-5 w-5 text-gray-400" />
              </button>
              <span className="text-lg font-semibold">{question.votes}</span>
              <button
                onClick={() => handleVote("down", question._id, "question")}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ThumbsDown className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {/* Question Content */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
              <div className="prose max-w-none mb-4">
                <div dangerouslySetInnerHTML={{ __html: question.description }} />
              </div>
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
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{question.views} views</span>
                  <span>{question.answers.length} answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>asked by {question.author.username}</span>
                  <span>{formatTimeAgo(question.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Answers */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
          </h2>
          {question.answers.map((answer) => (
            <div key={answer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex gap-4">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleVote("up", answer._id, "answer")}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ThumbsUp className="h-5 w-5 text-gray-400" />
                  </button>
                  <span className="text-lg font-semibold">{answer.votes}</span>
                  <button
                    onClick={() => handleVote("down", answer._id, "answer")}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ThumbsDown className="h-5 w-5 text-gray-400" />
                  </button>
                  {answer.isAccepted && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
                {/* Answer Content */}
                <div className="flex-1">
                  <div className="prose max-w-none mb-4">
                    <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>answered by {answer.author.username}</span>
                      <span>{formatTimeAgo(answer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Add Answer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <RichTextEditor
              value={answerContent}
              onChange={setAnswerContent}
              placeholder="Write your answer here..."
            />
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
        {/* Login Prompt Modal (placeholder) */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Login Required</h2>
              <p className="mb-4">You must be logged in to vote. Please login or sign up to continue.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
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
              <h2 className="text-lg font-semibold mb-4">Please Login or Sign Up</h2>
              <p className="mb-4">You must be logged in to answer a question.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAuthModal(false)}>Cancel</Button>
                <Button onClick={() => router.push("/auth/login")}>Login</Button>
                <Button onClick={() => router.push("/auth/register")}>Sign Up</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 