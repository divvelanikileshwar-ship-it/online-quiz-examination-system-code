const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Result = require("../models/Result");
const { auth, admin } = require("../middleware/auth");

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});
const validId = (id) => mongoose.isValidObjectId(id);

router.post("/auth/register", asyncRoute(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (password.length < 8) return res.status(400).json({ message: "Password must contain at least 8 characters." });
  if (await User.findOne({ email })) return res.status(409).json({ message: "This email is already registered." });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, cookieOptions).status(201).json({ user: publicUser(user) });
}));

router.post("/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !user.isActive || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, cookieOptions).json({ user: publicUser(user) });
}));
router.post("/auth/logout", (req, res) => res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }).json({ message: "Logged out." }));
router.get("/auth/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

router.get("/quizzes", auth, asyncRoute(async (req, res) => {
  const filter = req.user.role === "admin" && req.query.all === "true" ? {} : { status: "published" };
  res.json(await Quiz.find(filter).sort({ createdAt: -1 }));
}));
router.post("/quizzes", auth, admin, asyncRoute(async (req, res) => {
  const { title, category, description, durationMinutes, difficulty, allowedAttempts, negativeMarking, passingPercentage, status } = req.body;
  if (!String(title || "").trim() || !String(category || "").trim()) return res.status(400).json({ message: "Quiz title and category are required." });
  const quiz = await Quiz.create({
    title: String(title).trim(), category: String(category).trim(), description: String(description || ""),
    durationMinutes: Math.max(1, Number(durationMinutes) || 15), difficulty: difficulty || "medium",
    allowedAttempts: Math.max(1, Number(allowedAttempts) || 1), negativeMarking: Math.max(0, Number(negativeMarking) || 0),
    passingPercentage: Math.min(100, Math.max(0, Number(passingPercentage) || 40)), status: status || "draft", createdBy: req.user._id,
  });
  res.status(201).json(quiz);
}));
router.patch("/quizzes/:id", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
  const allowed = ["title", "category", "description", "durationMinutes", "difficulty", "allowedAttempts", "negativeMarking", "passingPercentage", "status"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  res.json(quiz);
}));
router.delete("/quizzes/:id", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found." });
  await Question.deleteMany({ quizId: quiz._id });
  res.json({ message: "Quiz and its questions deleted." });
}));

router.get("/quizzes/:id/questions", auth, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || (quiz.status !== "published" && req.user.role !== "admin")) return res.status(404).json({ message: "Quiz not found." });
  const query = Question.find({ quizId: quiz._id }).sort({ createdAt: 1 });
  res.json(req.user.role === "admin" ? await query : await query.select("-correctOption -explanation"));
}));
router.post("/quizzes/:id/questions", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid quiz ID." });
  const { questionText, options, correctOption, marks, explanation, topic } = req.body;
  if (!String(questionText || "").trim() || !Array.isArray(options) || options.length < 2 || options.some((o) => !String(o).trim())) {
    return res.status(400).json({ message: "Question text and at least two non-empty options are required." });
  }
  if (!Number.isInteger(Number(correctOption)) || Number(correctOption) < 0 || Number(correctOption) >= options.length) {
    return res.status(400).json({ message: "Correct option must point to an existing option." });
  }
  if (!(await Quiz.exists({ _id: req.params.id }))) return res.status(404).json({ message: "Quiz not found." });
  const question = await Question.create({ quizId: req.params.id, questionText: String(questionText).trim(), options, correctOption: Number(correctOption), marks: Math.max(1, Number(marks) || 1), explanation: explanation || "", topic: topic || "General" });
  res.status(201).json(question);
}));
router.patch("/questions/:id", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
  const fields = ["questionText", "options", "correctOption", "marks", "explanation", "topic"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => fields.includes(k)));
  const question = await Question.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ message: "Question not found." });
  res.json(question);
}));
router.delete("/questions/:id", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ message: "Question not found." });
  res.json({ message: "Question deleted." });
}));

router.post("/exams/:quizId/start", auth, asyncRoute(async (req, res) => {
  if (!validId(req.params.quizId)) return res.status(400).json({ message: "Invalid quiz ID." });
  const quiz = await Quiz.findOne({ _id: req.params.quizId, status: "published" });
  if (!quiz) return res.status(404).json({ message: "Quiz is not available." });
  const existing = await Attempt.findOne({ quizId: quiz._id, userId: req.user._id, status: "in_progress" });
  if (existing) return res.json({ attemptCode: existing.attemptCode, expiresAt: existing.expiresAt });
  const usedAttempts = await Attempt.countDocuments({ quizId: quiz._id, userId: req.user._id, status: "submitted" });
  if (usedAttempts >= quiz.allowedAttempts) return res.status(403).json({ message: "You have used all allowed attempts for this quiz." });
  const questions = await Question.find({ quizId: quiz._id }).select("_id");
  if (!questions.length) return res.status(400).json({ message: "This quiz has no questions yet." });
  const attempt = await Attempt.create({
    attemptCode: crypto.randomBytes(12).toString("hex").toUpperCase(), quizId: quiz._id, userId: req.user._id,
    startedAt: new Date(), expiresAt: new Date(Date.now() + quiz.durationMinutes * 60000),
    answers: questions.map((q) => ({ questionId: q._id })),
  });
  res.status(201).json({ attemptCode: attempt.attemptCode, expiresAt: attempt.expiresAt });
}));
router.get("/attempts/:code", auth, asyncRoute(async (req, res) => {
  const attempt = await Attempt.findOne({ attemptCode: req.params.code, userId: req.user._id });
  if (!attempt) return res.status(404).json({ message: "Attempt not found." });
  const [quiz, questions] = await Promise.all([
    Quiz.findById(attempt.quizId),
    Question.find({ quizId: attempt.quizId }).select("-correctOption -explanation"),
  ]);
  res.json({ attempt, quiz, questions });
}));
router.patch("/attempts/:code/answer", auth, asyncRoute(async (req, res) => {
  const attempt = await Attempt.findOne({ attemptCode: req.params.code, userId: req.user._id, status: "in_progress" });
  if (!attempt) return res.status(404).json({ message: "Active attempt not found." });
  if (Date.now() >= new Date(attempt.expiresAt).getTime()) return res.status(410).json({ message: "Time expired. Submit the examination now." });
  const answer = attempt.answers.find((a) => String(a.questionId) === String(req.body.questionId));
  if (!answer) return res.status(400).json({ message: "Question does not belong to this attempt." });
  const question = await Question.findById(answer.questionId);
  const selected = req.body.selectedOption;
  if (!question || !Number.isInteger(selected) || selected < 0 || selected >= question.options.length) return res.status(400).json({ message: "Select a valid option." });
  answer.selectedOption = selected;
  await attempt.save();
  res.json({ message: "Answer saved." });
}));

async function finalizeAttempt(attempt) {
  const existing = await Result.findOne({ attemptId: attempt._id });
  if (existing) return existing;
  const [quiz, questions] = await Promise.all([Quiz.findById(attempt.quizId), Question.find({ quizId: attempt.quizId })]);
  let score = 0, totalMarks = 0, correctAnswers = 0, incorrectAnswers = 0, skippedAnswers = 0;
  for (const question of questions) {
    totalMarks += question.marks;
    const answer = attempt.answers.find((a) => String(a.questionId) === String(question._id));
    if (!answer || answer.selectedOption === null || answer.selectedOption === undefined) skippedAnswers++;
    else if (answer.selectedOption === question.correctOption) { score += question.marks; correctAnswers++; }
    else { score -= Number(quiz?.negativeMarking || 0); incorrectAnswers++; }
  }
  score = Math.max(0, Math.round(score * 100) / 100);
  const percentage = totalMarks ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();
  return Result.create({ attemptId: attempt._id, userId: attempt.userId, quizId: attempt.quizId, score, totalMarks, percentage, correctAnswers, incorrectAnswers, skippedAnswers, completedAt: new Date() });
}
router.post("/attempts/:code/submit", auth, asyncRoute(async (req, res) => {
  const attempt = await Attempt.findOne({ attemptCode: req.params.code, userId: req.user._id });
  if (!attempt) return res.status(404).json({ message: "Attempt not found." });
  if (attempt.status !== "in_progress") {
    const previous = await Result.findOne({ attemptId: attempt._id });
    return previous ? res.json(previous) : res.status(409).json({ message: "Attempt is already closed." });
  }
  const result = await finalizeAttempt(attempt);
  res.json(result);
}));

router.get("/results", auth, asyncRoute(async (req, res) => {
  const filter = req.user.role === "admin" && req.query.all === "true" ? {} : { userId: req.user._id };
  res.json(await Result.find(filter).populate("quizId", "title category").populate("userId", "name email").sort({ completedAt: -1 }));
}));
router.get("/admin/overview", auth, admin, asyncRoute(async (req, res) => {
  const [users, quizzes, attempts, results] = await Promise.all([
    User.countDocuments(), Quiz.countDocuments(), Attempt.countDocuments(), Result.countDocuments(),
  ]);
  res.json({ users, quizzes, attempts, results });
}));
router.get("/admin/users", auth, admin, asyncRoute(async (req, res) => {
  res.json(await User.find().select("name email role isActive createdAt").sort({ createdAt: -1 }));
}));
router.patch("/admin/users/:id/status", auth, admin, asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid user ID." });
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: "You cannot deactivate your own account." });
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(req.body.isActive) }, { new: true }).select("name email role isActive");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user);
}));

module.exports = router;
