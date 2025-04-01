import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

function ItemList() {
  // Initialize state
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Effect running');
    
    const fetchItems = async () => {
      try {
        console.log('Fetching items...');
        const response = await fetch('http://localhost:5001/api/items');
        const data = await response.json();
        console.log('Raw data received:', data);
        
        // Ensure we have an array
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error('Data is not an array:', data);
          setItems([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={2}>
        <CircularProgress />
      </Box>
    );
  }

  // Show empty state
  if (!items || items.length === 0) {
    return (
      <Box display="flex" justifyContent="center" m={2}>
        <Typography>No items found</Typography>
      </Box>
    );
  }

  // Render items
  return (
    <Grid container spacing={2}>
      {items.map((item) => {
        // Skip any null or undefined items
        if (!item) return null;
        
        return (
          <Grid item xs={12} sm={6} md={4} key={item.id || 'unknown'}>
            <Card component={Link} to={`/items/${item.id}`} sx={{ textDecoration: 'none' }}>
              <CardContent>
                <Typography variant="h6">
                  {item.title || 'Untitled'}
                </Typography>
                <Typography color="text.secondary">
                  ${(item.price || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" noWrap>
                  {item.description || 'No description'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <UserAvatar 
                    src={item.seller_avatar}
                    alt={item.seller_email || 'Seller'}
                    size={32}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {item.seller_email || 'Unknown seller'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default ItemList; 