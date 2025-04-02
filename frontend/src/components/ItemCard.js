import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  Box,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ItemCard = ({ item }) => {
  const navigate = useNavigate();

  if (!item) {
    return null;
  }

  // Parse the images string if it's a string
  const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
  
  // Get the first image or use a fallback
  const imageUrl = (images && images.length > 0) ? images[0] : 'https://via.placeholder.com/300';

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      margin: 1,
      boxShadow: 2 
    }}>
      <CardActionArea onClick={() => navigate(`/items/${item.id}`)}>
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={item.title}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300';
            e.target.onerror = null;
          }}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Typography variant="h6" color="primary">
              ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
            </Typography>
            {item.sold && (
              <Chip label="Sold" color="error" size="small" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ItemCard; 