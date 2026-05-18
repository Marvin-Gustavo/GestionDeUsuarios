import express from 'express';
import Product from '../models/Product.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product (Admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Buy product (User)
router.post('/:id/buy', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const { quantity } = req.body;
    if (product.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

    product.stock -= quantity;
    await product.save();

    // In a real system, create an Order record here.

    res.json({ message: 'Purchase successful', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
