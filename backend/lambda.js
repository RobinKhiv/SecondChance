const express = require('express');
const serverless = require('serverless-http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Promise wrappers
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve(this);
      }
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

const getAllAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

// Add this after your database initialization function
const seedDatabase = async () => {
  try {
    // Check if we already have users
    const users = await getAllAsync('SELECT * FROM users');
    if (users.length === 0) {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await runAsync(`
        INSERT INTO users (email, password, avatar, created_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        ['test@example.com', hashedPassword, 'https://api.dicebear.com/7.x/adventurer/svg?seed=test@example.com']
      );

      // Get the created user's ID
      const user = await getAsync('SELECT id FROM users WHERE email = ?', ['test@example.com']);

      // Create some test items
      const testItems = [
        {
          title: 'Vintage Camera',
          description: 'A beautiful vintage camera in excellent condition',
          price: 199.99,
          images: JSON.stringify(['https://picsum.photos/400/300?random=1']),
          seller_id: user.id,
          condition: 'Like New',
          category: 'Electronics'
        },
        {
          title: 'Mountain Bike',
          description: 'Barely used mountain bike, perfect for trails',
          price: 299.99,
          images: JSON.stringify(['https://picsum.photos/400/300?random=2']),
          seller_id: user.id,
          condition: 'Good',
          category: 'Sports'
        },
        {
          title: 'Guitar',
          description: 'Acoustic guitar with great sound',
          price: 150.00,
          images: JSON.stringify(['https://picsum.photos/400/300?random=3']),
          seller_id: user.id,
          condition: 'Fair',
          category: 'Other'
        }
      ];

      for (const item of testItems) {
        await runAsync(`
          INSERT INTO items (
            title, description, price, images, seller_id, 
            condition, category, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [item.title, item.description, item.price, item.images, 
           item.seller_id, item.condition, item.category]
        );
      }

      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Update your initialization code to include seeding
const initializeDatabase = async () => {
  try {
    // Create tables first
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        images TEXT,
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER,
        purchase_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        condition TEXT,
        category TEXT,
        FOREIGN KEY (seller_id) REFERENCES users(id),
        FOREIGN KEY (buyer_id) REFERENCES users(id)
      )
    `);

    // Then seed the database
    await seedDatabase();

    console.log('Database initialized and seeded successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Enable foreign key support
db.run('PRAGMA foreign_keys = ON');

// Create a middleware to ensure database is initialized
const ensureDatabaseInitialized = async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
};

// Apply the middleware to all routes
app.use(ensureDatabaseInitialized);

// Wrap the handler to ensure database is initialized
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  await initializeDatabase();
  return handler(event, context);
};

// Add the authenticateToken middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Please authenticate' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Please authenticate' });
  }
};

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
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`;
    
    const result = await runAsync(
      'INSERT INTO users (email, password, avatar, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [email, hashedPassword, avatarUrl]
    );

    const user = await getAsync(
      'SELECT id, email, avatar, created_at FROM users WHERE id = ?',
      [result.lastID]
    );
    
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account: ' + error.message });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, images, category, condition } = req.body;
    
    // Validate required fields
    if (!title || !description || !price || !images || !images.length || !category || !condition) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert the new item
    const result = await runAsync(
      `INSERT INTO items (
        title, description, price, images, seller_id, 
        category, condition, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [title, description, price, JSON.stringify(images), req.user.id, category, condition]
    );

    // Get the created item
    const item = await getAsync(
      `SELECT items.*, users.email as seller_email 
       FROM items 
       JOIN users ON items.seller_id = users.id 
       WHERE items.id = ?`,
      [result.lastID]
    );

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    console.log('Fetching all items');
    const items = await getAllAsync(`
      SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar
      FROM items 
      JOIN users ON items.seller_id = users.id
    `);
    
    console.log('Found items:', items);
    
    // Parse the images JSON for each item
    const parsedItems = items.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));
    
    res.json(parsedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await getAsync(
      `SELECT 
        items.*,
        users.email as seller_email,
        users.avatar as seller_avatar,
        users.id as seller_id
      FROM items 
      JOIN users ON items.seller_id = users.id 
      WHERE items.id = ?`,
      [req.params.id]
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Parse the images JSON
    if (typeof item.images === 'string') {
      item.images = JSON.parse(item.images || '[]');
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Profile endpoint
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    
    const user = await getAsync(
      'SELECT id, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure created_at exists, if not, update it
    if (!user.created_at) {
      await runAsync(
        'UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE id = ? AND created_at IS NULL',
        [req.user.id]
      );
      user.created_at = new Date().toISOString();
    }
    
    console.log('Profile fetched successfully:', user);
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update profile endpoint
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    
    await runAsync(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, req.user.id]
    );

    const updatedUser = await getAsync(
      'SELECT id, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// User items endpoint
app.get('/api/users/items', authenticateToken, async (req, res) => {
  try {
    const items = await getAllAsync(
      'SELECT * FROM items WHERE seller_id = ?',
      [req.user.id]
    );
    
    // Parse the images JSON for each item
    const parsedItems = items.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));
    
    res.json(parsedItems);
  } catch (error) {
    console.error('Items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User purchases endpoint
app.get('/api/users/purchases', authenticateToken, async (req, res) => {
  try {
    const purchases = await getAllAsync(`
      SELECT items.*, 
             seller.email as seller_email,
             seller.avatar as seller_avatar
      FROM items 
      JOIN users seller ON items.seller_id = seller.id
      WHERE items.buyer_id = ?
    `, [req.user.id]);
    
    // Parse the images JSON for each item
    const parsedPurchases = purchases.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));
    
    res.json(parsedPurchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Server error' });
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

// Purchase item endpoint
app.post('/api/items/:id/purchase', authenticateToken, async (req, res) => {
  try {
    // Get the item with seller information
    const item = await getAsync(`
      SELECT items.*, users.email as seller_email 
      FROM items 
      JOIN users ON items.seller_id = users.id 
      WHERE items.id = ?
    `, [req.params.id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item is already sold
    if (item.buyer_id) {
      return res.status(400).json({ error: 'Item is already sold' });
    }

    // Check if user is trying to buy their own item
    if (item.seller_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot purchase your own item' });
    }

    // Update the item with buyer information
    const updateResult = await runAsync(
      'UPDATE items SET buyer_id = ?, purchase_date = datetime("now") WHERE id = ?',
      [req.user.id, req.params.id]
    );

    // Get updated item
    const updatedItem = await getAsync(`
      SELECT items.*, 
             seller.email as seller_email,
             seller.avatar as seller_avatar,
             buyer.email as buyer_email
      FROM items 
      JOIN users seller ON items.seller_id = seller.id
      LEFT JOIN users buyer ON items.buyer_id = buyer.id
      WHERE items.id = ?
    `, [req.params.id]);

    if (!updatedItem) {
      throw new Error('Failed to retrieve updated item');
    }

    // Parse images if they're stored as a string
    if (typeof updatedItem.images === 'string') {
      updatedItem.images = JSON.parse(updatedItem.images || '[]');
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase item: ' + error.message });
  }
});

// Test route to check database
app.get('/api/debug/items', async (req, res) => {
  try {
    const tables = await getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table'
    `);
    
    const items = await getAllAsync('SELECT * FROM items');
    const users = await getAllAsync('SELECT id, email FROM users');
    
    res.json({
      tables,
      itemCount: items.length,
      items,
      userCount: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the handler
module.exports.handler = serverless(app); 