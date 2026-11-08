# QuizSphere — Online Quiz & Examination System

A full-stack student project with a React/Vite interface, Express REST API and MongoDB persistence.

## Features

### Student
- Student registration, login and logout using HTTP-only JWT cookies
- Browse published quizzes and start/resume an active attempt
- Timed examinations with server-side expiry checks and automatic submission from the browser
- Save selected answers and submit for instant scoring
- Results history with percentage, correct, incorrect and skipped counts

### Administrator
- Admin-only dashboard with user, quiz, attempt and result totals
- Create quizzes, add multiple-choice questions and publish draft quizzes
- View all users and examination results
- Activate/deactivate student accounts

### Exam rules
- Configurable duration and maximum attempts
- Optional negative marking (configured per wrong answer)
- Correct answers are never sent to the student during an active exam
- Scores are calculated by the server, not trusted from the browser

## Project structure

```text
.
├── client/
│   ├── src/main.jsx
│   ├── src/style.css
│   ├── index.html
│   └── vite.config.js
├── server/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/
│   ├── routes/api.js
│   ├── seed.js
│   ├── server.js
│   └── .env.example
└── README.md
```

## Requirements

- Node.js 18 or later
- MongoDB local service or MongoDB Atlas database

## Run locally (Windows PowerShell)

### 1. Configure backend

Open a terminal in the repository root:

```powershell
cd server
Copy-Item .env.example .env
```

Edit `server/.env`. Set `MONGO_URI` to your MongoDB connection string and replace `JWT_SECRET` with a long random secret (at least 32 characters).

### 2. Install and seed

```powershell
npm install
npm run seed
npm run dev
```

The API runs at http://localhost:5000. Keep this terminal open.

The seed script is safe to rerun: it does not delete existing users, quizzes, questions or student attempts. It creates demo records only when missing.

### 3. Run frontend

Open a second terminal from the repository root:

```powershell
cd client
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` requests to the backend. Set `VITE_API_PROXY` if the API is hosted somewhere other than localhost:5000.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@quizsphere.dev | Admin@123 |
| Student | student@quizsphere.dev | Student@123 |

Change or remove demo credentials before making the app publicly accessible. Never use the demo admin account in production.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/quizzes`, `POST /api/quizzes`, `PATCH /api/quizzes/:id`, `DELETE /api/quizzes/:id`
- `GET/POST /api/quizzes/:id/questions`, `PATCH/DELETE /api/questions/:id`
- `POST /api/exams/:quizId/start`
- `GET /api/attempts/:code`, `PATCH /api/attempts/:code/answer`, `POST /api/attempts/:code/submit`
- `GET /api/results`, `GET /api/admin/overview`, `GET /api/admin/users`

All quiz-management and admin endpoints require an authenticated administrator.

## Before production deployment

This is a learning-project baseline, not a high-stakes examination platform. Before public deployment, add automated integration tests, stronger CSRF protection for cookie-authenticated writes, email verification/password reset, audit logging, robust concurrency handling for simultaneous exam submissions, and a deployment-specific CORS/cookie configuration. Use HTTPS, a managed database, unique secrets and non-demo credentials.
