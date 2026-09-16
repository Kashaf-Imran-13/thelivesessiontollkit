# 🌐 Full-Stack Session Management Architecture

A clean, modular, production-ready full-stack architecture demonstrating standard multi-tier structure:
- **Frontend**: Modern React (Vite) UI with Join/Create session modals, active metrics, and real-time dashboard.
- **Backend**: Express.js REST API server with standard routing, controller layer, error handling, and database pooling.
- **Database**: MySQL relational schema (`sessions`, `participants`, `session_activities`) with SQL DDL & realistic seed data.

---

## 📁 Standard Folder Structure

```
fullstack-session-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MySQL connection pool + resilient fallback store
│   │   ├── controllers/
│   │   │   └── sessionController.js  # CRUD operations, status management & joining logic
│   │   ├── routes/
│   │   │   └── sessionRoutes.js      # Express API routes definition
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # Global JSON error formatting
│   │   │   └── requestLogger.js      # HTTP request activity logger
│   │   └── server.js                 # Express server bootstrap & middleware wiring
│   ├── .env.example                  # Environment configuration template
│   ├── .env                          # Local environment settings
│   └── package.json                  # Backend dependencies & start scripts
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── sessionApi.js         # Frontend HTTP client service for backend REST endpoints
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Header with status indicator & modal triggers
│   │   │   ├── StatsOverview.jsx     # High-level active session and participant metrics
│   │   │   ├── SessionCard.jsx       # Interactive card with quick join & status badges
│   │   │   ├── CreateSessionModal.jsx# Form modal to create a new session
│   │   │   ├── JoinSessionModal.jsx  # Code-based session join modal
│   │   │   └── SessionDashboard.jsx  # Live in-session workspace with roster & controls
│   │   ├── App.jsx                   # Central state management & routing
│   │   ├── index.css                 # Clean, responsive styling & animations
│   │   └── main.jsx                  # React application entry point
│   ├── index.html                    # HTML shell
│   ├── vite.config.js                # Vite build config with backend proxy
│   └── package.json                  # Frontend dependencies & scripts
│
├── database/
│   ├── schema.sql                    # Production MySQL table schema DDL (indexes, FKs)
│   ├── seed.sql                      # Realistic sample sessions & participant data
│   └── README.md                     # Database setup and CLI import instructions
│
├── README.md                         # Architecture overview & developer guide
└── package.json                      # Monorepo root orchestrator (concurrently)
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the following commands to install packages for both backend and frontend:

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 2. Start the Application

You can start backend and frontend in separate terminal windows:

#### Terminal 1 — Backend (Express API)
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

#### Terminal 2 — Frontend (React UI)
```bash
cd frontend
npm run dev
# React app opens at http://localhost:3000
```

---

## 🗄️ Database Setup (MySQL)

1. Ensure MySQL is running on your system.
2. Open your MySQL client and run the schema and seed scripts:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```
3. Update `backend/.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=session_platform_db
   DB_PORT=3306
   ```

> [!TIP]
> **Resilient Standalone Mode**: If MySQL is not running on your machine, the backend automatically operates with an in-memory persistent store seeded with sample sessions, allowing immediate demonstration with zero friction. Once MySQL is configured, it seamlessly uses live database queries!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server and database status check |
| `GET` | `/api/sessions` | List sessions (supports `?status=` and `?search=`) |
| `GET` | `/api/sessions/:id` | Fetch session details, participants, and activity stream |
| `POST` | `/api/sessions` | Create a new session (auto-generates session code) |
| `POST` | `/api/sessions/join` | Join session via session code & participant name |
| `PATCH`| `/api/sessions/:id/status` | Update session status (`waiting`, `active`, `paused`, `completed`) |
| `DELETE`| `/api/sessions/:id` | Delete session and cascade participants |

---

## 💡 Key Design Highlights
1. **Separation of Concerns**: Clean isolation between Presentation (React), Business Logic / Controller (Express), and Persistence (MySQL).
2. **Interactive UI**: Modals for session creation and code joining, live status toggle buttons, live timer counter, and participant capacity progress bars.
3. **Robust Connection Pooling**: Express uses `mysql2/promise` pool with error guards and graceful fallback.
