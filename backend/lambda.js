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

// At the top of your file, add this check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
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

// Add this middleware to log requests
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    token: req.headers.authorization,
    userId: req.user?.userId
  });
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      token: req.headers.authorization?.split(' ')[1]?.substring(0, 10) + '...', // Show first 10 chars of token
      decodedAttempt: error.name === 'JsonWebTokenError' ? 'Invalid token' : 
        jwt.decode(req.headers.authorization?.split(' ')[1]),
      errorName: error.name,
      errorStack: error.stack
    });
    
    res.status(500).json({ 
      error: error.message,
      details: {
        errorType: error.name,
        tokenPresent: !!req.headers.authorization
      }
    });
  }
};

// Apply middlewares
app.use(initSupabase);

// Initialize Supabase with service role for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', req.body);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with user.id
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log the token payload for debugging
    console.log('Token payload:', { id: user.id });

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
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove top-level Supabase initialization
// Instead, create a function to get Supabase client when needed
const getSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

// Routes that need Supabase will initialize it only when called
app.post('/api/auth/register', async (req, res) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Add default avatar
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password: hashedPassword,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email
      }])
      .select()
      .single();

    if (error) throw error;

    // Change userId to id in the token payload
    const token = jwt.sign({ id: data.id }, process.env.JWT_SECRET);
    res.json({ token, user: data });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/my-listings', authenticateToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    console.log('Fetching listings for user:', decoded.id);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        price,
        status,
        created_at,
        images,
        category,
        condition,
        buyer:users!items_buyer_id_fkey (
          id,
          email,
          avatar
        )
      `)
      .eq('seller_id', decoded.id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Route: /api/items/my-listings - Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        seller:users!items_seller_id_fkey (id, email, avatar)
      `);

    if (error) throw error;

    // Parse the images JSON string for each item
    const itemsWithParsedImages = data.map(item => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    }));

    res.json(itemsWithParsedImages);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's purchases
app.get('/api/items/my-purchases', authenticateToken, async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
  
      // Check if items table exists and has data
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          title,
          description,
          price,
          status,
          created_at,
          images,
          seller:users!items_seller_id_fkey(id, email, avatar)
        `)
        .eq('buyer_id', decoded.id);
  
      // If there's no data, return empty array instead of error
      if (error?.message?.includes('does not exist') || !data) {
        return res.json([]);
      }
  
      if (error) {
        throw error;
      }
  
      res.json(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      // Return empty array for any errors related to no data
      res.json([]);
    }
  });

app.get('/api/items/:id', async (req, res) => {
  try {
    const { data: item, error } = await req.supabase
      .from('items')
      .select(`
        *,
        seller:users!items_seller_id_fkey(id, email, avatar)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    
    // Parse the images JSON
    if (typeof item.images === 'string') {
      item.images = JSON.parse(item.images || '[]');
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

app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    console.log('Creating item for user:', decoded.id);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Log the item data before insert
    const itemData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      images: JSON.stringify(req.body.images || []),
      category: req.body.category || 'Other',
      condition: req.body.condition || 'Used',
      status: 'active',
      seller_id: decoded.id,
      created_at: new Date().toISOString()
    };
    console.log('Attempting to insert item:', itemData);

    const { data: newItem, error: insertError } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Item created successfully:', newItem);
    res.json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'No additional details'
    });
  }
});



app.post('/api/items/:id/purchase', authenticateToken, async (req, res) => {
  try {
    // Get the item first
    const { data: item, error: fetchError } = await req.supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if already sold
    if (item.buyer_id) {
      return res.status(400).json({ error: 'Item is already sold' });
    }

    // Check if trying to buy own item
    if (item.seller_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot purchase your own item' });
    }

    // Update the item
    const { data: updatedItem, error: updateError } = await req.supabase
      .from('items')
      .update({
        buyer_id: req.user.id,
        purchase_date: new Date().toISOString(),
        status: 'sold'
      })
      .eq('id', req.params.id)
      .select(`
        *,
        seller:users!items_seller_id_fkey(email, avatar),
        buyer:users!items_buyer_id_fkey(email, avatar)
      `)
      .single();

    if (updateError) throw updateError;
    res.json(updatedItem);
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase item: ' + error.message });
  }
});

// Test route to verify the server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add this endpoint for updating user profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    console.log('Update request:', {
      userId: decoded.id,
      newAvatar: req.body.avatar
    });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Do a simple update
    const { data, error } = await supabase
      .from('users')
      .update({ avatar: req.body.avatar })
      .eq('id', decoded.id);

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    // Get the updated user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, avatar')
      .eq('id', decoded.id)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    console.log('Updated user:', user);
    res.json({ success: true, user });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the handler
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  return handler(event, context);
}; 