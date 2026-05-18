import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Datastore from 'nedb-promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'importadora_secret_key_2024';

// ─── NeDB Databases (stored as local files) ───────────────────────────────────
const db = {
  users: Datastore.create({ filename: path.join(__dirname, 'data/users.db'), autoload: true }),
  products: Datastore.create({ filename: path.join(__dirname, 'data/products.db'), autoload: true }),
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.users.findOne({ _id: decoded.userId });
    if (!user) return res.status(401).json({ message: 'Token inválido' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Acceso denegado: solo admins' });
};

// ─── Seed Initial Users ───────────────────────────────────────────────────────
const seedUsers = async () => {
  const adminExists = await db.users.findOne({ email: 'admin@importadora.com' });
  if (!adminExists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await db.users.insert({ name: 'Administrador', email: 'admin@importadora.com', password: hashed, role: 'admin', createdAt: new Date() });
    console.log('✅ Admin creado: admin@importadora.com / admin123');
  }
  const userExists = await db.users.findOne({ email: 'user@importadora.com' });
  if (!userExists) {
    const hashed = await bcrypt.hash('user123', 10);
    await db.users.insert({ name: 'Usuario Prueba', email: 'user@importadora.com', password: hashed, role: 'user', createdAt: new Date() });
    console.log('✅ Usuario creado: user@importadora.com / user123');
  }
};

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.users.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Credenciales inválidas' });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await db.users.findOne({ email });
    if (exists) return res.status(400).json({ message: 'El correo ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.users.insert({ name, email, password: hashed, role: 'user', createdAt: new Date() });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Admin: Create user
app.post('/api/auth/create-user', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await db.users.findOne({ email });
    if (exists) return res.status(400).json({ message: 'El correo ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await db.users.insert({ name, email, password: hashed, role: role || 'user', createdAt: new Date() });
    res.status(201).json({ message: 'Usuario creado', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Admin: Get all users
app.get('/api/auth/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await db.users.find({});
    res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Admin: Delete user
app.delete('/api/auth/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await db.users.remove({ _id: req.params.id });
    res.json({ message: 'Usuario eliminado' });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ─── PRODUCTS ROUTES ──────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.products.find({});
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/products', auth, isAdmin, async (req, res) => {
  try {
    const product = await db.products.insert({ ...req.body, createdAt: new Date() });
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/products/:id', auth, isAdmin, async (req, res) => {
  try {
    await db.products.update({ _id: req.params.id }, { $set: req.body });
    res.json({ message: 'Producto actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/products/:id', auth, isAdmin, async (req, res) => {
  try {
    await db.products.remove({ _id: req.params.id });
    res.json({ message: 'Producto eliminado' });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/products/:id/buy', auth, async (req, res) => {
  try {
    const product = await db.products.findOne({ _id: req.params.id });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    const qty = parseInt(req.body.quantity) || 1;
    if (product.stock < qty) return res.status(400).json({ message: 'Stock insuficiente' });
    await db.products.update({ _id: req.params.id }, { $set: { stock: product.stock - qty } });
    res.json({ message: 'Compra exitosa' });
  } catch (e) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ─── Static Frontend ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await seedUsers();
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
