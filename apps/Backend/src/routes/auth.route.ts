import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

function asyncHandler(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

router.post("/signup", asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "Username, password, and email are required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: { email, username, password: hashedPassword },
    select: { id: true, email: true, username: true },
  });

  const token = jwt.sign({ userid: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({ message: "User created successfully", user: newUser, token });
}));

router.post("/signin", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userid: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({
    message: "Logged in successfully",
    token,
    user: { id: user.id, email: user.email, username: user.username },
  });
}));

export default router;