# CivicFix — Implementation Status

> **Last Updated:** April 10, 2026 (23:47 IST)
> **Resume From:** Phase 6 — Map Visualization & AR

---

## ✅ Phase 1 — Foundation & Core Infrastructure (COMPLETE)

Everything below is built, tested, and working.

### Frontend (React 19 + Vite 7 + TailwindCSS 4)
| File | Purpose |
|:---|:---|
| `src/App.jsx` | Main router — public routes, protected routes (role-gated), 404 |
| `src/main.jsx` | React entry point |
| `src/index.css` | Design system — Inter font, card/button utilities, slide-up animation, skeleton shimmer |
| `src/context/AuthContext.jsx` | Auth state (login, register, logout, getMe, role checks) |
| `src/services/api.js` | Fetch wrapper — authAPI, usersAPI, reportsAPI, healthCheck |
| `src/components/auth/ProtectedRoute.jsx` | Route guard (auth + role check + loading state) |
| `src/components/layout/Navbar.jsx` | Responsive nav with scroll effect, user dropdown, role badges |
| `src/components/layout/Footer.jsx` | Site footer with quick links, social icons (GitHub, X) |
| `src/components/ui/Button.jsx` | Reusable button (primary / secondary variants) |
| `src/pages/Home.jsx` | Landing page — hero + "How it works" steps + feature grid + dark CTA |
| `src/pages/Login.jsx` | Login form — email/password, error display, redirect-after-login |
| `src/pages/Register.jsx` | Register form — name, email, phone, password, confirm |

### Backend (Express.js + MongoDB Atlas)
| File | Purpose |
|:---|:---|
| `server/index.js` | Express app — CORS, routes, error handler, health check |
| `server/config/db.js` | MongoDB Atlas connection via Mongoose |
| `server/utils/generateToken.js` | JWT token generator |
| `server/models/User.js` | User schema — name, email, password (hashed), role, department |
| `server/models/Report.js` | Report schema — tracking ID, location, images, status history, AI fields |
| `server/middleware/auth.js` | `protect`, `optionalAuth`, `authorize` middleware |
| `server/controllers/authController.js` | Register, login, getMe, createStaffAccount |
| `server/controllers/reportController.js` | CRUD + track, upvote (with notification), assign, stats |
| `server/controllers/userController.js` | getAllUsers, getById, updateProfile, updateRole, toggleStatus |
| `server/routes/auth.js` | POST register/login, GET me, POST create-staff (admin) |
| `server/routes/reports.js` | Full report routes with role guards |
| `server/routes/users.js` | User management routes (admin-gated) |

### Key Architecture Decisions
- JWT tokens stored in `localStorage` as `civicfix_token`
- API base URL configurable via `VITE_API_URL` env var (defaults to `http://localhost:5000/api`)
- Reports auto-assigned to departments based on category mapping
- Tracking IDs follow format: `CF-YYMMDD-XXXXX` (auto-generated, unique)
- Password hashing: bcrypt with 12 salt rounds
- Role hierarchy: `citizen` → `department` → `admin`

---

## ✅ Phase 2 — Citizen Report Submission & Tracking (COMPLETE)

### What was built:
| File | What it does |
|:---|:---|
| `src/pages/ReportIssue.jsx` | **Full report submission form** — title, category selector (7 types), description with char counter, GPS auto-location via Geolocation API + reverse geocoding (OpenStreetMap Nominatim), drag-and-drop image upload with previews (up to 3 images), anonymous reporting toggle, success state with tracking ID + copy-to-clipboard, **AI insights panel** (priority, severity, department, ETA, auto-tags, duplicate flag) |
| `src/pages/TrackReport.jsx` | **Report tracker** — search by tracking ID, displays status badge with colored dot, detail grid, status timeline with connector dots, **AI insights panel** (severity, ETA, tags, duplicate warning) |
| `src/pages/MyReports.jsx` | **Citizen dashboard** — fetches user's reports, status filter tabs (All/Reported/In Progress/Resolved/Closed), expand/collapse report details + status timeline, pagination |

### Key Details:
- **GPS Auto-Location:** `navigator.geolocation` → reverse geocodes via OpenStreetMap Nominatim → auto-fills address + lat/lng
- **Image Upload:** Client-side base64 encoding, drag-and-drop + click, max 3 images, 5 MB limit, previews with remove
- **Anonymous Mode:** Toggle checkbox for logged-in users; auto-anonymous banner for guests
- **Tracking ID:** Displayed in success card with copy-to-clipboard button
- **All 7 categories:** roads, sanitation, water, electricity, parks, traffic, other

---

## ✅ Phase 3 — Multi-Role Dashboards & Admin Portal (COMPLETE)

### What was built:

#### Reusable Components
| File | What it does |
|:---|:---|
| `src/components/reports/ReportCard.jsx` | **Reusable report card** — 3 variants (default, compact, admin), colored-dot status badges, priority tags, image thumbnails, action buttons (Acknowledge/Start Work/Resolve/Reject/Assign) |
| `src/components/reports/FilterBar.jsx` | **Reusable filter bar** — dropdowns for category, status, priority, sort, reset button |

#### Pages
| File | What it does |
|:---|:---|
| `src/pages/DepartmentDashboard.jsx` | **Department Dashboard** (`/dashboard/department`) — Number-based stats (Open/In Progress/Resolved/Total), status filter, list of department-scoped reports with action buttons, pagination |
| `src/pages/AdminDashboard.jsx` | **Admin Dashboard** (`/dashboard/admin`) — 4-tab interface: **Overview** (aggregate stats with progress bars by category & priority), **All Reports** (filter bar + report cards with status update + department assignment modal), **Users** (list with role change, activate/deactivate), **Create Staff** (form for department/admin accounts) |
| `src/pages/PublicFeed.jsx` | **Community Feed** (`/feed`) — 2-column grid of all reports, full filter bar, SVG upvote buttons for authenticated users, "Report Issue" CTA, pagination |

### Key Details:
- Department Dashboard scoped by `user.department`
- Admin tabs: Overview, All Reports, Users, Create Staff
- Assignment Modal: Admin can reassign reports to any department
- User Management: Change roles, activate/deactivate accounts
- Public Feed with upvote capability for logged-in users

---

## ✅ Phase 4 — Real-Time Communication & Notifications (COMPLETE)

### What was built:

#### WebSocket Infrastructure
| File | What it does |
|:---|:---|
| `server/socket.js` | Socket.io server — JWT auth middleware, room management (user, role, department) |
| `src/services/socket.js` | Socket.io client — authenticated connection, event subscription/emission |

#### In-App Notification System
| File | What it does |
|:---|:---|
| `server/models/Notification.js` | Schema — recipient, type (6 types), title, message, relatedReport, trackingId, isRead, metadata |
| `server/controllers/notificationController.js` | CRUD — getNotifications (paginated), getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearReadNotifications |
| `server/routes/notifications.js` | Routes — all require authentication |
| `src/context/NotificationContext.jsx` | Global notification state, WebSocket listeners for new notifications, unread count management |
| `src/components/ui/NotificationBell.jsx` | Navbar dropdown — emoji type indicators, timeAgo display, mark read, delete, clear, tracking ID links |

#### Notification Triggers
| Event | What Happens |
|:---|:---|
| **Report status change** | Reporter receives in-app + WebSocket notification with new status and optional note |
| **Report assigned to dept** | Reporter notified about department assignment; department receives WebSocket event |
| **Report upvoted** | Reporter notified (only for new upvotes by other users, not self-upvotes) |
| **Report update broadcast** | All public feed listeners receive `report:updated` event |

### Key Details:
- Socket.io integrated with JWT authentication for secure connections
- All notification types: `status_change`, `report_assigned`, `report_upvoted`, `new_report`, `report_resolved`, `system`
- Notifications persist in MongoDB with read/unread state
- Real-time delivery via WebSocket, fallback to polling on reconnect
- Upvote notifications include a try/catch to not break the upvote action on notification failure

---

## ✅ Phase 5 — AI Intelligence Layer (COMPLETE)

### What was built:

#### Backend AI Engine
| File | What it does |
|:---|:---|
| `server/services/aiService.js` | **Rule-based NLP engine** — keyword extraction & auto-tagging (`extractTags`), priority & severity scoring (`assessPriority`), smart department routing with override logic (`suggestDepartment`), spam / low-quality filtering (`detectSpam`), Jaccard-similarity duplicate detection against recent open reports (`findDuplicates`), historical-average-aware ETA estimation (`estimateResolutionTime`), orchestrating `analyzeReport` entry point |

#### Report Model — AI Fields
| Field | Type | Purpose |
|:---|:---|:---|
| `aiTags` | `[String]` | Auto-extracted keywords from title + description (up to 8) |
| `aiConfidence` | `Number` | Confidence score (0–1) for priority assessment |
| `isDuplicate` | `Boolean` | Whether AI flagged report as likely duplicate |
| `duplicateOf` | `ObjectId → Report` | Reference to the matched duplicate report |
| `spamScore` | `Number` | Spam / low-quality score (0–1) |
| `aiDepartmentSuggestion` | `{ department, overridden }` | AI's department suggestion and whether it overrode the category |
| `estimatedResolutionTime` | `Date` | ETA based on category base hours × priority multiplier ± historical avg |

#### Report Controller — AI Integration
| Endpoint | AI Behaviour |
|:---|:---|
| `POST /api/reports` | Runs full `analyzeReport` on submission; spam-blocks with 400; applies AI priority, severity, tags, department, ETA, duplicate flag; returns `aiInsights` to client |
| `POST /api/reports/:id/analyze` | Admin-only re-run of AI analysis on existing report; updates all AI fields and optionally overrides department |

#### Frontend AI Panels
| File | AI UI |
|:---|:---|
| `src/pages/ReportIssue.jsx` | **Post-submission AI panel** — 4-cell grid (Priority, Severity, Department, Est. Resolution), auto-tags chip row, duplicate warning badge, confidence pill; shown only when `aiInsights` is returned |
| `src/pages/TrackReport.jsx` | **Inline AI insights** — severity, ETA (hidden when resolved/closed), AI tag chips, duplicate warning; shown when `aiTags`, `estimatedResolutionTime`, or `isDuplicate` is present |

### Key Details:
- All AI analysis is **rule-based NLP** (no external ML API), runs synchronously server-side, is **non-blocking** (AI failure never breaks report submission)
- Spam filter rejects reports with score ≥ 0.6 before saving (e.g. test data, excessively short content, repetitive words)
- Duplicate detection uses **Jaccard similarity** (unigrams) against all open reports in the same department created in the last 30 days; threshold: ≥ 0.45
- Department routing overrides category mapping only if AI-detected department scores **2+ more keywords** than the user-selected category
- ETA uses MongoDB aggregation for historical averages when ≥ 3 resolved reports exist for the category; falls back to hardcoded base hours

### Minor Fixes Applied (during Phase 4 → 5):
- **Branding:** Fixed "CivicConnect" → "CivicFix" in Footer (both logo text and copyright)
- **HTML Title:** Fixed `<title>crowdsourcing</title>` → `<title>CivicFix — Civic Issue Tracker</title>` with proper meta description
- **Server .env:** Added missing `JWT_SECRET` and `NODE_ENV` variables

---

## ⬜ Phase 6 — Map Visualization & AR
- Leaflet/Mapbox interactive map with clustering
- Heatmap layer for issue hotspots
- AR.js/WebXR camera overlay
- Location-based radius filtering

## ⬜ Phase 7 — Analytics, Predictions & Accessibility
- Analytics dashboard (trends, response times)
- Predictive hotspot forecasting
- Voice-based reporting (speech-to-text)
- Accessibility features (screen reader, large buttons)
- AI chatbot assistant

## ⬜ Phase 8 — Advanced Features & Hardening
- PWA with offline sync (Workbox)
- Blockchain audit trail
- Code splitting & lazy loading
- Security hardening (rate limiting, CORS, sanitization)
- Swagger/OpenAPI documentation
- Vercel/AWS deployment + CI/CD

---

## 🛠️ Tech Stack

| Layer | Technology | Status |
|:---|:---|:---:|
| Frontend | React 19, Vite 7, TailwindCSS 4, React Router 7 | ✅ Active |
| Backend | Node.js, Express.js | ✅ Active |
| Database | MongoDB Atlas (Mongoose 8) | ✅ Active |
| Auth | JWT (bcrypt + jsonwebtoken) | ✅ Active |
| Storage | Base64 (temporary) → Firebase/Cloudinary (planned) | 🔄 Partial |
| Real-Time | Socket.io | ✅ Active |
| Notifications | In-app (Socket.io + MongoDB) | ✅ Active |
| AI / NLP | Rule-based NLP engine (aiService.js) | ✅ Active |
| Maps | Leaflet.js / Mapbox GL | ⬜ Phase 6 |
| AI/ML (ext.) | TensorFlow.js, OpenAI | ⬜ Phase 7+ |
| Push/SMS | FCM, Twilio | ⬜ Phase 7+ |
| Deployment | Vercel + Railway/AWS | ⬜ Phase 8 |

---

## 📁 Full File Tree (Source Only)

```
src/
├── App.jsx                              # Router with all routes + 404
├── main.jsx                             # React entry
├── index.css                            # Design system (card, btn, input, animations)
├── context/
│   ├── AuthContext.jsx                  # Auth state management
│   └── NotificationContext.jsx          # Global notification state + WebSocket
├── services/
│   ├── api.js                           # API service layer
│   └── socket.js                        # Socket.io client
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx           # Route guard
│   ├── layout/
│   │   ├── Navbar.jsx                   # Top navigation (CivicFix branding)
│   │   └── Footer.jsx                   # Footer with SVG social icons
│   ├── ui/
│   │   ├── Button.jsx                   # Reusable button (primary/secondary)
│   │   └── NotificationBell.jsx         # Notification dropdown
│   └── reports/
│       ├── ReportCard.jsx               # Report card (3 variants, colored-dot badges)
│       └── FilterBar.jsx                # Filter dropdowns
└── pages/
    ├── Home.jsx                         # Landing page (hero, steps, features, CTA)
    ├── Login.jsx                        # Login form
    ├── Register.jsx                     # Register form
    ├── ReportIssue.jsx                  # Submit report (GPS, images, anon, AI insights panel)
    ├── TrackReport.jsx                  # Track by ID (+ AI insights panel)
    ├── MyReports.jsx                    # Citizen's reports
    ├── PublicFeed.jsx                   # Community issue feed + upvotes
    ├── DepartmentDashboard.jsx          # Department management
    └── AdminDashboard.jsx               # Admin portal (4 tabs)

server/
├── index.js                             # Express app entry + Socket.io
├── socket.js                            # Socket.io handlers (JWT auth, rooms)
├── package.json                         # Backend deps
├── .env                                 # MONGO_URI, JWT_SECRET, NODE_ENV
├── config/
│   └── db.js                            # MongoDB connection
├── utils/
│   └── generateToken.js                 # JWT helper
├── models/
│   ├── User.js                          # User schema
│   ├── Report.js                        # Report schema (+ AI metadata fields)
│   └── Notification.js                  # Notification schema (6 types)
├── middleware/
│   └── auth.js                          # Auth middleware
├── services/
│   └── aiService.js                     # AI NLP engine (Phase 5) — tagging, priority, routing, spam, dedup, ETA
├── controllers/
│   ├── authController.js                # Auth logic
│   ├── reportController.js              # Report CRUD + AI integration + notification triggers
│   ├── userController.js                # User management
│   └── notificationController.js        # Notification CRUD
└── routes/
    ├── auth.js                          # Auth routes
    ├── reports.js                       # Report routes (+ POST /:id/analyze)
    ├── users.js                         # User routes
    └── notifications.js                 # Notification routes
```
