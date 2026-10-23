import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(req.query.search ? { name: { contains: req.query.search, mode: "insensitive" } } : {}),
        ...(req.query.shopId ? { shopId: req.query.shopId } : {})
      },
      include: { shop: { select: { id: true, name: true, city: true, isOpen: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ products });
  } catch (err) { next(err); }
});

router.post("/", requireAuth, requireRole("SELLER"), async (req, res, next) => {
  try {
    const { name, description, category, priceRupees, stock, imageUrl } = req.body;
    if (!name || !Number.isFinite(Number(priceRupees)) || Number(priceRupees) <= 0 ||
        !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ error: "Provide name, positive priceRupees and non-negative integer stock" });
    }
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.userId } });
    if (!shop) return res.status(400).json({ error: "Create your shop before adding products" });
    const product = await prisma.product.create({
      data: {
        name, description, category, imageUrl, shopId: shop.id,
        pricePaise: Math.round(Number(priceRupees) * 100),
        stock: Number(stock)
      }
    });
    res.status(201).json({ product });
  } catch (err) { next(err); }
});

router.patch("/:id", requireAuth, requireRole("SELLER"), async (req, res, next) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.userId } });
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!shop || !existing || existing.shopId !== shop.id) {
      return res.status(404).json({ error: "Product not found in your shop" });
    }
    const data = {};
    for (const key of ["name", "description", "category", "imageUrl", "isActive"]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (req.body.priceRupees !== undefined) {
      if (!Number.isFinite(Number(req.body.priceRupees)) || Number(req.body.priceRupees) <= 0)
        return res.status(400).json({ error: "Price must be positive" });
      data.pricePaise = Math.round(Number(req.body.priceRupees) * 100);
    }
    if (req.body.stock !== undefined) {
      if (!Number.isInteger(Number(req.body.stock)) || Number(req.body.stock) < 0)
        return res.status(400).json({ error: "Stock must be a non-negative integer" });
      data.stock = Number(req.body.stock);
    }
    const product = await prisma.product.update({ where: { id: existing.id }, data });
    res.json({ product });
  } catch (err) { next(err); }
});

export default router;