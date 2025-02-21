import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    setUserProfile({
      name: 'John Doe',
      email: 'john.doe@example.com',
      joinDate: '2023-01-15',
      avatar: 'https://placeholder.com/150',
      location: 'New York, NY',
      rating: 4.5,
      stats: {
        itemsSold: 12,
        activeListings: 3,
        totalRatings: 15
      },
      listings: [
        {
          id: 1,
          title: 'Used Laptop',
          price: 499.99,
          image: 'https://placeholder.com/100',
          status: 'active'
        },
        {
          id: 2,
          title: 'Vintage Camera',
          price: 299.99,
          image: 'https://placeholder.com/100',
          status: 'sold'
        }
      ]
    });
  }, []);

  if (!userProfile) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column - User Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={userProfile.avatar}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {userProfile.name}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Member since {new Date(userProfile.joinDate).toLocaleDateString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Rating value={userProfile.rating} precision={0.5} readOnly />
                <Typography sx={{ ml: 1 }}>({userProfile.stats.totalRatings})</Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <LocalOfferIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={userProfile.stats.activeListings}
                    secondary="Active Listings"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <StarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={userProfile.stats.itemsSold}
                    secondary="Items Sold"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Listings */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
              >
                <Tab label="Active Listings" />
                <Tab label="Sold Items" />
              </Tabs>
            </Box>
            <CardContent>
              <Grid container spacing={2}>
                {userProfile.listings
                  .filter(item => 
                    (tabValue === 0 && item.status === 'active') ||
                    (tabValue === 1 && item.status === 'sold')
                  )
                  .map(item => (
                    <Grid item xs={12} sm={6} key={item.id}>
                      <Card 
                        sx={{ 
                          display: 'flex',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/items/${item.id}`)}
                      >
                        <Box
                          component="img"
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover'
                          }}
                          src={item.image}
                          alt={item.title}
                        />
                        <CardContent>
                          <Typography variant="subtitle1">
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${item.price}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Profile; 