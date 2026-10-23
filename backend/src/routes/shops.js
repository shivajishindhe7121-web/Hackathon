import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { city: { contains: req.query.city || "", mode: "insensitive" } },
      select: { id: true, name: true, address: true, city: true, latitude: true, longitude: true, isOpen: true }
    });
    res.json({ shops });
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requireRole("SELLER"), async (req, res, next) => {
  try {
    const { name, address, city, latitude, longitude } = req.body;
    if (!name || !city) return res.status(400).json({ error: "Shop name and city are required" });
    const shop = await prisma.shop.create({
      data: { name, address, city, latitude, longitude, ownerId: req.user.userId }
    });
    res.status(201).json({ shop });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "This seller already has a shop" });
    next(err);
  }
});

export default router;