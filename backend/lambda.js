const express = require('express');
const serverless = require('serverless-http');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables');
}

// Middleware to initialize Supabase
const initSupabase = (req, res, next) => {
  req.supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  next();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply middleware
app.use(initSupabase);

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await req.supabase
      .from('users')
      .insert([{ 
        email, 
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email
      }])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET);
    res.json({ token, user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Item routes
app.get('/api/items', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('items')
      .select(`
        *,
        seller:users!items_seller_id_fkey (id, email, avatar)
      `);

    if (error) throw error;

    const itemsWithParsedImages = data.map(item => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    }));

    res.json(itemsWithParsedImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/my-listings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('items')
      .select(`