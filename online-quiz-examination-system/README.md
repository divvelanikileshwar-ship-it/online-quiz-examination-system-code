# Online Quiz and Examination System

MERN starter project based on the uploaded project document. It includes a React/Vite frontend and Express/MongoDB backend.

## Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## Run backend
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```
Backend: http://localhost:5000

## Run frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Frontend: http://localhost:5173

## Demo accounts
- Admin: `admin@quizsphere.dev` / `Admin@123`
- Student: `student@quizsphere.dev` / `Student@123`

Change JWT_SECRET and all demo passwords before deployment. This is a student-project starter, not a production proctoring system.
