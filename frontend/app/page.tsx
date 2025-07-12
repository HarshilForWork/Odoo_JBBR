"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/lib/socket-context"
import { formatTimeAgo } from "@/lib/utils"
import { Search, Plus, Filter, ChevronDown, Menu, UserCircle, LogOut, Bell } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
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
  answers: any[]
  views: number
  createdAt: string
}

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { socket } = useSocket()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetchQuestions()
  }, [sortBy, currentPage])

  useEffect(() => {
    if (socket) {
      socket.on("new-question", (question: Question) => {
        setQuestions((prev) => [question, ...prev])
        toast.success("New question posted!")
      })
      return () => {
        socket.off("new-question")
      }
    }
  }, [socket])

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

  // Fetch notifications (placeholder, replace with real API if needed)
  useEffect(() => {
    if (user) {
      axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then(res => setNotifications(res.data.notifications || []))
        .catch(() => setNotifications([]))
    } else {
      setNotifications([])
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast.success("Logged out!")
    window.location.reload()
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:5000/api/questions`, {
        params: {
          page: currentPage,
          sort: sortBy,
          search: searchTerm,
        },
      })
      setQuestions(response.data.questions)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Failed to fetch questions")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchQuestions()
  }

  // Filter options
  const filterOptions = [
    { label: "Newest", value: "newest" },
    { label: "Unanswered", value: "unanswered" },
    { label: "More", value: "more" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                StackIt
              </Link>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="relative">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none hover:bg-gray-100"
                    onClick={() => setShowNotifications((v) => !v)}
                  >
                    <Bell className="h-5 w-5 text-gray-500" />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Notifications</div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-500">No notifications to display.</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="px-4 py-3 border-b border-gray-100 text-sm text-gray-700">
                            {n.message || "Notification"}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
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
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowMobileFilters((v) => !v)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
        {/* Filter Bar (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 mb-6">
          <button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition"
            onClick={() => user ? router.push("/ask") : setShowAuthModal(true)}
          >
            <Plus className="h-4 w-4" /> Ask New Question
          </button>
          <div className="flex items-center gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={sortBy === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(opt.value)}
                className="capitalize"
              >
                {opt.label}
                {opt.value === "more" && <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 justify-end">
                  <Input
                    type="text"
              placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
                  />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </form>
                </div>

        {/* Filter Bar (Mobile) */}
        {showMobileFilters && (
          <div className="lg:hidden bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-col gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-5 w-5" />
                  </Button>
            </form>
            <div className="flex flex-col gap-2">
              {filterOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sortBy === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(opt.value)}
                  className="capitalize w-full"
                  >
                  {opt.label}
                  {opt.value === "more" && <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              ))}
            </div>
            <button
              className="w-full flex items-center gap-2 mt-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition"
              onClick={() => user ? router.push("/ask") : setShowAuthModal(true)}
            >
              <Plus className="h-4 w-4" /> Ask New Question
            </button>
          </div>
        )}

            {/* Questions List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No questions found. Be the first to ask!</div>
              ) : (
            questions.map((question) => {
              if (!question || !question.author) {
                return (
                  <div
                    key={question?._id || Math.random()}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="text-red-500">Error loading question</div>
                  </div>
                )
              }
              
              return (
                <div
                  key={question._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center hover:shadow-md transition-shadow"
                  >
                  <div className="flex flex-row md:flex-col items-center md:items-start md:w-16 w-full mb-2 md:mb-0 md:mr-4 gap-2 md:gap-0">
                    <div className="text-center text-xs text-gray-500">
                      <span className="block font-bold text-lg text-primary-600">{question.answers ? question.answers.length : 0}</span>
                      <span>ans</span>
                    </div>
                  </div>
                      <div className="flex-1">
                        <Link href={`/questions/${question._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer mb-1">
                        {question.title || "Untitled Question"}
                          </h3>
                        </Link>
                    <div className="text-gray-600 mb-2 line-clamp-2 text-sm">
                      <div dangerouslySetInnerHTML={{ __html: question.description && question.description.length > 200 ? question.description.substring(0, 200) + "..." : question.description || "" }} />
                        </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {question.tags && question.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>by {question.author?.username || "Unknown"}</span>
                      <span>{question.createdAt ? formatTimeAgo(question.createdAt) : "Unknown time"}</span>
                    </div>
                  </div>
                </div>
              )
            })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              </div>
            )}
        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Please Login or Sign Up</h2>
              <p className="mb-4">You must be logged in to ask a question.</p>
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
