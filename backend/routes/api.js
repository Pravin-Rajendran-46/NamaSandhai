// backend/routes/api.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Product routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);
router.get('/products/nearby', productController.getNearbyProducts);

module.exports = router;