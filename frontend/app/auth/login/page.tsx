"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios"
import toast from "react-hot-toast"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // email or username
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Try login with email first, then username if email fails
      let res
      try {
        res = await axios.post("http://localhost:5000/api/auth/login", { email: identifier, password })
      } catch (err: any) {
        // If email login fails, try username
        res = await axios.post("http://localhost:5000/api/auth/login", { username: identifier, password })
      }
      localStorage.setItem("token", res.data.token)
      toast.success("Logged in successfully!")
      router.push("/")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary-600 mb-6 text-center">Login to StackIt</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
            <Input id="identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required autoFocus />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
        </form>
        <div className="text-sm text-gray-500 mt-4 text-center">
          Don&apos;t have an account? <Link href="/auth/register" className="text-primary-600 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  )
} 