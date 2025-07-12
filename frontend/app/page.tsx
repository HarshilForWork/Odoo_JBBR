"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/lib/socket-context";
import { formatTimeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Menu,
  UserCircle,
  LogOut,
  Bell,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface Question {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  author: {
    username: string;
    avatar?: string;
  };
  votes: number;
  answers: any[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { socket } = useSocket();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showMyPosts, setShowMyPosts] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      try {
        setLoading(true);
        const endpoint = showMyPosts ? "/my-questions" : "";
        const response = await axios.get(
          `http://localhost:5001/api/questions${endpoint}`,
          {
            params: {
              page: 1,
              sort: sortBy,
              search: search,
            },
            headers: showMyPosts
              ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
              : {},
          }
        );
        setQuestions(response.data.questions);
        setTotalPages(response.data.totalPages);
        setCurrentPage(1);
      } catch (error) {
        toast.error("Failed to fetch questions");
      } finally {
        setLoading(false);
      }
    }, 300),
    [sortBy, showMyPosts]
  );

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  useEffect(() => {
    fetchQuestions();
  }, [sortBy, currentPage, showMyPosts]);

  // Real-time search effect
  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchQuestions();
    } else {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    if (socket) {
      socket.on("new-question", (question: Question) => {
        setQuestions((prev) => [question, ...prev]);
        toast.success("New question posted!");
        refreshNotifications();
      });

      socket.on("new-notification", (notification) => {
        console.log("Received new notification:", notification);
        setNotifications((prev) => [notification, ...prev]);
        toast.success("New notification received!");
      });

      if (user) {
        socket.emit("join-user", user._id);
      }

      return () => {
        socket.off("new-question");
        socket.off("new-notification");
      };
    }
  }, [socket, user]);

  // Check login state and fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5001/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data.user))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, []);

  // Fetch notifications and announcements
  useEffect(() => {
    if (user) {
      axios
        .get("http://localhost:5001/api/notifications", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          console.log("Fetched notifications:", res.data);
          setNotifications(res.data || []);
        })
        .catch((error) => {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
        });

      axios
        .get("http://localhost:5001/api/announcements")
        .then((res) => {
          console.log("Fetched announcements:", res.data.announcements);
          setAnnouncements(res.data.announcements || []);
        })
        .catch((error) => {
          console.error("Error fetching announcements:", error);
          setAnnouncements([]);
        });

      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setAnnouncements([]);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out!");
    window.location.reload();
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        "http://localhost:5001/api/notifications/read-all",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read!");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read.");
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const endpoint = showMyPosts ? "/my-questions" : "";
      const response = await axios.get(
        `http://localhost:5001/api/questions${endpoint}`,
        {
          params: {
            page: currentPage,
            sort: sortBy,
            search: searchTerm,
          },
          headers: showMyPosts
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {},
        }
      );
      setQuestions(response.data.questions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!user) return;

    try {
      const [notificationsRes, announcementsRes] = await Promise.all([
        axios.get("http://localhost:5001/api/notifications", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get("http://localhost:5001/api/announcements"),
      ]);

      setNotifications(notificationsRes.data || []);
      setAnnouncements(announcementsRes.data.announcements || []);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  };

  // Filter options
  const filterOptions = [
    { label: "Newest", value: "newest" },
    { label: "Unanswered", value: "unanswered" },
  ];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/" className="text-2xl font-bold text-primary-600">
                StackIt
              </Link>
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-md"
            >
              {showMyPosts ? "My Posts" : "All Posts"}
            </motion.span>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="relative">
                  <motion.button
                    className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none hover:bg-gray-100"
                    onClick={() => setShowNotifications((v) => !v)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        notifications.filter((n) => !n.isRead).length > 0 ||
                        announcements.length > 0
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    />
                    <AnimatePresence>
                      {(notifications.filter((n) => !n.isRead).length > 0 ||
                        announcements.length > 0) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                        >
                          {notifications.filter((n) => !n.isRead).length +
                            announcements.length}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 flex justify-between items-center">
                          <span>Notifications & Announcements</span>
                          {notifications.length > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        {announcements.length > 0 && (
                          <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
                            <div className="text-sm font-medium text-blue-900 mb-2 flex justify-between items-center">
                              <span>📢 Announcements</span>
                              <button
                                onClick={() => setAnnouncements([])}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Clear all
                              </button>
                            </div>
                            {announcements.map((announcement) => (
                              <div
                                key={announcement._id}
                                className="text-sm text-blue-800 mb-2"
                              >
                                <div className="font-medium">
                                  {announcement.title}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {new Date(
                                    announcement.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {notifications.length === 0 &&
                        announcements.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <div className="text-2xl mb-2">🔔</div>
                            <div className="text-sm">No notifications yet</div>
                            <div className="text-xs text-gray-400 mt-1">
                              You'll see notifications here when someone
                              interacts with your content
                            </div>
                          </div>
                        ) : (
                          notifications.map((notification, i) => (
                            <motion.div
                              key={notification._id || i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className={`px-4 py-3 border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.isRead ? "bg-blue-50" : ""
                              }`}
                              onClick={async () => {
                                if (!notification.isRead) {
                                  markNotificationAsRead(notification._id);
                                }

                                if (notification.question) {
                                  const questionId =
                                    typeof notification.question === "object"
                                      ? notification.question._id
                                      : notification.question;

                                  try {
                                    const response = await axios.get(
                                      `http://localhost:5001/api/questions/${questionId}`
                                    );
                                    if (response.data.question) {
                                      router.push(`/questions/${questionId}`);
                                      setShowNotifications(false);
                                    } else {
                                      toast.error("Question no longer exists");
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error verifying question:",
                                      error
                                    );
                                    toast.error(
                                      "Question not found or no longer exists"
                                    );
                                  }
                                } else if (notification.link) {
                                  router.push(notification.link);
                                  setShowNotifications(false);
                                }
                              }}
                            >
                              <div className="font-medium text-gray-900 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  {notification.type === "answer" && "💬"}
                                  {notification.type === "vote" && "👍"}
                                  {notification.type === "accept" && "✅"}
                                  {notification.type === "global_message" &&
                                    "📢"}
                                  {notification.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {!notification.isRead && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-2 h-2 bg-blue-500 rounded-full"
                                    />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotifications((prev) =>
                                        prev.filter(
                                          (n) => n._id !== notification._id
                                        )
                                      );
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                    title="Dismiss notification"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              <div className="text-gray-600 mb-1">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center justify-between">
                                <span>
                                  by{" "}
                                  {notification.sender?.username || "Unknown"}
                                </span>
                                <span>
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {(notification.question || notification.link) && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Click to view →
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {user ? (
                <div className="relative">
                  <motion.button
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
                  </motion.button>
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="font-semibold text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                        {user.role === "admin" && (
                          <Link href="/admin">
                            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <UserCircle className="h-4 w-4" /> Admin Dashboard
                            </button>
                          </Link>
                        )}
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setShowMobileFilters((v) => !v)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Announcements Section */}
      <AnimatePresence>
        {announcements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-4"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📢 Platform Announcements
              </h3>
              <div className="space-y-3">
                {announcements.map((announcement, index) => (
                  <motion.div
                    key={announcement._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg p-4 border border-blue-100"
                  >
                    <h4 className="font-medium text-blue-900 mb-2">
                      {announcement.title}
                    </h4>
                    <div
                      className="text-blue-800 text-sm"
                      dangerouslySetInnerHTML={{ __html: announcement.message }}
                    />
                    <div className="text-xs text-blue-600 mt-2">
                      By {announcement.author?.username || "Admin"} •{" "}
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
        {/* Filter Bar (Desktop) */}
        <motion.div
          className="hidden lg:flex items-center gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition"
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else if (user.role === "admin") {
                router.push("/admin");
              } else {
                router.push("/ask");
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" />
            {user?.role === "admin"
              ? "Send Universal Message"
              : "Ask New Question"}
          </motion.button>
          {user && user.role !== "admin" && (
            <motion.button
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                showMyPosts
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => setShowMyPosts(!showMyPosts)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showMyPosts ? "My Posts" : "All Posts"}
            </motion.button>
          )}
          <div className="flex items-center gap-2">
            {filterOptions.map((opt) => (
              <motion.div
                key={opt.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={sortBy === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(opt.value)}
                  className="capitalize"
                >
                  {opt.label}
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="flex-1 flex gap-2 justify-end">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {loading && searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filter Bar (Mobile) */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-col gap-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {loading && searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {filterOptions.map((opt) => (
                  <motion.div
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={sortBy === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(opt.value)}
                      className="capitalize w-full"
                    >
                      {opt.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <motion.button
                className="w-full flex items-center gap-2 mt-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition"
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else if (user.role === "admin") {
                    router.push("/admin");
                  } else {
                    router.push("/ask");
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                {user?.role === "admin"
                  ? "Send Universal Message"
                  : "Ask New Question"}
              </motion.button>
              {user && user.role !== "admin" && (
                <motion.button
                  className={`w-full flex items-center gap-2 mt-2 px-4 py-2 rounded-md transition ${
                    showMyPosts
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  onClick={() => setShowMyPosts(!showMyPosts)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {showMyPosts ? "My Posts" : "All Posts"}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        {searchTerm && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-gray-600"
          >
            Found {questions.length} question{questions.length !== 1 ? "s" : ""}{" "}
            for "{searchTerm}"
          </motion.div>
        )}
        <div className="space-y-4">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </motion.div>
          ) : questions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              {searchTerm ? (
                <>
                  <p className="text-lg font-medium mb-2">No questions found</p>
                  <p className="text-sm">
                    Try adjusting your search terms or browse all questions
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <p>No questions found. Ask your first question!</p>
              )}
            </motion.div>
          ) : (
            questions.map((question, index) => {
              if (!question || !question.author) {
                return (
                  <motion.div
                    key={question?._id || Math.random()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="text-red-500">Error loading question</div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={question._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-row md:flex-col items-center md:items-center md:w-16 w-full mb-2 md:mb-0 md:mr-4 gap-2 md:gap-0">
                    <div className="text-center text-xs text-gray-500 w-full">
                      <span className="block font-bold text-lg text-primary-600">
                        {question.answers ? question.answers.length : 0}
                      </span>
                      <span>ans</span>
                      {question.answers && question.answers.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {question.answers.some(
                            (answer: any) => answer.isAccepted
                          )
                            ? "✓ Solved"
                            : "No accepted answer"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Link href={`/questions/${question._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 cursor-pointer mb-1">
                        {question.title || "Untitled Question"}
                      </h3>
                    </Link>
                    <div className="text-gray-600 mb-2 line-clamp-2 text-sm">
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            question.description &&
                            question.description.length > 200
                              ? question.description.substring(0, 200) + "..."
                              : question.description || "",
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {question.tags &&
                        question.tags.map((tag) => (
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
                      <span>
                        {question.createdAt
                          ? formatTimeAgo(question.createdAt)
                          : "Unknown time"}
                      </span>
                      {question.updatedAt &&
                        question.updatedAt !== question.createdAt && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            edited
                          </span>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-8"
          >
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <motion.div
                    key={page}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full"
              >
                <h2 className="text-lg font-semibold mb-4">
                  Please Login or Sign Up
                </h2>
                <p className="mb-4">You must be logged in to ask a question.</p>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
