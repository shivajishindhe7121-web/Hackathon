# Bazaar Backend Starter

A learning/hackathon MVP backend for Bazaar: users, seller shops, products, inventory, and orders.

## Requirements
- Node.js 20+ (LTS recommended)
- PostgreSQL running locally or a hosted PostgreSQL database
- npm

## Setup (Windows PowerShell)
1. Extract this ZIP and open PowerShell in the extracted `bazaar-backend-starter` folder.
2. Install packages:
   ```powershell
   npm install
   ```
3. Create a PostgreSQL database named `bazaar` using pgAdmin or `createdb bazaar`.
4. Copy `.env.example` to `.env`, then update `DATABASE_URL` with your PostgreSQL username/password. Change `JWT_SECRET` to a long random secret.
5. Create tables and generate Prisma Client:
   ```powershell
   npx prisma migrate dev --name init
   ```
6. Start the API:
   ```powershell
   npm run dev
   ```
7. Open `http://localhost:5000/api/health`. You should see `{"status":"ok","app":"Bazaar API"}`.

## API endpoints
- `POST /api/auth/register` — create buyer/seller
- `POST /api/auth/login` — get JWT
- `GET /api/shops?city=Belagavi` — list shops, optionally filter by city
- `POST /api/shops` — seller creates one shop (Bearer token required)
- `GET /api/products?search=rice&shopId=...` — list/search products
- `POST /api/products` — seller adds product (Bearer token required)
- `PATCH /api/products/:id` — seller updates own product/stock (Bearer token required)
- `POST /api/orders` — buyer places order and stock is decremented in a transaction (Bearer token required)
- `GET /api/orders/mine` — list buyer's orders (Bearer token required)
- `PATCH /api/orders/:id/status` — seller updates order status (Bearer token required)

Prices are accepted as rupees in product requests and stored as integer paise to avoid floating-point money calculations.

## Quick testing
Use Postman or Thunder Client. Register a seller:
```json
{"name":"Test Seller","email":"seller@example.com","password":"Password123","role":"SELLER"}
```
Login with that email/password and copy `token`. Add header `Authorization: Bearer YOUR_TOKEN`.

Create a shop:
```json
{"name":"Test Kirana","city":"Belagavi","address":"Main Road"}
```
Add product:
```json
{"name":"Rice 1kg","priceRupees":65,"stock":10,"category":"Groceries"}
```
Register/login a buyer and use the buyer token to create an order:
```json
{"items":[{"productId":"PASTE_PRODUCT_ID","quantity":2}]}
```

## Important limitations before a public launch
This is a starter, not a production-hardened commerce platform. Add rate limiting, stricter request validation, seller-specific order splitting (a cart spanning multiple shops needs a deliberate design), audited order-status transitions, cancellation/refund stock restoration, secure deployment secrets, image upload handling, tests, and payment-provider verification before real customers or money are involved. The included order endpoint is suitable for a basic demo where each order uses products from one shop.
