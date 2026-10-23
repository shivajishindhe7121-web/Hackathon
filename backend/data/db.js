/**
 * Bazaar In-Memory Data Store & PostGIS-like Geo Engine
 * Provides pre-seeded hyperlocal shops, products, real-time inventory, and orders.
 */

// Haversine formula to compute distance in meters between two GPS coordinates
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// User / Buyer reference location (Koramangala 4th Block, Bengaluru)
const DEFAULT_BUYER_LOCATION = {
  lat: 12.9344,
  lng: 77.6291,
};

// Initial Seed Shops
const shops = [
  {
    id: "shop-1",
    name: "Sharma Kirana & General Store",
    owner: "Ramesh Sharma",
    category: "Groceries & Daily Essentials",
    rating: 4.8,
    reviewsCount: 142,
    location: { lat: 12.9362, lng: 77.6305 }, // ~320m away
    address: "Cross Road 4, Sector 7",
    phone: "+91 98450 12345",
    isOpen: true,
    pickupTimeMins: 10,
    badge: "Trusted Local Kirana",
    createdAt: new Date().toISOString(),
  },
  {
    id: "shop-2",
    name: "Green Leaf Organics & Fresh Mart",
    owner: "Priya Venkatesh",
    category: "Vegetables, Dairy & Organic",
    rating: 4.7,
    reviewsCount: 98,
    location: { lat: 12.9385, lng: 77.632 }, // ~650m away
    address: "Opp. Community Park, Main Road",
    phone: "+91 98450 54321",
    isOpen: true,
    pickupTimeMins: 15,
    badge: "Farm Fresh",
    createdAt: new Date().toISOString(),
  },
  {
    id: "shop-3",
    name: "Bangalore Iyengar Bakery",
    owner: "Narayana Swamy",
    category: "Bakery, Snacks & Dairy",
    rating: 4.9,
    reviewsCount: 310,
    location: { lat: 12.9312, lng: 77.624 }, // ~850m away
    address: "Near Water Tank, 2nd Stage",
    phone: "+91 98450 99887",
    isOpen: true,
    pickupTimeMins: 12,
    badge: "Bestseller Bakery",
    createdAt: new Date().toISOString(),
  },
  {
    id: "shop-4",
    name: "Apollo Care & Meds",
    owner: "Dr. K. S. Rao",
    category: "Pharmacy & Wellness",
    rating: 4.9,
    reviewsCount: 220,
    location: { lat: 12.942, lng: 77.635 }, // ~1100m away
    address: "12th Cross, Market Junction",
    phone: "+91 98450 11223",
    isOpen: false,
    pickupTimeMins: 20,
    badge: "24x7 Emergency",
    createdAt: new Date().toISOString(),
  },
];

// Initial Seed Products
const products = [
  {
    id: "prod-1",
    shopId: "shop-1",
    title: "Aashirvaad Superior Sharbati Atta 5kg",
    category: "Atta & Flours",
    price: 275,
    mrp: 315,
    stock: 14,
    unit: "5 kg",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
    description:
      "100% pure MP Sharbati wheat, whole grain rotis stay soft for hours.",
    barcode: "890103038312",
  },
  {
    id: "prod-2",
    shopId: "shop-2",
    title: "Aashirvaad Superior Sharbati Atta 5kg",
    category: "Atta & Flours",
    price: 290,
    mrp: 315,
    stock: 4, // Low stock demo!
    unit: "5 kg",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
    description: "Fresh stock from supplier, premium quality grain.",
    barcode: "890103038312",
  },
  {
    id: "prod-3",
    shopId: "shop-1",
    title: "Amul Pasteurized Butter 500g",
    category: "Dairy & Milk",
    price: 265,
    mrp: 275,
    stock: 3, // Low stock demo!
    unit: "500 g",
    image:
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60",
    description: "Classic Amul salted butter, wholesome nutrition from milk fat.",
    barcode: "890126201005",
  },
  {
    id: "prod-4",
    shopId: "shop-3",
    title: "Amul Pasteurized Butter 500g",
    category: "Dairy & Milk",
    price: 258,
    mrp: 275,
    stock: 22,
    unit: "500 g",
    image:
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60",
    description: "Chilled dairy stock, fresh from bakery refrigerator.",
    barcode: "890126201005",
  },
  {
    id: "prod-5",
    shopId: "shop-1",
    title: "Tata Tea Gold Leaf 500g",
    category: "Beverages & Tea",
    price: 310,
    mrp: 350,
    stock: 18,
    unit: "500 g",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60",
    description:
      "Fine CTC teas with 15% gently rolled long tea leaves for rich aroma.",
    barcode: "890105200389",
  },
  {
    id: "prod-6",
    shopId: "shop-2",
    title: "Tata Tea Gold Leaf 500g",
    category: "Beverages & Tea",
    price: 325,
    mrp: 350,
    stock: 9,
    unit: "500 g",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60",
    description: "Aromatic black tea for breakfast and evening tea time.",
    barcode: "890105200389",
  },
  {
    id: "prod-7",
    shopId: "shop-3",
    title: "Fresh Baked Rusk & Toast (Iyengar Special)",
    category: "Bakery, Snacks & Dairy",
    price: 65,
    mrp: 75,
    stock: 35,
    unit: "300 g",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60",
    description: "Cardamom flavored crispy toasts baked fresh every morning.",
    barcode: "890882190112",
  },
  {
    id: "prod-8",
    shopId: "shop-1",
    title: "Fortune Sunlite Refined Sunflower Oil 1L",
    category: "Oils & Ghee",
    price: 135,
    mrp: 155,
    stock: 12,
    unit: "1 Litre",
    image:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=60",
    description: "Light and healthy cooking oil enriched with vitamins A & D.",
    barcode: "890600728101",
  },
];

// Initial Seed Orders
let orders = [
  {
    id: "ORD-9481",
    buyerName: "Rahul Sharma",
    buyerPhone: "+91 99001 22334",
    shopId: "shop-1",
    items: [{ productId: "prod-5", title: "Tata Tea Gold Leaf 500g", qty: 1, price: 310 }],
    totalAmount: 310,
    paymentMode: "UPI Instant (Paid)",
    paymentStatus: "COMPLETED",
    status: "ACCEPTED",
    deliveryType: "PICKUP",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

// Database Operations
const db = {
  // Shops
  getAllShops(buyerLat = DEFAULT_BUYER_LOCATION.lat, buyerLng = DEFAULT_BUYER_LOCATION.lng) {
    return shops.map((s) => {
      const distanceMeters = calculateDistanceMeters(
        buyerLat,
        buyerLng,
        s.location.lat,
        s.location.lng
      );
      return {
        ...s,
        distanceMeters,
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  },

  getShopById(shopId, buyerLat = DEFAULT_BUYER_LOCATION.lat, buyerLng = DEFAULT_BUYER_LOCATION.lng) {
    const shop = shops.find((s) => s.id === shopId);
    if (!shop) return null;
    const distanceMeters = calculateDistanceMeters(
      buyerLat,
      buyerLng,
      shop.location.lat,
      shop.location.lng
    );
    return { ...shop, distanceMeters };
  },

  createShop(shopData) {
    const newShop = {
      id: `shop-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      isOpen: true,
      pickupTimeMins: 15,
      badge: "Newly Registered",
      createdAt: new Date().toISOString(),
      ...shopData,
      location: shopData.location || { lat: 12.935, lng: 77.628 },
    };
    shops.push(newShop);
    return newShop;
  },

  // Products
  getAllProducts(query = "", category = "", shopId = "") {
    return products.filter((p) => {
      if (shopId && p.shopId !== shopId) return false;
      if (category && category !== "All" && p.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  },

  getProductById(productId) {
    return products.find((p) => p.id === productId) || null;
  },

  createProduct(productData) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      stock: Number(productData.stock) || 10,
      price: Number(productData.price) || 100,
      mrp: Number(productData.mrp) || Number(productData.price) || 100,
      ...productData,
    };
    products.unshift(newProduct);
    return newProduct;
  },

  updateProductStock(productId, delta) {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    return product;
  },

  // "Compare Nearby Shops" Engine
  getComparisonForProduct(productTitleOrBarcode, buyerLat = DEFAULT_BUYER_LOCATION.lat, buyerLng = DEFAULT_BUYER_LOCATION.lng) {
    const q = (productTitleOrBarcode || "").toLowerCase().trim();
    const matchedProducts = products.filter((p) => {
      return (
        p.barcode === productTitleOrBarcode ||
        p.title.toLowerCase().includes(q) ||
        q.includes(p.title.toLowerCase())
      );
    });

    return matchedProducts.map((p) => {
      const shop = db.getShopById(p.shopId, buyerLat, buyerLng);
      return {
        product: p,
        shop,
      };
    }).sort((a, b) => a.product.price - b.product.price);
  },

  // Orders
  getAllOrders(shopId = "") {
    if (shopId) {
      return orders.filter((o) => o.shopId === shopId);
    }
    return orders;
  },

  getOrderById(orderId) {
    return orders.find((o) => o.id === orderId) || null;
  },

  createOrder(orderData) {
    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: newOrderId,
      status: "PENDING",
      paymentStatus: "COMPLETED",
      createdAt: new Date().toISOString(),
      ...orderData,
    };

    // Auto-decrement inventory
    if (newOrder.items && Array.isArray(newOrder.items)) {
      newOrder.items.forEach((item) => {
        const prodId = item.productId || item.id;
        if (prodId) {
          db.updateProductStock(prodId, -Number(item.qty || 1));
        }
      });
    }

    orders.unshift(newOrder);
    return newOrder;
  },

  updateOrderStatus(orderId, status) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    return order;
  },

  // Seller Dashboard Analytics
  getShopAnalytics(shopId) {
    const shopOrders = orders.filter((o) => o.shopId === shopId);
    const totalRevenue = shopOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lowStockItems = products.filter((p) => p.shopId === shopId && p.stock <= 5);

    return {
      shopId,
      todayRevenue: totalRevenue + 4580,
      totalOrders: shopOrders.length + 18,
      averageOrderValue: 265,
      repeatCustomerRate: "74%",
      lowStockCount: lowStockItems.length,
      lowStockProducts: lowStockItems,
    };
  },

  // AI Growth Coach Contextual Recommendations
  getGrowthCoachTips(shopId) {
    const lowStock = products.filter((p) => p.shopId === shopId && p.stock <= 5);
    const tips = [
      {
        id: "tip-1",
        type: "DEMAND_SURGE",
        badge: "⚡ Weekend Surge",
        title: "Kirana Weekend Spike Predicted",
        message:
          "Atta & Refined Cooking Oil demand surges 35% on Saturday morning. Keep at least 25 packets stocked to avoid missed sales.",
      },
      {
        id: "tip-2",
        type: "SMART_BUNDLE",
        badge: "💡 Combo Opportunity",
        title: "Tea & Snacks Basket Growth",
        message:
          "Shoppers buying Tata Tea Gold often buy Parle-G or Iyengar Rusk. Creating a combo offer will increase your basket size by 22%.",
      },
    ];

    if (lowStock.length > 0) {
      tips.unshift({
        id: "tip-0",
        type: "RESTOCK_ALERT",
        badge: "⚠️ Immediate Restock",
        title: `Low Stock: ${lowStock[0].title}`,
        message: `Only ${lowStock[0].stock} units left in stock! Restock before the evening 6-8 PM neighborhood rush.`,
      });
    }

    return tips;
  },
};

module.exports = {
  db,
  calculateDistanceMeters,
  DEFAULT_BUYER_LOCATION,
};
