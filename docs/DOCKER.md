# CivicFix Docker Setup

## Quick Start

```bash
# Optional: copy and edit environment overrides
# cp .env.docker.example .env

docker compose up --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:5000/api
- Swagger: http://localhost:5000/api/docs

## Environment Overrides

Docker Compose reads variables from a root `.env` file. You can copy `.env.docker.example` to `.env` and update values as needed.

Required for production:
- `MONGO_URI` (MongoDB Atlas or another server)
- `JWT_SECRET` (strong random string)
- `CLIENT_URL` (URL where the frontend is hosted)

## Notes

- The frontend bundle is built with `VITE_API_URL` at build time. If you change the API URL, rebuild the client image.
- The included `mongo` service is for local development only.
