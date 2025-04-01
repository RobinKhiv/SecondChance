import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Container,
  Paper,
  Divider
} from '@mui/material';
import UserAvatar from '../components/UserAvatar';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/items/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff4f4' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Item not found</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ 
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper'
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* Title and Price Section */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'medium',
                color: 'text.primary'
              }}
            >
              {item.title}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 'bold'
              }}
            >
              ${item.price.toFixed(2)}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Description Section */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ color: 'text.secondary' }}
            >
              Description
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.primary',
                lineHeight: 1.7
              }}
            >
              {item.description}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Seller Information */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              bgcolor: 'grey.50',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ color: 'text.secondary', mb: 2 }}
            >
              Seller Information
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center'
            }}>
              <UserAvatar 
                src={item.seller_avatar}
                alt={item.seller_email}
                size={48}
                sx={{ 
                  border: 2,
                  borderColor: 'background.paper'
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography 
                  variant="subtitle1"
                  sx={{ 
                    fontWeight: 'medium',
                    color: 'text.primary'
                  }}
                >
                  {item.seller_email}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ color: 'text.secondary' }}
                >
                  Verified Seller
                </Typography>
              </Box>
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ItemDetail; 