const express = require('express');
const router = express.Router();
const { db } = require('../data/db');

/**
 * GET /api/orders
 * List orders (optional ?shopId=shop-1)
 */
router.get('/', (req, res) => {
  try {
    const { shopId } = req.query;
    const orders = db.getAllOrders(shopId);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Get single order details
 */
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders
 * Buyer checkout endpoint:
 * 1. Creates order
 * 2. Auto-decrements inventory
 * 3. Emits Socket.io 'new_order' event to seller in real-time
 */
router.post('/', (req, res) => {
  try {
    const { buyerName, buyerPhone, shopId, items, totalAmount, paymentMode, deliveryType } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'shopId and a non-empty items array are required',
      });
    }

    const newOrder = db.createOrder({
      buyerName: buyerName || 'Hyperlocal Buyer',
      buyerPhone: buyerPhone || '+91 98451 00000',
      shopId,
      items,
      totalAmount: totalAmount || items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0),
      paymentMode: paymentMode || 'UPI Instant (Paid)',
      deliveryType: deliveryType || 'PICKUP',
    });

    // Real-time notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', newOrder);
      io.to(shopId).emit('shop_new_order', newOrder);
    }

    // Generate WhatsApp direct alert link for convenience
    const shop = db.getShopById(shopId);
    const shopName = shop ? shop.name : 'Your Local Store';
    const waText = encodeURIComponent(
      `🛍️ *New Bazaar Order: ${newOrder.id}*\n` +
      `From: ${newOrder.buyerName} (${newOrder.buyerPhone})\n` +
      `Items: ${newOrder.items.map(i => `${i.title} x${i.qty}`).join(', ')}\n` +
      `Total: ₹${newOrder.totalAmount} (${newOrder.paymentMode})\n` +
      `Status: PENDING`
    );
    const whatsappLink = `https://wa.me/?text=${waText}`;

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder,
      whatsappLink,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Seller updates order lifecycle status (PENDING -> ACCEPTED -> READY -> COMPLETED)
 * Emits Socket.io 'order_status_updated' event to buyer
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED'];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowed.join(', ')}`,
      });
    }

    const updated = db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Broadcast status change to buyers
    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_updated', updated);
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
