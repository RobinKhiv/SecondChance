import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Rating
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import UserAvatar from '../components/UserAvatar';

const API_URL = 'http://localhost:5001/api';

function Profile() {
  const { currentUser, token, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [userProfile, setUserProfile] = useState({
    activeListings: [],
    soldItems: [],
    stats: {
      totalRatings: 0,
      averageRating: 0,
      totalSales: 0
    }
  });

  const avatarOptions = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=2',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=3',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=4',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=5',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=6',
  ];

  const handleAvatarSelect = async (newAvatar) => {
    try {
      await updateProfile({ avatar: newAvatar });
      setAvatarDialogOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!token || !currentUser) {
        navigate('/login');
        return;
      }

      const itemsResponse = await axios.get(`${API_URL}/users/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const items = itemsResponse.data || [];
      console.log('Items fetched:', items); // Debug log

      setUserProfile({
        activeListings: items,
        soldItems: [],
        stats: {
          totalRatings: 0,
          averageRating: 0,
          totalSales: 0
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [token, currentUser, navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  console.log('Rendering Profile with:', {
    loading,
    error,
    activeListingsCount: userProfile.activeListings.length,
    activeListings: userProfile.activeListings
  });

  if (loading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
        {/* User Info Card */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            {/* Avatar Section */}
            <Box sx={{ position: 'relative' }}>
              <UserAvatar
                src={currentUser?.avatar}
                alt={currentUser?.email}
                sx={{ 
                  width: 100, 
                  height: 100,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => setAvatarDialogOpen(true)}
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'grey.200' }
                }}
                onClick={() => setAvatarDialogOpen(true)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* User Info Section */}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" gutterBottom>
                {currentUser?.email}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Rating value={userProfile.stats.averageRating} readOnly />
                <Typography variant="body2" color="text.secondary">
                  ({userProfile.stats.totalRatings} ratings)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Sales: {userProfile.stats.totalSales}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs and Content */}
        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
              <Tab label={`Active Listings (${userProfile.activeListings.length})`} />
              <Tab label={`Sold Items (${userProfile.soldItems.length})`} />
            </Tabs>
          </Box>

          {/* Active Listings Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {userProfile.activeListings.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={Array.isArray(item.images) && item.images.length > 0 
                        ? item.images[0] 
                        : 'https://placehold.co/400x300'}
                      alt={item.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        ${item.price.toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 1
                        }}
                      >
                        {item.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        component={Link} 
                        to={`/items/${item.id}`}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Sold Items Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {userProfile.soldItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: 0.8
                  }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={Array.isArray(item.images) && item.images.length > 0 
                        ? item.images[0] 
                        : 'https://placehold.co/400x300'}
                      alt={item.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                        Sold for ${item.price.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Avatar Selection Dialog */}
        <Dialog 
          open={avatarDialogOpen} 
          onClose={() => setAvatarDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Choose an Avatar</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {avatarOptions.map((avatar, index) => (
                <Grid item xs={4} sm={3} key={index}>
                  <Avatar
                    src={avatar}
                    sx={{
                      width: 80,
                      height: 80,
                      cursor: 'pointer',
                      margin: 'auto',
                      border: currentUser?.avatar === avatar ? 2 : 0,
                      borderColor: 'primary.main',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s'
                      }
                    }}
                    onClick={() => handleAvatarSelect(avatar)}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default Profile; 