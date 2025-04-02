import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../config/api';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Avatar,
  Grid,
  Divider
} from '@mui/material';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items/${id}`);
      const itemData = response.data;
      if (typeof itemData.images === 'string') {
        itemData.images = JSON.parse(itemData.images);
      }
      console.log('Fetched item:', itemData);
      setItem(itemData);
    } catch (error) {
      console.error('Error fetching item:', error);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchaseLoading(true);
      const response = await axios.post(
        `${API_URL}/api/items/${id}/purchase`,
        {},
        {
          headers: getAuthHeaders(token)
        }
      );
      setOpenDialog(false);
      navigate('/profile'); // Redirect to profile after purchase
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error.response?.data?.error || 'Failed to purchase item');
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Item not found</Alert>
      </Container>
    );
  }

  const canPurchase = currentUser && currentUser.id !== item.seller_id && !item.buyer_id;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardMedia
          component="img"
          height="400"
          image={item.images?.[0] || 'https://via.placeholder.com/400x300'}
          alt={item.title}
          sx={{ objectFit: 'contain' }}
        />
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {item.title}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            ${item.price.toFixed(2)}
          </Typography>
          <Typography variant="body1" paragraph>
            {item.description}
          </Typography>
          
          {canPurchase && (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setOpenDialog(true)}
              sx={{ mb: 2 }}
            >
              Purchase Item
            </Button>
          )}

          {item.buyer_id && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This item has been sold
            </Alert>
          )}

          {currentUser?.id === item.seller_id && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is your listing
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Seller Information */}
          <Box sx={{ mt: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Avatar 
                  src={item.seller.avatar} 
                  alt={item.seller.email}
                  sx={{ width: 56, height: 56 }}
                />
              </Grid>
              <Grid item>
                <Typography variant="subtitle1">
                  Seller Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.seller.email}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to purchase {item.title} for ${item.price.toFixed(2)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={purchaseLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            color="primary" 
            variant="contained"
            disabled={purchaseLoading}
          >
            {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ItemDetail; 