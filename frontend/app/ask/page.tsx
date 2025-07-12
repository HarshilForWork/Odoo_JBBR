"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Bell, Home, UserCircle, LogOut } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import toast from "react-hot-toast"

interface User {
  _id: string
  username: string
  email: string
  avatar?: string
}

export default function AskPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }
    try {
      setLoading(true)
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      const token = localStorage.getItem("token")
      const response = await axios.post("http://localhost:5000/api/questions", {
        title: title.trim(),
        description,
        tags: tagArray,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Question posted successfully!")
      router.push(`/questions/${response.data.question._id}`)
    } catch (error) {
      toast.error("Failed to post question")
    } finally {
      setLoading(false)
    }
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
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask a Question</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                id="title"
                type="text"
                placeholder="What's your question? Be specific."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">
                {title.length}/200 characters
              </p>
            </div>
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Provide all the information someone would need to answer your question..."
              />
            </div>
            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., javascript, react, nodejs"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add up to 5 tags separated by commas
              </p>
            </div>
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Posting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
