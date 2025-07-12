export interface User {
    _id: string
    username: string
    email: string
    role: "guest" | "user" | "admin"
    avatar?: string
    createdAt: Date
  }
  
  export interface Question {
    _id: string
    title: string
    description: string
    tags: string[]
    author: User
    votes: number
    answers: Answer[]
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Answer {
    _id: string
    content: string
    author: User
    questionId: string
    votes: number
    isAccepted: boolean
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Notification {
    _id: string
    userId: string
    type: "answer" | "comment" | "mention" | "vote"
    message: string
    isRead: boolean
    createdAt: Date
  }
  
  export interface Vote {
    userId: string
    targetId: string
    targetType: "question" | "answer"
    voteType: "up" | "down"
  }
  