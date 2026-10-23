const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../data/db');

// Multer in-memory storage for handling image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Demo fallback presets for resilient 3-minute hackathon pitch
const DEMO_PRESETS = {
  fortune_oil: {
    title: "Fortune Sunlite Refined Sunflower Oil 1L",
    category: "Oils & Ghee",
    price: 135,
    mrp: 155,
    stock: 20,
    unit: "1 Litre",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=60",
    description: "High oleic refined sunflower cooking oil with Vitamin A & D fortifiers.",
    confidence: "98.4% Gemini Vision Match",
  },
  tata_salt: {
    title: "Tata Salt Vacuum Evaporated Iodized 1kg",
    category: "Spices & Condiments",
    price: 28,
    mrp: 30,
    stock: 35,
    unit: "1 kg",
    image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&auto=format&fit=crop&q=60",
    description: "Desh ka Namak. Pure vacuum evaporated iodized salt for daily cooking.",
    confidence: "99.1% Gemini Vision Match",
  },
  bhujia: {
    title: "Haldiram's Bhujia Sev 400g Crispy Snack",
    category: "Bakery, Snacks & Dairy",
    price: 110,
    mrp: 125,
    stock: 18,
    unit: "400 g",
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=60",
    description: "Traditional spicy Rajasthani moth bean and gram flour crunchy noodles.",
    confidence: "97.8% Gemini Vision Match",
  },
};

/**
 * POST /api/ai/photo-to-listing
 * Upload or provide an image URL of a retail item.
 * Uses Google Gemini API (Vision) to extract product details, or graceful offline fallback.
 */
router.post('/photo-to-listing', upload.single('image'), async (req, res) => {
  try {
    const { preset, imageUrl } = req.body;

    // 1. Instant preset path for live presentations
    if (preset && DEMO_PRESETS[preset]) {
      return res.json({
        success: true,
        source: 'preset_demo',
        data: DEMO_PRESETS[preset],
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. If Gemini API key is configured and image is provided
    if (apiKey && (req.file || imageUrl)) {
      try {
        const imageBase64 = req.file
          ? req.file.buffer.toString('base64')
          : null;

        const mimeType = req.file ? req.file.mimetype : 'image/jpeg';

        // Prepare Gemini REST payload
        const prompt = `You are an AI assistant for Bazaar, an Indian hyperlocal marketplace for kirana and neighborhood stores. 
Analyze this product packaging photo. Extract the exact product details into valid JSON with this structure:
{
  "title": "Exact Brand and Product Name with quantity (e.g., Tata Salt 1kg)",
  "category": "One of [Atta & Flours, Dairy & Milk, Beverages & Tea, Bakery, Snacks & Dairy, Oils & Ghee, Spices & Condiments, Personal Care]",
  "price": estimated selling price in Indian Rupees as integer,
  "mrp": printed MRP in Indian Rupees as integer,
  "stock": recommended initial stock count (e.g. 15),
  "unit": "e.g. 1 kg, 500g, 1L",
  "description": "2-sentence attractive description in English",
  "confidence": "e.g. 98.7% Gemini Vision Match"
}
Return ONLY pure JSON.`;

        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt },
                ...(imageBase64
                  ? [{ inline_data: { mime_type: mimeType, data: imageBase64 } }]
                  : []),
              ],
            },
          ],
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const rawText =
            result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedJson = rawText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);

          return res.json({
            success: true,
            source: 'gemini_vision_live',
            data: {
              ...parsed,
              image:
                imageUrl ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60',
            },
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using graceful fallback:', geminiErr.message);
      }
    }

    // 3. Graceful fallback for offline / mock testing
    const fallback = DEMO_PRESETS.fortune_oil;
    res.json({
      success: true,
      source: 'offline_fallback',
      note: 'Configure GEMINI_API_KEY in .env for live model inference',
      data: fallback,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ai/growth-coach/:shopId
 * Returns AI-generated business tips, bundle suggestions, and restock alerts
 */
router.get('/growth-coach/:shopId', (req, res) => {
  try {
    const tips = db.getGrowthCoachTips(req.params.id);
    res.json({
      success: true,
      shopId: req.params.id,
      tips,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
