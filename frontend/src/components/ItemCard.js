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
  console.log('Rendering ItemCard with item:', item); // Debug log

  if (!item) {
    console.log('No item provided to ItemCard');
    return null;
  }

  // Handle the images array directly since it's already an array
  const firstImage = item.images && item.images.length > 0 
    ? item.images[0] 
    : '/placeholder.png';

  console.log('Using image:', firstImage); // Debug log

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
          image={firstImage}
          alt={item.title}
          sx={{ objectFit: 'cover' }}
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