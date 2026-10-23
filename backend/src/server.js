import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shops.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error("Missing JWT_SECRET or DATABASE_URL in .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Bazaar API" }));
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 5000);
const server = app.listen(port, () => console.log(`Bazaar API running on http://localhost:${port}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);