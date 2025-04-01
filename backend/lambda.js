const express = require('express');
const serverless = require('serverless-http');
const sqlite3 = require('sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Promise wrappers
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const getAllAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        avatar TEXT
      )
    `);

    await runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        title TEXT,
        description TEXT,
        price REAL,
        seller_id INTEGER,
        images TEXT,
        FOREIGN KEY (seller_id) REFERENCES users (id)
      )
    `);

    const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await runAsync(
        'INSERT INTO users (email, password, avatar) VALUES (?, ?, ?)',
        ['test@example.com', hashedPassword, 'https://api.dicebear.com/7.x/adventurer/svg?seed=1']
      );
    }

    const user = await getAsync('SELECT id FROM users WHERE email = ?', ['test@example.com']);
    const itemCount = await getAsync('SELECT COUNT(*) as count FROM items');
    
    if (itemCount.count === 0 && user) {
      await runAsync(
        'INSERT INTO items (title, description, price, seller_id, images) VALUES (?, ?, ?, ?, ?)',
        [
          'Test Item 1', 
          'This is a test item', 
          99.99, 
          user.id,
          JSON.stringify(['https://picsum.photos/400/300?random=1'])
        ]
      );
      await runAsync(
        'INSERT INTO items (title, description, price, seller_id, images) VALUES (?, ?, ?, ?, ?)',
        [
          'Test Item 2', 
          'Another test item', 
          149.99, 
          user.id,
          JSON.stringify(['https://picsum.photos/400/300?random=2'])
        ]
      );
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Initialize database
initializeDatabase().catch(console.error);

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Make sure we're sending back the correct user data structure
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate avatar URL
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await runAsync(
      'INSERT INTO users (email, password, avatar) VALUES (?, ?, ?)',
      [email, hashedPassword, avatarUrl]
    );

    // Get the created user
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [result.lastID]);
    
    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { title, description, price, images } = req.body;
    console.log('Creating item:', { title, description, price, images });

    // Insert new item
    const result = await runAsync(
      'INSERT INTO items (title, description, price, seller_id, images) VALUES (?, ?, ?, ?, ?)',
      [
        title,
        description,
        price,
        user.id,
        JSON.stringify(images || ['https://picsum.photos/400/300?random=' + Date.now()])
      ]
    );

    console.log('Item created with ID:', result.lastID);

    // Get the created item
    const item = await getAsync(`
      SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar
      FROM items 
      LEFT JOIN users ON items.seller_id = users.id
      WHERE items.id = ?
    `, [result.lastID]);

    // Parse images JSON string
    item.images = JSON.parse(item.images || '[]');

    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await getAllAsync(`
      SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar
      FROM items 
      LEFT JOIN users ON items.seller_id = users.id
    `);

    // Parse images JSON string
    const itemsWithParsedImages = items.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    res.json(itemsWithParsedImages);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getAsync(`
      SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar
      FROM items 
      LEFT JOIN users ON items.seller_id = users.id
      WHERE items.id = ?
    `, req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { avatar } = req.body;

    // Update user
    await runAsync(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, decoded.id]
    );

    // Get updated user
    const user = await getAsync('SELECT id, email, avatar FROM users WHERE id = ?', [decoded.id]);
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's items
app.get('/api/users/items', async (req, res) => {
  try {
    console.log('Received request for user items'); // Debug log
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    console.log('Verifying token...'); // Debug log
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('Fetching items from database...'); // Debug log
    const items = await getAllAsync(`
      SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar
      FROM items 
      LEFT JOIN users ON items.seller_id = users.id
      WHERE items.seller_id = ?
    `, [decoded.id]);

    console.log(`Found ${items.length} items`); // Debug log

    // Parse images JSON string for each item
    const itemsWithParsedImages = items.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    console.log('Sending response...'); // Debug log
    res.json(itemsWithParsedImages);
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Get current user (me) endpoint
app.get('/api/users/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getAsync(
      'SELECT id, email, avatar FROM users WHERE id = ?', 
      [decoded.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
});

// Export the serverless handler
module.exports.handler = serverless(app); 