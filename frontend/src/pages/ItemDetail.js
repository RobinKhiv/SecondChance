import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid as Grid2,
  Card,
  CardMedia,
  Typography,
  Box,
  Button,
  Divider,
  Paper,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    setItem({
      id,
      title: 'Used Laptop',
      price: 499.99,
      image: 'https://placeholder.com/800',
      description: 'Slightly used laptop in good condition. Comes with charger and original packaging. 8GB RAM, 256GB SSD, Intel i5 processor.',
      condition: 'Good',
      location: 'New York, NY',
      seller: {
        name: 'John Doe',
        rating: 4.5,
        joinDate: '2023-01-15'
      }
    });
  }, [id]);

  if (!item) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid2 container spacing={4}>
        {/* Left side - Image */}
        <Grid2 item xs={12} md={7}>
          <Card>
            <CardMedia
              component="img"
              height="500"
              image={item.image}
              alt={item.title}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid2>

        {/* Right side - Details */}
        <Grid2 item xs={12} md={5}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {item.title}
            </Typography>
            
            <Typography variant="h3" color="primary" gutterBottom>
              ${item.price}
            </Typography>

            <Button 
              variant="contained" 
              size="large" 
              fullWidth 
              sx={{ mt: 2, mb: 4 }}
            >
              Contact Seller
            </Button>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>
              {item.description}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Chip 
                label={`Condition: ${item.condition}`} 
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip 
                icon={<LocationOnIcon />} 
                label={item.location}
                sx={{ mb: 1 }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Seller Information */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Seller Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography>{item.seller.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ mr: 1 }} />
                <Typography>Member since {new Date(item.seller.joinDate).toLocaleDateString()}</Typography>
              </Box>
            </Paper>
          </Box>
        </Grid2>
      </Grid2>
    </Container>
  );
}

export default ItemDetail; 