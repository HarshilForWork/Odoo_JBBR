"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  Users,
  MessageSquare,
  Trash2,
  Edit,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  BarChart3,
  Settings,
  Search,
  Filter,
  Eye,
  Ban,
  Unlock,
  Crown,
  TrendingUp,
  Activity,
  Globe,
  Bell,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason?: string;
  bannedBy?: {
    username: string;
  };
  bannedAt?: string;
  createdAt: string;
  questionCount: number;
  answerCount: number;
  lastLogin: string;
}

interface Question {
  _id: string;
  title: string;
  description: string;
  author: {
    username: string;
    email: string;
  };
  votes: number;
  answers: any[];
  createdAt: string;
}

interface Answer {
  _id: string;
  content: string;
  author: {
    username: string;
    email: string;
  };
  question: {
    title: string;
  };
  votes: number;
  createdAt: string;
}

interface GlobalMessage {
  _id: string;
  title: string;
  message: string;
  author: {
    username: string;
  };
  priority: string;
  targetAudience: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  totalAnswers: number;
  adminUsers: number;
  bannedUsers: number;
  activeUsers: number;
  recentQuestions: number;
  recentAnswers: number;
  topUsers: Array<{
    username: string;
    questionCount: number;
    answerCount: number;
  }>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("project");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGlobalMessageForm, setShowGlobalMessageForm] = useState(false);
  const [globalMessageTitle, setGlobalMessageTitle] = useState("");
  const [globalMessageContent, setGlobalMessageContent] = useState("");
  const [globalMessagePriority, setGlobalMessagePriority] = useState("medium");
  const [globalMessageTarget, setGlobalMessageTarget] = useState("all");
  const [editingGlobalMessage, setEditingGlobalMessage] =
    useState<GlobalMessage | null>(null);

  // User management states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userQuestions, setUserQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  // Search and filter states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userBanFilter, setUserBanFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats
      const statsRes = await axios.get(
        "http://localhost:5000/api/admin/stats",
        { headers }
      );
      setStats(statsRes.data);

      // Fetch users
      const usersRes = await axios.get(
        "http://localhost:5000/api/admin/users",
        { headers }
      );
      setUsers(usersRes.data.users);

      // Fetch questions
      const questionsRes = await axios.get(
        "http://localhost:5000/api/admin/questions",
        { headers }
      );
      setQuestions(questionsRes.data.questions);

      // Fetch answers
      const answersRes = await axios.get(
        "http://localhost:5000/api/admin/answers",
        { headers }
      );
      setAnswers(answersRes.data.answers);

      // Fetch global messages
      const messagesRes = await axios.get(
        "http://localhost:5000/api/admin/global-messages",
        { headers }
      );
      setGlobalMessages(messagesRes.data.messages);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User role updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update user role"
      );
    }
  };

  const handleBanUser = async (user: User) => {
    setUserToBan(user);
    setShowBanModal(true);
  };

  const confirmBanUser = async () => {
    if (!userToBan) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admin/users/${userToBan._id}/ban`,
        { isBanned: true, banReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User banned successfully");
      setShowBanModal(false);
      setBanReason("");
      setUserToBan(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/ban`,
        { isBanned: false, banReason: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User unbanned successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unban user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this question? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/questions/${questionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Question deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete question"
      );
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this answer? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/answers/${answerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Answer deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete answer");
    }
  };

  const handleViewUserDetails = async (user: User) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUserQuestions(response.data.questions);
      setUserAnswers(response.data.answers);
      setSelectedUser(user);
      setShowUserDetails(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch user details"
      );
    }
  };

  const handleCreateGlobalMessage = async () => {
    if (!globalMessageTitle.trim() || !globalMessageContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/admin/global-messages",
        {
          title: globalMessageTitle.trim(),
          message: globalMessageContent,
          priority: globalMessagePriority,
          targetAudience: globalMessageTarget,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Global message sent successfully");
      setGlobalMessageTitle("");
      setGlobalMessageContent("");
      setGlobalMessagePriority("medium");
      setGlobalMessageTarget("all");
      setShowGlobalMessageForm(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to send global message"
      );
    }
  };

  const handleDeleteGlobalMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this global message?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/admin/global-messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Global message deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete global message"
      );
    }
  };

  const handleCleanupNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        "http://localhost:5000/api/notifications/cleanup",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to cleanup notifications"
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole =
      userRoleFilter === "all" || user.role === userRoleFilter;
    const matchesBan =
      userBanFilter === "all" ||
      (userBanFilter === "banned" && user.isBanned) ||
      (userBanFilter === "active" && !user.isBanned);

    return matchesSearch && matchesRole && matchesBan;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage users, content, and platform communications
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab("project")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "project"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-2" />
            Project Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="inline-block w-4 h-4 mr-2" />
            User Dashboard
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "messages"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Globe className="inline-block w-4 h-4 mr-2" />
            Global Messages
          </button>
        </div>

        {/* Project Dashboard Tab */}
        {activeTab === "project" && stats && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.activeUsers} active, {stats.bannedUsers} banned
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Questions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalQuestions}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.recentQuestions} this week
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Answers
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalAnswers}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.recentAnswers} this week
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Crown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Admin Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.adminUsers}
                    </p>
                    <p className="text-xs text-gray-500">
                      Platform administrators
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Admin Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleCleanupNotifications}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Cleanup Orphaned Notifications
                </Button>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Contributors
              </h3>
              <div className="space-y-3">
                {stats.topUsers.map((user, index) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-400 mr-3">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.questionCount} questions • {user.answerCount}{" "}
                          answers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user.questionCount + user.answerCount} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Dashboard Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                  <option value="guest">Guests</option>
                </select>
                <select
                  value={userBanFilter}
                  onChange={(e) => setUserBanFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Only</option>
                  <option value="banned">Banned Only</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded-md px-2 py-1"
                          >
                            <option value="guest">Guest</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isBanned ? (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Banned
                              </span>
                              {user.banReason && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {user.banReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{user.questionCount} questions</div>
                          <div>{user.answerCount} answers</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewUserDetails(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Unban User"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Global Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Global Messages
              </h2>
              <Button onClick={() => setShowGlobalMessageForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Send Global Message
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {globalMessages.map((message) => (
                      <tr key={message._id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {message.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {message.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {message.author.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.priority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : message.priority === "high"
                                ? "bg-orange-100 text-orange-800"
                                : message.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {message.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {message.targetAudience}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              message.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {message.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              handleDeleteGlobalMessage(message._id)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  User Details: {selectedUser.username}
                </h3>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Questions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Questions ({userQuestions.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userQuestions.map((question) => (
                      <div
                        key={question._id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {question.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                question.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Answers */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Answers ({userAnswers.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userAnswers.map((answer) => (
                      <div
                        key={answer._id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {answer.question.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {answer.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(answer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnswer(answer._id)}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {showBanModal && userToBan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ban User: {userToBan.username}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ban Reason
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter reason for banning this user..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBanModal(false);
                      setBanReason("");
                      setUserToBan(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmBanUser}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Ban User
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Message Form Modal */}
        {showGlobalMessageForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Global Message
                </h3>
                <button
                  onClick={() => {
                    setShowGlobalMessageForm(false);
                    setGlobalMessageTitle("");
                    setGlobalMessageContent("");
                    setGlobalMessagePriority("medium");
                    setGlobalMessageTarget("all");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    value={globalMessageTitle}
                    onChange={(e) => setGlobalMessageTitle(e.target.value)}
                    placeholder="Enter message title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <RichTextEditor
                    value={globalMessageContent}
                    onChange={setGlobalMessageContent}
                    placeholder="Enter your global message..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={globalMessagePriority}
                      onChange={(e) => setGlobalMessagePriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={globalMessageTarget}
                      onChange={(e) => setGlobalMessageTarget(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Users</option>
                      <option value="users">Regular Users Only</option>
                      <option value="admins">Admins Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGlobalMessageForm(false);
                      setGlobalMessageTitle("");
                      setGlobalMessageContent("");
                      setGlobalMessagePriority("medium");
                      setGlobalMessageTarget("all");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGlobalMessage}>
                    Send Global Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
