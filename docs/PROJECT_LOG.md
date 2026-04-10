# 📋 CivicFix — Project Development Log

> This document maintains a **chronological log** of all development activities, decisions, and milestones across each implementation phase. Updated continuously as the project progresses.

---

## 📌 Log Format

Each entry follows this structure:

```
### [Date] — [Brief Title]
- **Phase:** [Phase Number]
- **Type:** [Feature | Bugfix | Refactor | Design | Setup | Research]
- **Status:** [Completed | In Progress | Blocked]
- **Description:** [What was done]
- **Files Changed:** [List of files modified/created]
- **Notes:** [Any observations, decisions, or blockers]
```

---

## 🗂️ Phase 1 — Foundation & Core Infrastructure

---

### 2026-04-06 — Project Initialization & Scaffolding
- **Phase:** 1
- **Type:** Setup
- **Status:** Completed
- **Description:**
  - Initialized React + Vite project with TailwindCSS 4 and React Router 7
  - Created basic component architecture (`layout/`, `ui/`, `pages/`)
  - Implemented initial Home page with hero section and feature cards
  - Built ReportIssue page with form (name, category, location, description, photo upload)
  - Created reusable Button component, Navbar, and Footer
- **Files Changed:**
  - `src/App.jsx` — Root routing setup
  - `src/pages/Home.jsx` — Landing page with animated hero
  - `src/pages/ReportIssue.jsx` — Issue submission form
  - `src/components/layout/Navbar.jsx` — Navigation bar
  - `src/components/layout/Footer.jsx` — Site footer
  - `src/components/ui/Button.jsx` — Reusable button component
  - `src/index.css` — Global styles with glassmorphism
  - `package.json` — Dependencies configured
- **Notes:**
  - Using glassmorphism design language across the UI
  - Form currently submits to console (no backend yet)
  - Photo upload is UI-only (no storage integration)

---

### 2026-04-06 — Documentation & Project Structure
- **Phase:** 1
- **Type:** Setup
- **Status:** Completed
- **Description:**
  - Created comprehensive README.md with complete problem statement, features, and 8-phase implementation plan
  - Added system architecture diagrams (Mermaid — High-Level + Data Flow)
  - Created `docs/` directory with PROJECT_LOG.md and OUTPUT_NOTES.md
  - Defined complete project folder structure for future phases
- **Files Changed:**
  - `README.md` — Full project documentation
  - `docs/PROJECT_LOG.md` — This file (development log)
  - `docs/OUTPUT_NOTES.md` — Sequential output tracking
  - `docs/assets/` — Directory for diagrams and images
- **Notes:**
  - 8 phases defined in priority order: Foundation → Reports → Dashboards → Real-Time → AI → Maps → Analytics → Hardening
  - Architecture designed for scalability with microservice-ready structure

---

### 2026-04-07 — Backend API Development (Express.js + MongoDB)
- **Phase:** 1
- **Type:** Feature
- **Status:** Completed
- **Description:**
  - Built complete Express.js backend API server with modular architecture
  - Created MongoDB Mongoose models: `User` (with roles, bcrypt hashing) and `Report` (with tracking, status workflow, AI metadata prep)
  - Implemented auth controller: register, login, getMe, createStaffAccount
  - Implemented report controller: createReport, getReports, trackReport, getMyReports, updateStatus, assignReport, upvoteReport, getStats
  - Implemented user controller: getAllUsers, getUserById, updateProfile, updateUserRole, toggleUserStatus
  - Built auth middleware: `protect` (JWT verification), `optionalAuth` (anonymous access), `authorize` (role-based)
  - Created JWT token generation utility
  - Setup API routes: `/api/auth/`, `/api/users/`, `/api/reports/` with proper middleware chains
  - Configured CORS, JSON parsing (10mb limit), health check endpoint
- **Files Changed:**
  - `server/index.js` — Express server entry
  - `server/config/db.js` — MongoDB connection
  - `server/models/User.js` — User schema with bcrypt
  - `server/models/Report.js` — Report schema with indexes
  - `server/controllers/authController.js` — Auth CRUD
  - `server/controllers/reportController.js` — Report CRUD + workflow
  - `server/controllers/userController.js` — User management
  - `server/middleware/auth.js` — JWT + RBAC middleware
  - `server/routes/auth.js`, `reports.js`, `users.js` — Route definitions
  - `server/utils/generateToken.js` — JWT utility
  - `server/package.json` — Dependencies (bcryptjs, cors, dotenv, express, jsonwebtoken, mongoose, multer, express-validator)
- **Notes:**
  - Auto-department routing: category → department mapping in reportController
  - Report tracking IDs: `CF-YYMMDD-XXXXX` format with uniqueness check
  - Status workflow: `reported → acknowledged → assigned → in_progress → resolved → closed`
  - 8 performance indexes on Report model

---

### 2026-04-07 — Frontend Auth Integration
- **Phase:** 1
- **Type:** Feature
- **Status:** Completed
- **Description:**
  - Built `AuthContext.jsx` with React Context for global auth state
  - Created `api.js` service layer with fetch wrapper, token management, and FormData support
  - Implemented Login page with JWT auth, password visibility toggle, and error handling
  - Implemented Register page with client-side validation, password confirmation
  - Created `ProtectedRoute.jsx` component with role-based access control
  - Updated `Navbar.jsx` with auth-aware navigation (dropdown menu, role badges, mobile menu)
  - Configured routing in `App.jsx` with protected routes for dashboards
- **Files Changed:**
  - `src/context/AuthContext.jsx` — Auth provider
  - `src/services/api.js` — API service layer
  - `src/pages/Login.jsx` — Login page
  - `src/pages/Register.jsx` — Registration page
  - `src/components/auth/ProtectedRoute.jsx` — Route guard
  - `src/components/layout/Navbar.jsx` — Auth-aware navbar
  - `src/App.jsx` — Updated routing
- **Notes:**
  - Token stored in `localStorage` as `civicfix_token`
  - AuthContext provides: user, isAuthenticated, isAdmin, isDepartment, isCitizen
  - ProtectedRoute supports both full-auth and role-specific access

---

### 2026-04-07 — Backend Migration & Architecture Cleanup
- **Phase:** 1
- **Type:** Refactor
- **Status:** Completed
- **Description:**
  - Migrated all backend code from embedded `Latrobe-Crowdsourcing/server/` to standalone `Latrobe-Backend/` project
  - Deleted the embedded `server/` directory from `Latrobe-Crowdsourcing/`
  - Restructured `Latrobe-Backend/` with `src/` directory pattern matching the existing project conventions
  - Updated MongoDB connection to use MongoDB Atlas (cloud)
  - Added `express-validator` and `multer` dependencies
  - Cleaned frontend `.env` file (removed comment header causing potential Vite/Rollup issues)
  - Updated README to reflect the new 3-repo architecture
- **Files Changed:**
  - `Latrobe-Backend/src/` — Complete backend codebase (migrated)
  - `Latrobe-Backend/package.json` — Updated with all dependencies
  - `Latrobe-Backend/.env.example` — MongoDB Atlas format
  - `Latrobe-Crowdsourcing/server/` — **Deleted** (migrated to Latrobe-Backend)
  - `Latrobe-Crowdsourcing/.env` — Cleaned format
- **Notes:**
  - Frontend points to `http://localhost:5000/api` via `VITE_API_URL`
  - Backend is completely independent and can be deployed separately
  - Three-repo architecture: `Latrobe-Crowdsourcing` (frontend), `Latrobe-Backend` (API), `LaTrobe-Departments` (dept portal)

---

### 2026-04-07 — Build Error Fix & Verification
- **Phase:** 1
- **Type:** Bugfix
- **Status:** Completed
- **Description:**
  - Diagnosed Rollup `handleInvalidResolvedId` error in `ProtectedRoute.jsx`
  - Root cause: Comment-style header in `.env` file (`# ─── API Configuration ───`) was causing Vite env parsing issues
  - Fixed by cleaning `.env` to plain key-value format
  - Verified `npm run build` passes cleanly (14.71s build)
  - Verified `npm run dev` boots Vite server at `localhost:5173` without errors
  - Tested all 5 frontend pages: Home ✅, Login ✅, Register ✅, Report ✅, Track ✅
- **Files Changed:**
  - `Latrobe-Crowdsourcing/.env` — Cleaned format
- **Notes:**
  - Import path `../../context/AuthContext` in ProtectedRoute.jsx was actually correct
  - The .env comment header was the real culprit

---

## 🗂️ Phase 2 — Citizen Report Submission & Tracking

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 3 — Multi-Role Dashboards & Admin Portal

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 4 — Real-Time Communication & Notifications

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 5 — AI Intelligence Layer

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 6 — Map Visualization & AR Features

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 7 — Analytics, Predictions & Accessibility

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 🗂️ Phase 8 — Advanced Features & Hardening

> ⬜ *Not yet started — entries will be added as work begins.*

---

## 📊 Summary Statistics

| Metric | Count |
|:---|:---:|
| Total Log Entries | 6 |
| Phases Started | 1 / 8 |
| Features Completed | 8 (auth, models, CRUD, middleware, routing, migration, UI, build fix) |
| Active Blockers | 0 |
| Total Files Modified | 32+ |

> *Last updated: April 7, 2026*
