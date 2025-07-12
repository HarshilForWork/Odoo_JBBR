# StackIt - Community Q&A Forum

A modern, feature-rich Q&A forum built with Next.js, Express.js, MongoDB, and Socket.IO. StackIt provides a comprehensive platform for asking questions, sharing knowledge, and building a community around knowledge exchange.

## 🚀 Features

### Core Q&A System

- **Ask Questions**: Create detailed questions with rich text formatting and image uploads
- **Provide Answers**: Respond to questions with formatted content and images
- **Vote System**: Upvote/downvote questions and answers
- **Accept Answers**: Mark the best answer as accepted (question author only)
- **Edit Content**: Modify questions and answers with edit history tracking

### User Management

- **User Registration & Authentication**: Secure JWT-based authentication
- **User Profiles**: View user activity and contributions
- **Role-based Access**: Admin and regular user roles
- **My Posts**: View all your own questions in one place

### Real-time Features

- **Live Notifications**: Real-time notifications for new answers, votes, and accepts
- **Socket.IO Integration**: Instant updates across all connected clients
- **Live Search**: Debounced search with real-time results
- **Real-time Updates**: New questions and answers appear instantly

### Content Management

- **Rich Text Editor**: Format questions and answers with React Quill
- **Image Uploads**: Support for multiple images (up to 5, 10MB each)
- **Tag System**: Categorize questions with tags
- **Search & Filter**: Advanced search with filters (Newest, Unanswered)
- **Pagination**: Efficient content loading with pagination

### Admin Features

- **Admin Dashboard**: Comprehensive admin panel with statistics
- **User Management**: View, ban, and manage users
- **Content Moderation**: Delete questions and answers
- **Global Announcements**: Send platform-wide announcements
- **Statistics**: View platform usage statistics
- **User Analytics**: Track user activity and contributions

### UI/UX Features

- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Framer Motion**: Smooth animations and transitions
- **Loading States**: Proper loading indicators throughout
- **Error Handling**: Comprehensive error handling and user feedback
- **Accessibility**: Keyboard navigation and screen reader support

### Advanced Features

- **Edit Tracking**: Visual indicators for edited content
- **View Counting**: Track question views
- **Notification Management**: Mark notifications as read, clear all
- **Image Previews**: Preview uploaded images before posting

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **Socket.IO Client** - Real-time communication
- **React Quill** - Rich text editor
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

### Backend

- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Development Tools

- **Nodemon** - Auto-restart server during development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd Odoo_JBBR
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set up environment variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/stackit
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5001
NODE_ENV=development
```

### 4. Run the development servers

```bash
# From the root directory
npm run dev
```

This will start both the backend (port 5001) and frontend (port 3000) servers concurrently.

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev
```

The backend server will run on `http://localhost:5001`

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user (supports email or username)
- `GET /api/auth/profile` - Get user profile

### Questions

- `GET /api/questions` - Get all questions (with pagination, filtering, search)
- `GET /api/questions/my-questions` - Get user's own questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question (with image uploads)
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question

### Answers

- `GET /api/answers/question/:questionId` - Get answers for a question
- `POST /api/answers` - Create new answer (with image uploads)
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/accept` - Mark answer as accepted
- `POST /api/answers/:id/unaccept` - Unmark accepted answer

### Notifications

- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

### Admin

- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `POST /api/admin/users/:id/ban` - Ban user
- `DELETE /api/admin/users/:id/ban` - Unban user
- `GET /api/admin/questions` - Get all questions (admin view)
- `DELETE /api/admin/questions/:id` - Delete question (admin)
- `GET /api/admin/answers` - Get all answers (admin view)
- `DELETE /api/admin/answers/:id` - Delete answer (admin)
- `GET /api/admin/global-messages` - Get global messages
- `POST /api/admin/global-messages` - Create global message

### Announcements

- `GET /api/announcements` - Get active announcements

## 📁 Project Structure

```
Odoo_JBBR/
├── backend/
│   ├── models/              # MongoDB schemas
│   │   ├── User.js         # User model with roles and stats
│   │   ├── Question.js     # Question model with voting
│   │   ├── Answer.js       # Answer model with acceptance
│   │   ├── Notification.js # Notification system
│   │   ├── Announcement.js # Platform announcements
│   │   └── GlobalMessage.js # Admin global messages
│   ├── routes/             # API routes
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── questions.js   # Question CRUD operations
│   │   ├── answers.js     # Answer CRUD operations
│   │   ├── notifications.js # Notification management
│   │   ├── admin.js       # Admin panel endpoints
│   │   └── announcements.js # Announcement system
│   ├── middleware/         # Express middleware
│   │   ├── auth.js        # JWT authentication
│   │   └── admin.js       # Admin role verification
│   ├── utils/             # Utility functions
│   │   └── notifications.js # Notification creation helpers
│   ├── uploads/           # File uploads directory
│   ├── server.js          # Express server with Socket.IO
│   └── package.json
├── frontend/
│   ├── app/               # Next.js app directory
│   │   ├── auth/         # Authentication pages
│   │   │   ├── login/    # Login page
│   │   │   └── register/ # Registration page
│   │   ├── admin/        # Admin dashboard
│   │   ├── ask/          # Ask question page
│   │   ├── questions/    # Question detail pages
│   │   ├── layout.tsx    # Root layout with animations
│   │   ├── page.tsx      # Homepage with real-time features
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── admin-dashboard.tsx # Admin panel component
│   │   ├── rich-text-editor.tsx # Rich text editor
│   │   └── tag-input.tsx # Tag input component
│   ├── lib/             # Utility functions
│   │   ├── socket-context.tsx # Socket.IO context
│   │   └── utils.ts     # Helper functions
│   └── package.json
├── shared/
│   └── types.ts         # Shared TypeScript types
├── scripts/             # Setup and utility scripts
├── package.json         # Root package.json with dev scripts
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles

- **Regular Users**: Can ask questions, answer, vote, and manage their content
- **Admin Users**: Full access to admin dashboard and moderation tools

### Security Features

- JWT-based authentication with 7-day expiration
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- File upload security (image validation)

## 📊 Database Models

### User Model

- Username, email, password
- Role (user/admin)
- Ban status and reason
- Activity statistics (question/answer counts)
- Avatar support

### Question Model

- Title, description, tags
- Author reference
- Voting system (upvotes/downvotes)
- Views counter
- Answers array
- Edit tracking (updatedAt)

### Answer Model

- Content with rich text support
- Author reference
- Question reference
- Voting system
- Acceptance status
- Image uploads
- Edit tracking

### Notification Model

- Recipient and sender
- Type (answer, vote, accept, global_message)
- Question/answer references
- Read status
- Real-time delivery

## 🎨 UI/UX Features

### Design System

- Consistent color scheme with primary/secondary colors
- Responsive grid system
- Typography hierarchy
- Interactive states (hover, focus, active)

### Animations

- Page transitions with Framer Motion
- Micro-interactions for buttons and cards
- Loading states and skeleton screens
- Smooth scrolling and navigation

### Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios
- Focus management

## 🚀 Deployment

### Environment Variables

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=5001
NODE_ENV=production
```

### Build Commands

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide error messages and stack traces

## 🔮 Future Enhancements

- Email notifications
- User reputation system
- Advanced search filters
- Question categories
- User badges and achievements
- Mobile app development
- API rate limiting
- Advanced admin analytics
- Content moderation tools
- Community guidelines enforcement

---

## 👥 Team Details

### Problem Statement 2: StackIt – A Minimal Q&A Forum Platform

**Team Name:** JBBR

**Team Members:**

- **Harshil Bhanushali** - harshilbhanushali11@gmail.com
- **Jay Guri** - jaymanishguri@gmail.com
- **Ayush Patel** - ayushptl18@gmail.com
- **Akshat Singh** - sakshat193@gmail.com
