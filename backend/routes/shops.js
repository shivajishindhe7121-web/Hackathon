const express = require('express');
const router = express.Router();
const { db, DEFAULT_BUYER_LOCATION } = require('../data/db');

/**
 * GET /api/shops
 * Returns all neighbourhood shops sorted by distance from buyer location.
 * Query params: lat, lng, openNow
 */
router.get('/', (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_BUYER_LOCATION.lat;
    const lng = req.query.lng ? parseFloat(req.query.lng) : DEFAULT_BUYER_LOCATION.lng;
    const openNow = req.query.openNow === 'true';

    let shops = db.getAllShops(lat, lng);
    if (openNow) {
      shops = shops.filter((s) => s.isOpen);
    }

    res.json({
      success: true,
      count: shops.length,
      buyerLocation: { lat, lng },
      shops,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shops/:id
 * Get single shop by ID with live distance
 */
router.get('/:id', (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : DEFAULT_BUYER_LOCATION.lat;
    const lng = req.query.lng ? parseFloat(req.query.lng) : DEFAULT_BUYER_LOCATION.lng;

    const shop = db.getShopById(req.params.id, lat, lng);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/shops
 * Onboard a new seller & create a storefront
 */
router.post('/', (req, res) => {
  try {
    const { name, owner, category, address, phone, location } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Shop name and phone are required' });
    }

    const newShop = db.createShop({
      name,
      owner: owner || 'Local Merchant',
      category: category || 'Groceries & Daily Essentials',
      address: address || 'Neighbourhood Storefront',
      phone,
      location,
    });

    res.status(201).json({
      success: true,
      message: 'Storefront created successfully',
      shop: newShop,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/shops/:id/analytics
 * Retrieve seller performance metrics & stock-out warnings
 */
router.get('/:id/analytics', (req, res) => {
  try {
    const analytics = db.getShopAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
