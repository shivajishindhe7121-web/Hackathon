import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireRole("BUYER"), async (req, res, next) => {
  try {
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array of { productId, quantity }" });
    }
    const quantities = new Map();
    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)
        return res.status(400).json({ error: "Each item needs productId and positive integer quantity" });
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderItems = [];
      let totalPaise = 0;
      for (const [productId, quantity] of quantities) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) throw new Error(`Product unavailable: ${productId}`);
        if (product.stock < quantity) throw new Error(`Insufficient stock for ${product.name}`);
        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity }, isActive: true },
          data: { stock: { decrement: quantity } }
        });
        if (updated.count !== 1) throw new Error(`Stock changed; please retry ${product.name}`);
        totalPaise += product.pricePaise * quantity;
        orderItems.push({ productId, quantity, unitPricePaise: product.pricePaise });
      }
      return tx.order.create({
        data: { buyerId: req.user.userId, totalPaise, items: { create: orderItems } },
        include: { items: { include: { product: { select: { id: true, name: true } } } } }
      });
    });
    res.status(201).json({ order });
  } catch (err) {
    if (/Product unavailable|Insufficient stock|Stock changed/.test(err.message))
      return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.userId },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ orders });
  } catch (err) { next(err); }
});

router.patch("/:id/status", requireAuth, requireRole("SELLER"), async (req, res, next) => {
  try {
    const allowed = ["ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid order status" });
    const shop = await prisma.shop.findUnique({ where: { ownerId: req.user.userId } });
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, items: { some: { product: { shopId: shop.id } } } },
      include: { items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ error: "Order not found for your shop" });
    const updated = await prisma.order.update({
      where: { id: order.id }, data: { status: req.body.status }
    });
    res.json({ order: updated });
  } catch (err) { next(err); }
});

export default router;