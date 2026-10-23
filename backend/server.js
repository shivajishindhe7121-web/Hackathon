require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const shopsRoutes = require('./routes/shops');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Enable CORS for web clients & mobile PWAs
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Real-time WebSocket layer with Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Attach io instance to express app so routes can broadcast events
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`⚡ Client connected to real-time events: ${socket.id}`);

  // Allow seller clients to join their specific shop room
  socket.on('join_shop', (shopId) => {
    socket.join(shopId);
    console.log(`🏪 Socket ${socket.id} joined shop room: ${shopId}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ai', aiRoutes);

// Health Check & Root Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Bazaar Hyperlocal API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/login',
      shops: '/api/shops',
      products: '/api/products',
      compareNearby: '/api/products/compare?q=Atta',
      orders: '/api/orders',
      aiPhotoListing: '/api/ai/photo-to-listing',
      aiGrowthCoach: '/api/ai/growth-coach/:shopId',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🛒  BAZAAR HYPERLOCAL API & SOCKET SERVER IS READY     ║
╠═══════════════════════════════════════════════════════════╣
║   API Server:   http://localhost:${PORT}                      ║
║   Health Check: http://localhost:${PORT}/api/health           ║
║   Environment:  ${process.env.NODE_ENV || 'development'}                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
