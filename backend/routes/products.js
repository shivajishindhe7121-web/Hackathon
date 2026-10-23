const express = require('express');
const router = express.Router();
const { db, DEFAULT_BUYER_LOCATION } = require('../data/db');

/**
 * GET /api/products
 * Universal search & category filters for products
 * Query params: q, category, shopId
 */
router.get('/', (req, res) => {
  try {
    const { q, category, shopId } = req.query;
    const products = db.getAllProducts(q, category, shopId);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/compare
 * Cross-shop comparison widget backend:
 * Finds identical or similar items across multiple nearby stores with price, distance & pickup speed.
 * Query params: q (title or keyword), barcode, lat, lng
 */
router.get('/compare', (req, res) => {
  try {
    const { q, barcode, lat, lng } = req.query;
    const buyerLat = lat ? parseFloat(lat) : DEFAULT_BUYER_LOCATION.lat;
    const buyerLng = lng ? parseFloat(lng) : DEFAULT_BUYER_LOCATION.lng;

    const searchTerm = barcode || q;
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Product name (q) or barcode is required for comparison',
      });
    }

    const comparisonList = db.getComparisonForProduct(searchTerm, buyerLat, buyerLng);

    res.json({
      success: true,
      searchTerm,
      totalShopsFound: comparisonList.length,
      comparisons: comparisonList,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Get single product
 */
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products
 * Add product to a shop's catalog
 */
router.post('/', (req, res) => {
  try {
    const { shopId, title, price, category, stock, unit, mrp, description, image, barcode } = req.body;
    if (!shopId || !title || !price) {
      return res.status(400).json({
        success: false,
        message: 'shopId, title, and price are required fields',
      });
    }

    const newProduct = db.createProduct({
      shopId,
      title,
      price: Number(price),
      mrp: mrp ? Number(mrp) : Number(price),
      category: category || 'General',
      stock: stock ? Number(stock) : 10,
      unit: unit || '1 unit',
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60',
      barcode: barcode || `BC-${Date.now()}`,
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/products/:id/stock
 * Inline stock increment / decrement
 * Body: { delta: 1 } or { delta: -1 }
 */
router.patch('/:id/stock', (req, res) => {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({ success: false, message: 'delta (number) is required' });
    }

    const updated = db.updateProductStock(req.params.id, delta);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Stock updated',
      product: updated,
      isLowStock: updated.stock <= 5,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
