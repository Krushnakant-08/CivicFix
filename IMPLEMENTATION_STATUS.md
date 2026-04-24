# CivicFix — Implementation Status

> **Last Updated:** April 24, 2026
> **Resume From:** All Phases Complete

---

## ✅ Phase 1 — Foundation & Core Infrastructure (COMPLETE)

Everything below is built, tested, and working.

### Frontend (React 19 + Vite 7 + TailwindCSS 4)
| File | Purpose |
|:---|:---|
| `src/App.jsx` | Main router — public routes, protected routes (role-gated), 404, skip-to-content link, ChatBot |
| `src/main.jsx` | React entry point |
| `src/index.css` | Design system — Inter font, card/button utilities, slide-up animation, skeleton shimmer, accessibility, chatbot styles |
| `src/context/AuthContext.jsx` | Auth state (login, register, logout, getMe, role checks) |
| `src/services/api.js` | Fetch wrapper — authAPI, usersAPI, reportsAPI, healthCheck |
| `src/components/auth/ProtectedRoute.jsx` | Route guard (auth + role check + loading state) |
| `src/components/layout/Navbar.jsx` | Responsive nav with scroll effect, user dropdown, role badges, ARIA attributes |
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
| `server/controllers/reportController.js` | CRUD + track, upvote (with notification), assign, stats, analytics, predictions |
| `server/controllers/userController.js` | getAllUsers, getById, updateProfile, updateRole, toggleStatus |
| `server/routes/auth.js` | POST register/login, GET me, POST create-staff (admin) |
| `server/routes/reports.js` | Full report routes with role guards, analytics & predictions |
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
| `src/pages/ReportIssue.jsx` | **Full report submission form** — title, category selector (7 types), description with char counter, GPS auto-location via Geolocation API + reverse geocoding (OpenStreetMap Nominatim), drag-and-drop image upload with previews (up to 3 images), anonymous reporting toggle, success state with tracking ID + copy-to-clipboard, **AI insights panel** (priority, severity, department, ETA, auto-tags, duplicate flag), **voice-to-text input** (Phase 7) |
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

## ✅ Phase 6 — Interactive Map & Heatmap (COMPLETE)

### What was built:

#### Backend — Lightweight Map Endpoint
| File | What it does |
|:---|:---|
| `server/controllers/reportController.js` | **`getMapReports`** — Returns geo-optimized report data (only trackingId, title, category, status, priority, coordinates, address, createdAt, upvotes). Filters by `status`, `category`, `priority` query params. Excludes reports without GPS coordinates. Uses `.lean()` for performance. |
| `server/routes/reports.js` | `GET /api/reports/map` — Public route placed before the `:id` catch-all |

#### Frontend — Full-Screen Interactive Map
| File | What it does |
|:---|:---|
| `src/pages/MapView.jsx` | **Full-screen map page** (`/map`) — Leaflet + react-leaflet with Carto Light tiles, custom SVG drop-pin markers color-coded by category (🔴 Roads, 🟢 Sanitation, 🔵 Water, 🟡 Electricity, 🟣 Parks, 🟠 Traffic, ⚪ Other), density-based cluster icons (teal→blue→indigo gradient), canvas heatmap layer with Blue→Cyan→Green→Yellow→Red gradient weighted by upvotes, glassmorphism filter sidebar (category/status/priority dropdowns), interactive legend that doubles as quick filter, "Near Me" geolocation with smooth flyTo animation, stats floating card, mode indicator badge, error toast, loading overlay |
| `src/services/api.js` | **`getMapData`** — API helper for `GET /reports/map` with query param support |
| `src/App.jsx` | Added `/map` public route |
| `src/components/layout/Navbar.jsx` | Added "Map" link in both desktop and mobile navigation (between Feed and My Reports) |
| `src/index.css` | **~580 lines** of map-specific CSS — filter panel with glassmorphism, responsive slide-out drawer on mobile, view mode pill toggle, custom select dropdowns, Near Me button, category legend grid, stats card, mode badge, loading spinner, error toast, Leaflet overrides (popup card, zoom controls, attribution, marker/cluster reset, popup inner layout with Track Report gradient button) |

#### Map Features
| Feature | Implementation |
|:---|:---|
| **Marker Clustering** | `react-leaflet-cluster` with custom `iconCreateFunction` — density-based sizing (40/48/56px), teal→blue→indigo gradient, count labels |
| **Heatmap Toggle** | `leaflet.heat` canvas layer — Blue→Cyan→Green→Yellow→Red gradient, radius 25px, blur 15px, intensity weighted by upvotes |
| **Filter Sidebar** | Glassmorphism panel (desktop static, mobile slide-out drawer), category/status/priority dropdowns, "Clear all filters" button |
| **Marker Popups** | Glass-card popup with category emoji + label, status badge, title (2-line clamp), address with pin icon, priority badge, upvote count, date, gradient "Track Report →" button |
| **Interactive Legend** | Click any category to toggle filter — highlighted with active ring |
| **Near Me** | Browser Geolocation API → `map.flyTo()` with smooth 1.5s animation |
| **Stats Card** | Floating bottom-right card showing issue count, context-aware label |
| **Error Handling** | Red toast with dismiss button for API errors and geolocation failures |

### Dependencies Added:
- `react-leaflet-cluster` — React wrapper for Leaflet.markercluster
- (Already had: `leaflet`, `react-leaflet`, `leaflet.markercluster`, `leaflet.heat`)

### Key Details:
- Map defaults to **Pune, India** (`[18.5204, 73.8567]`) at zoom level 12
- Map page is **public** (no authentication required), consistent with the Public Feed pattern
- Reports without GPS coordinates are silently excluded (backend filter + frontend guard)
- Heatmap intensity is weighted by upvotes: `Math.min((upvotes * 0.15) + 0.5, 1)`
- Custom SVG drop-pin markers with category-colored fill, white inner ring, and drop shadow
- Cluster icons scale in size and color intensity based on child count (< 10 / < 50 / 50+)
- Leaflet CSS overrides placed outside `@layer` to avoid Tailwind specificity conflicts
- Mobile-first responsive: filter panel becomes a slide-out drawer with backdrop on < 768px

---

## ✅ Phase 7 — Analytics, Predictions & Accessibility (COMPLETE)

### What was built:

#### Backend — Analytics & Predictions Engine
| File | What it does |
|:---|:---|
| `server/controllers/reportController.js` | **`getAnalytics`** — Returns: daily report trend (last 30 days), avg resolution time by category & priority, resolution rate, status/category/priority breakdowns, hourly activity distribution, top 10 reported areas, monthly comparison (this month vs last month with % change) |
| `server/controllers/reportController.js` | **`getPredictions`** — Returns: hotspot clusters (areas with 3+ reports in 60 days, grouped by ~500m grid, with dominant category/priority, unresolved count, confidence score, risk level), day-of-week pattern, category trends (4-week comparison with up/down/stable indicators) |
| `server/routes/reports.js` | `GET /api/reports/analytics` and `GET /api/reports/predictions` — Admin-only routes |

#### Frontend — Analytics Dashboard
| File | What it does |
|:---|:---|
| `src/pages/AnalyticsDashboard.jsx` | **Full analytics dashboard** (`/dashboard/analytics`) — 2-tab interface: **Analytics** (4 metric cards with monthly comparison, SVG line chart for daily trends, progress ring for resolution rate, bar charts for hourly activity, horizontal bars for resolution times by category/priority, category/status breakdowns, ranked top areas), **Predictions** (hotspot cards with risk levels and confidence scores, day-of-week bar chart, 4-week category trend comparison with directional arrows) |
| `src/services/api.js` | **`getAnalytics`** and **`getPredictions`** — API helpers for analytics endpoints |

#### Voice-based Reporting (Speech-to-Text)
| File | What it does |
|:---|:---|
| `src/pages/ReportIssue.jsx` | **Web Speech API voice input** — Microphone toggle button next to description field, continuous recognition mode, pulsing red indicator when recording, appends transcribed text to description, graceful fallback for unsupported browsers, permission error handling |

#### Accessibility Features
| File | What it does |
|:---|:---|
| `src/App.jsx` | **Skip-to-content link** (visible on Tab focus), `id="main-content"` on `<main>`, `role="main"` and `aria-label` attributes |
| `src/components/layout/Navbar.jsx` | `role="navigation"`, `aria-label="Main navigation"`, `aria-expanded` / `aria-haspopup` on dropdown buttons, `aria-controls` on mobile toggle, `role="menu"` / `role="menuitem"` on mobile nav, Escape key closes dropdowns, `focus-visible` ring styles |
| `src/index.css` | **`.skip-to-content`** — hidden until focused; **`.sr-only`** — screen-reader-only utility; **focus-visible rings** for all interactive elements; **reduced motion** — `prefers-reduced-motion: reduce` disables all animations |

#### AI Chatbot Assistant
| File | What it does |
|:---|:---|
| `src/components/ui/ChatBot.jsx` | **Floating chatbot** — fixed-position FAB button (bottom-right), expandable glassmorphism chat panel, rule-based FAQ engine (15+ topic patterns covering reporting, tracking, categories, statuses, GPS, map, feed, upvotes, anonymous, AI analysis, notifications, contact), markdown-like bold rendering, quick-reply chip buttons, navigation link buttons, typing indicator with bouncing dots, auto-scroll, focus management, fully responsive (full-width on mobile) |
| `src/index.css` | **~240 lines** of chatbot CSS — floating FAB with gradient + hover lift, chat panel with glassmorphism + slide-up animation, gradient header, user/bot message bubbles, typing dots animation, quick-reply chips, link buttons, input area with send button, mobile responsive breakpoints |

#### Environment Files
| File | What it does |
|:---|:---|
| `.env.example` | Frontend env template — `VITE_API_URL` |
| `server/.env.example` | Backend env template — `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `CLIENT_URL` |

### Key Details:
- **Zero new NPM dependencies** — All charts use inline SVG, speech uses Web Speech API, chatbot is rule-based pattern matching
- Analytics dashboard uses custom `MiniLineChart`, `MiniBarChart`, and `ProgressRing` SVG components — no charting library
- Predictive hotspot clustering rounds GPS coordinates to ~500m grid cells and requires ≥ 3 reports per cluster
- Confidence scores combine recency (40%), density (40%), and unresolved ratio (20%), capped at 95%
- Risk levels: ≥ 70% = high, ≥ 40% = medium, < 40% = low
- Speech-to-text uses `webkitSpeechRecognition` / `SpeechRecognition` (Chrome, Edge, Safari supported)
- Chatbot FAQ engine matches 15+ topic patterns with prioritized keyword matching and fallback responses
- All new features follow the existing design system (glassmorphism, gradient buttons, slide-up animations, Inter font)
- `.env.example` files created for both frontend and server directories

---

## ✅ Phase 8 — Advanced Features & Hardening (COMPLETE)

Everything below is built, tested, and working.

### 8.1 Progressive Web App (PWA)
| File | What it does |
|:---|:---|
| `vite.config.js` | `vite-plugin-pwa` configuration — manifest, service worker registration, and Workbox strategies (NetworkFirst for reports, CacheFirst for fonts/tiles) |
| `src/components/ui/PWAInstallPrompt.jsx` | Smart install banner — detects `beforeinstallprompt` event, shows floating glassmorphism prompt with "Install" and "Maybe Later" buttons |
| `public/icons/` | PWA icons (192, 512, maskable) |
| `public/offline.html` | Fallback page for when the user is offline and the requested page isn't cached |

### 8.2 Blockchain-inspired Audit Trail
| File | What it does |
|:---|:---|
| `server/models/AuditLog.js` | **Hash-chained ledger** — SHA-256 hashing of entry data + previous block hash + index. Detects tampering if any record is changed. |
| `server/routes/audit.js` | Routes for fetching log history and triggering chain verification |
| `src/pages/AuditTrail.jsx` | **Admin audit dashboard** (`/dashboard/audit`) — Displays tamper-proof log of all system actions with activity-colored badges, block hashes, and "Verify Integrity" functionality |

### 8.3 Performance Optimization
| Mechanism | Implementation |
|:---|:---|
| **Code Splitting** | `src/App.jsx` — `lazy()` + `Suspense` for all major routes (MapView, Analytics, Dashboards, etc.) to reduce initial bundle size |
| **Manual Chunking** | `vite.config.js` — Rollup manual chunks for `react-vendor`, `map-vendor`, and `socket-vendor` to optimize caching |
| **Asset Optimization** | SVG-first designs; lean MongoDB queries with `.select()` and `.lean()` |

### 8.4 Security Hardening
| Layer | Security Feature |
|:---|:---|
| **HTTP Headers** | `helmet` — CSP (restricted for Swagger), HSTS, Clickjacking protection, etc. |
| **Rate Limiting** | `express-rate-limit` — Multi-tier limits (General API: 200/15m, Auth: 20/15m, Submissions: 30/1h) |
| **CORS** | Tightened to `process.env.CLIENT_URL` with credentials support |
| **Injection Protection** | `express-mongo-sanitize` — strips `$` signs; `xss-clean` — strips malicious HTML/JS |

### 8.5 API Documentation
| File | What it does |
|:---|:---|
| `server/config/swagger.js` | Swagger JSDoc configuration with metadata and security schemes |
| `server/index.js` | `/api/docs` — Interactive Swagger UI with custom branding; `/api/docs.json` for raw OpenAPI spec |

### 8.6 Deployment & CI/CD
| File | What it does |
|:---|:---|
| `.github/workflows/ci.yml` | Sets up automated CI pipeline on push/PR. Installs dependencies and runs frontend build verification (`npm run lint`, `npm run build`). |
| `vercel.json` | Vercel platform routing configuration. Tells Vercel to route any unknown URLs to `index.html` ensuring clean client-side routing on React Router. |

### Key Details:
- **Zero-Trust Chain:** Audit logs are permanent; even an admin cannot modify a log without breaking the hash chain
- **Offline Reliability:** Service worker caches OpenStreetMap tiles and Google Fonts for basic map/UI availability without internet
- **Security First:** Application passes basic pen-test requirements for XSS and NoSQL injection
- **API First:** Full Swagger documentation allows other Developers to easily integrate with CivicFix
- **Deployment Ready:** Automated verification via GitHub Actions; Vercel routing fully configured out-of-the-box.

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
| Maps | Leaflet.js + react-leaflet + leaflet.heat + clustering | ✅ Active |
| Analytics | Custom SVG charts + MongoDB aggregation | ✅ Active |
| Predictions | Rule-based hotspot clustering | ✅ Active |
| Voice Input | Web Speech API (browser-native) | ✅ Active |
| Chatbot | Rule-based FAQ engine (ChatBot.jsx) | ✅ Active |
| Accessibility | ARIA, skip links, focus-visible, reduced motion | ✅ Active |
| Deployment | Vercel + Railway/AWS | ⬜ Phase 8 |

---

## 📁 Full File Tree (Source Only)

```
src/
├── App.jsx                              # Router with all routes + 404 + skip-to-content + ChatBot
├── main.jsx                             # React entry
├── index.css                            # Design system (card, btn, input, animations, map, accessibility, chatbot)
├── context/
│   ├── AuthContext.jsx                  # Auth state management
│   └── NotificationContext.jsx          # Global notification state + WebSocket
├── services/
│   ├── api.js                           # API service layer (+ analytics, predictions)
│   └── socket.js                        # Socket.io client
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx           # Route guard
│   ├── layout/
│   │   ├── Navbar.jsx                   # Top navigation (ARIA-accessible, Analytics link)
│   │   └── Footer.jsx                   # Footer with SVG social icons
│   ├── ui/
│   │   ├── Button.jsx                   # Reusable button (primary/secondary)
│   │   ├── NotificationBell.jsx         # Notification dropdown
│   │   └── ChatBot.jsx                  # AI chatbot assistant (Phase 7)
│   └── reports/
│       ├── ReportCard.jsx               # Report card (3 variants, colored-dot badges)
│       └── FilterBar.jsx                # Filter dropdowns
└── pages/
    ├── Home.jsx                         # Landing page (hero, steps, features, CTA)
    ├── Login.jsx                        # Login form
    ├── Register.jsx                     # Register form
    ├── ReportIssue.jsx                  # Submit report (GPS, images, anon, AI insights, voice input)
    ├── TrackReport.jsx                  # Track by ID (+ AI insights panel)
    ├── MyReports.jsx                    # Citizen's reports
    ├── PublicFeed.jsx                   # Community issue feed + upvotes
    ├── MapView.jsx                      # Interactive map + heatmap (Phase 6)
    ├── AnalyticsDashboard.jsx           # Analytics & predictions dashboard (Phase 7)
    ├── DepartmentDashboard.jsx          # Department management
    └── AdminDashboard.jsx               # Admin portal (4 tabs)

server/
├── index.js                             # Express app entry + Socket.io
├── socket.js                            # Socket.io handlers (JWT auth, rooms)
├── package.json                         # Backend deps
├── .env                                 # MONGO_URI, JWT_SECRET, NODE_ENV
├── .env.example                         # Environment template (Phase 7)
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
│   └── aiService.js                     # AI NLP engine (Phase 5)
├── controllers/
│   ├── authController.js                # Auth logic
│   ├── reportController.js              # Report CRUD + AI + notifications + analytics + predictions
│   ├── userController.js                # User management
│   └── notificationController.js        # Notification CRUD
└── routes/
    ├── auth.js                          # Auth routes
    ├── reports.js                       # Report routes (+ analytics, predictions)
    ├── users.js                         # User routes
    └── notifications.js                 # Notification routes

# Root
├── .env                                 # Frontend env (VITE_API_URL)
├── .env.example                         # Frontend env template (Phase 7)
├── package.json                         # Frontend deps
├── vite.config.js                       # Vite config
└── IMPLEMENTATION_STATUS.md             # This file
```
