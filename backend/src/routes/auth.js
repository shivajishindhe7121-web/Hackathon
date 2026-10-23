import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "BUYER" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!["BUYER", "SELLER"].includes(role)) {
      return res.status(400).json({ error: "Role must be BUYER or SELLER" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase().trim(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Email already registered" });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: (email || "").toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
});

export default router;