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
  Rating,
  Chip,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import UserAvatar from '../components/UserAvatar';
import { API_URL, getAuthHeaders } from '../config/api';

const ITEMS_PER_PAGE = 6;

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=1",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=2",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=3",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=5",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=6"
];

function Profile() {
  const { currentUser, token, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar);
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState({
    activeListings: [],
    soldItems: [],
    purchases: [],
    loading: true,
    error: null
  });
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [updating, setUpdating] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!token) return;
    
    try {
      const [activeRes, purchasesRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/items`, {
          headers: getAuthHeaders(token)
        }),
        axios.get(`${API_URL}/api/users/purchases`, {
          headers: getAuthHeaders(token)
        })
      ]);

      const allItems = activeRes.data.map(item => ({
        ...item,
        images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
      }));

      const activeListings = allItems.filter(item => !item.buyer_id);
      const soldItems = allItems.filter(item => item.buyer_id);
      
      const purchases = purchasesRes.data.map(item => ({
        ...item,
        images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
      }));

      setData({
        activeListings,
        soldItems,
        purchases,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load profile data'
      }));
    }
  }, [token]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    // Reset visible items when changing tabs
    setVisibleItems(ITEMS_PER_PAGE);
  }, [activeTab]);

  const getCurrentItems = () => {
    const items = activeTab === 0 ? data.activeListings :
                 activeTab === 1 ? data.soldItems :
                 data.purchases;
    return items || [];
  };

  const loadMore = () => {
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
  };

  const ItemGrid = ({ items, type }) => {
    const displayedItems = items.slice(0, visibleItems);
    
    return (
      <>
        <Grid container spacing={3}>
          {displayedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.images?.[0] || 'https://via.placeholder.com/400x300'}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${item.price?.toFixed(2)}
                  </Typography>
                  {type === 'sold' && (
                    <Chip 
                      label="Sold" 
                      color="success" 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                  {type === 'purchased' && (
                    <Chip 
                      label="Purchased" 
                      color="primary" 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {items.length > visibleItems && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button variant="outlined" onClick={loadMore}>
              Load More
            </Button>
          </Box>
        )}
      </>
    );
  };

  const handleUpdateAvatar = async () => {
    try {
      setUpdating(true);
      await axios.put(
        `${API_URL}/api/users/profile`,
        { avatar: selectedAvatar },
        { headers: getAuthHeaders(token) }
      );
      await updateProfile({ avatar: selectedAvatar });
      setOpenAvatarDialog(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (!currentUser) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Please log in to view your profile</Alert>
      </Container>
    );
  }

  if (data.loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* User Profile Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={currentUser?.avatar}
                alt={currentUser?.email}
                sx={{ width: 100, height: 100 }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  backgroundColor: 'background.paper'
                }}
                onClick={() => setOpenAvatarDialog(true)}
              >
                <EditIcon />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">
              {currentUser?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {new Date().toLocaleDateString()} {/* We'll update this when we have the actual join date */}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Avatar Selection Dialog */}
      <Dialog open={openAvatarDialog} onClose={() => setOpenAvatarDialog(false)}>
        <DialogTitle>Choose Your Avatar</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {AVATAR_OPTIONS.map((avatar, index) => (
              <Grid item xs={4} key={index}>
                <Avatar
                  src={avatar}
                  alt={`Avatar option ${index + 1}`}
                  sx={{
                    width: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: selectedAvatar === avatar ? '2px solid primary.main' : 'none'
                  }}
                  onClick={() => setSelectedAvatar(avatar)}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAvatarDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateAvatar} 
            variant="contained" 
            disabled={updating || selectedAvatar === currentUser?.avatar}
          >
            {updating ? 'Updating...' : 'Update Avatar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 3 }} />

      {/* Tabs and Items Section */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label={`Active Listings (${data.activeListings.length})`} />
        <Tab label={`Sold Items (${data.soldItems.length})`} />
        <Tab label={`Purchases (${data.purchases.length})`} />
      </Tabs>

      {data.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : getCurrentItems().length === 0 ? (
        <Alert severity="info">
          No items to display
        </Alert>
      ) : (
        <ItemGrid 
          items={getCurrentItems()} 
          type={activeTab === 1 ? 'sold' : activeTab === 2 ? 'purchased' : 'active'} 
        />
      )}
    </Container>
  );
}

// Create a reusable ItemGrid component
function ItemGrid({ items, type }) {
  return (
    <Grid container spacing={3}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <Card sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)'
            }
          }}>
            <CardMedia
              component="img"
              height="200"
              image={item.images?.[0] || 'https://via.placeholder.com/400x300'}
              alt={item.title}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ${item.price?.toFixed(2)}
              </Typography>
              {type === 'sold' && (
                <Chip 
                  label="Sold" 
                  color="success" 
                  size="small" 
                  sx={{ mt: 1 }} 
                />
              )}
              {type === 'purchased' && (
                <Chip 
                  label="Purchased" 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }} 
                />
              )}
            </CardContent>
            <CardActions>
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
      {items.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="info">
            No items to display
          </Alert>
        </Grid>
      )}
    </Grid>
  );
}

const fetchUserItems = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/items`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

const fetchUserPurchases = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/purchases`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

export default Profile; 