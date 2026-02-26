# Latrobe-Crowdsourcing (Frontend)

React + Vite frontend for the CivicConnect platform.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set backend URL (default local backend):

   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. Start development server:

   ```bash
   npm run dev
   ```

## Authentication Flow

- `POST /api/auth/signup` is used by `/signup`
- `POST /api/auth/login` is used by `/login`
- `GET /api/auth/me` validates stored session token on app load

Token + user are persisted in local storage and restored on refresh.

## Routes

- `/` Home
- `/login` Sign in
- `/signup` Sign up
- `/report` Protected route (requires login)
