const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bazaar_default_secret_key';

// Demo users
const DEMO_USERS = [
  {
    id: 'user-seller-1',
    name: 'Ramesh Sharma',
    phone: '+91 98450 12345',
    role: 'SELLER',
    shopId: 'shop-1',
    password: 'password123',
  },
  {
    id: 'user-buyer-1',
    name: 'Aditi Rao',
    phone: '+91 98451 77665',
    role: 'BUYER',
    password: 'password123',
  },
];

/**
 * POST /api/auth/login
 * Login with phone & password or 1-click demo login
 */
router.post('/login', (req, res) => {
  try {
    const { phone, role } = req.body;

    const user = DEMO_USERS.find(
      (u) => (phone && u.phone === phone) || (role && u.role === role)
    ) || DEMO_USERS[0];

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, shopId: user.shopId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        shopId: user.shopId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Validate token and return current session profile
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
