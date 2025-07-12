# StackIt Forum

A modern Q&A forum built with Next.js, Express.js, MongoDB, and Socket.IO for real-time features.

## Features

- 🚀 **Real-time Updates**: Live notifications for new questions and answers
- 💬 **Q&A System**: Ask questions, provide answers, and vote on content
- 🏷️ **Tag System**: Categorize questions with tags
- 🔍 **Search & Filter**: Find questions by title, content, or tags
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Performance**: Built with modern technologies for optimal speed

## Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend

- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd stackit-forum
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

```bash
# Backend
cd backend
cp env.example .env
```

Edit the `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/stackit
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services

# On Linux
sudo systemctl start mongod
```

### 5. Run the development servers

```bash
# From the root directory
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) servers concurrently.

## Development

### Backend Development

```bash
cd backend
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Questions

- `GET /api/questions` - Get all questions (with pagination and filtering)
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question

### Answers

- `GET /api/answers/question/:questionId` - Get answers for a question
- `POST /api/answers` - Create new answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/accept` - Mark answer as accepted

## Project Structure

```
stackit-forum/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── lib/             # Utility functions
│   └── package.json
├── shared/
│   └── types.ts         # Shared TypeScript types
└── package.json         # Root package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
