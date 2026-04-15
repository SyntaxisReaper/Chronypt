# Chronypt — Multi-Tech Solutions Platform

A modern, full-stack web application featuring a sophisticated 3D interface, seamless multi-provider authentication, and a robust backend API.

## 🚀 Features

### Frontend
- **3D Interactive Interface** built with Three.js, React Three Fiber, and Drei
  - Tech Globe with Fibonacci-distributed dots and dynamic glow
  - Molecular particle systems with additive blending
  - Orbital rings and interactive data visualization
  - Circuit line animations for visual polish
  
- **Responsive Design** with Framer Motion animations and Lucide React icons
- **Multi-page Architecture** with React Router
  - Home Page (Landing)
  - Login/Sign-up with OAuth options
  - Onboarding Wizard
  - Dashboard
  - Auth Callback handler

### Backend
- **Multi-Provider Authentication**
  - Local authentication with email/password
  - OAuth 2.0 integration (Google, GitHub, Microsoft)
  - JWT Bearer token authentication
  - Secure session management with refresh tokens

- **Production-Ready Security**
  - Helmet.js for HTTP security headers
  - CORS protection with configurable origins
  - Password hashing with bcryptjs
  - Input validation with Zod
  - Session tracking with user agent and IP address

- **Dual Database Support**
  - PostgreSQL (via Prisma ORM) for relational data
  - MongoDB (via Mongoose) for session management

## 📋 Tech Stack

### Frontend
- React 19
- Vite (build tool)
- TypeScript
- Three.js & React Three Fiber
- Framer Motion
- React Router DOM v7
- Lucide React (icons)

### Backend
- Node.js + Express
- TypeScript
- Passport.js (authentication)
- Prisma ORM (PostgreSQL)
- Mongoose (MongoDB)
- JWT (jsonwebtoken)

## 🛠️ Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- PostgreSQL database
- MongoDB database (for sessions)
- OAuth credentials (Google, GitHub, Microsoft) — optional

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SyntaxisReaper/Chronypt.git
   cd Chronypt
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Configure your database
   cp .env.example .env
   # Edit .env with your database URLs and OAuth credentials
   
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend API (Port 5000)**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Development Server (Port 5173)**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
cd frontend
npm run build
npm run preview
```

## 📚 Project Structure

```
Chronypt/
├── backend/
│   ├── src/
│   │   ├── server.ts           # Express app entry point
│   │   ├── config/
│   │   │   ├── db.ts          # Database connections
│   │   │   └── passport.ts     # Authentication strategies
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT verification
│   │   ├── routes/
│   │   │   ├── auth.ts         # Authentication endpoints
│   │   │   └── onboarding.ts   # Onboarding workflow
│   │   ├── models/
│   │   │   └── Session.ts      # MongoDB session model
│   │   └── utils/
│   │       └── jwt.ts          # Token utilities
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Root component
│   │   ├── pages/
│   │   │   ├── Home.tsx        # Landing page
│   │   │   ├── Login.tsx        # Auth page
│   │   │   ├── Onboarding.tsx   # Setup wizard
│   │   │   ├── Dashboard.tsx    # Main app
│   │   │   └── AuthCallback.tsx # OAuth handler
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation
│   │   │   └── Scene.tsx        # 3D visualization
│   │   ├── assets/              # Images and static content
│   │   └── index.css            # Global styles
│   └── package.json
│
└── README.md
```

## 🔐 Environment Configuration

### Backend `.env`
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chronypt
MONGODB_URI=mongodb://localhost:27017/chronypt

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# OAuth GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

# OAuth Microsoft
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_CALLBACK_URL=http://localhost:5000/auth/microsoft/callback

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📖 API Endpoints

### Authentication
- `POST /auth/register` — Register with email/password
- `POST /auth/login` — Login with credentials
- `GET /auth/google` — Google OAuth flow
- `GET /auth/github` — GitHub OAuth flow
- `GET /auth/microsoft` — Microsoft OAuth flow
- `POST /auth/logout` — Logout and clear session
- `POST /auth/refresh` — Refresh JWT token

### Onboarding
- `POST /onboarding/submit` — Complete onboarding setup

### Health
- `GET /health` — API health check

## 🎨 3D Visualization

The frontend features stunning 3D graphics powered by Three.js and React Three Fiber:

- **Tech Globe**: Interactive sphere with Fibonacci-distributed points
- **Particle System**: Animated molecular structure
- **Orbital Elements**: Rings and data point visualizations
- **Interactive Controls**: OrbitControls for camera manipulation
- **Smooth Animations**: Powered by Framer Motion and Anime.js

## 🔄 Authentication Flow

1. User navigates to the application
2. User can:
   - Sign up with email/password
   - Login with existing credentials
   - Authenticate via OAuth (Google, GitHub, Microsoft)
3. On successful authentication:
   - JWT token is generated and stored in httpOnly cookie
   - Session is created with refresh token
   - User is redirected to onboarding or dashboard
4. Protected routes verify JWT before granting access

## 🚨 Security Considerations

- All passwords are hashed with bcryptjs (salt rounds: 10)
- JWT tokens are signed with a strong secret
- Sessions include device fingerprinting (user agent + IP)
- Refresh tokens are stored securely
- CORS is configured for frontend origin only
- HTTP security headers via Helmet.js

## 📦 Build & Deployment

### Building for Production

```bash
# Backend
cd backend
npm run build
# Output: dist/

# Frontend
cd frontend
npm run build
# Output: dist/
```

### Deployment Options
- Backend: Node.js hosting (Heroku, Railway, Replit, etc.)
- Frontend: Static hosting (Vercel, Netlify, GitHub Pages, etc.)
- Databases: Managed PostgreSQL & MongoDB services

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**SyntaxisReaper** — [GitHub Profile](https://github.com/SyntaxisReaper)

---

**Last Updated**: April 15, 2026  
**Status**: Frontend + Backend Core Complete
