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
  Chip,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { API_URL, getAuthHeaders } from '../config/api';
import ItemCard from '../components/ItemCard';
import { avatarOptions } from '../utils/avatarOptions';

const ITEMS_PER_PAGE = 6;

const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=1",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=2",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=3",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=5",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=6"
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const { currentUser, token } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
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
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchUserItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items/my-listings`, {
        headers: getAuthHeaders(token)
      });
      console.log('Fetched items:', response.data);
      setUserItems(response.data);
    } catch (error) {
      console.error('Error fetching user items:', error);
      throw error;
    }
  };

  const fetchUserPurchases = async () => {
    try {
      // Log the request details
      console.log('Fetching purchases with token:', localStorage.getItem('token'));
      
      const response = await axios.get(`${API_URL}/api/items/my-purchases`, {
        headers: getAuthHeaders(token)
      });
      console.log('Purchases response:', response.data);
      setUserPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!token || !currentUser) {
        setError('Please log in to view your profile');
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          fetchUserItems(),
          fetchUserPurchases()
        ]);
        setError('');
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [token, currentUser]);

  // Add this debug log
  console.log('Current state:', { userItems, userPurchases, loading, error });

  useEffect(() => {
    // Reset visible items when changing tabs
    setVisibleItems(ITEMS_PER_PAGE);
  }, [activeTab]);

  const getCurrentItems = () => {
    const items = activeTab === 0 ? userItems :
                 activeTab === 1 ? userPurchases :
                 [];
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

  const handleUpdateAvatar = async (newAvatar) => {
    try {
      console.log('Updating avatar to:', newAvatar);
      
      const response = await axios.put(`${API_URL}/api/users/profile`, {
        avatar: newAvatar
      }, {
        headers: getAuthHeaders(token)
      });

      if (response.data.success && response.data.user) {
        // Update local storage with new user data
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...currentUser, avatar: response.data.user.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Force refresh to show new avatar
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar');
    }
  };

  if (!currentUser) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Please log in to view your profile</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Paper sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={currentUser?.avatar}
          sx={{ width: 64, height: 64, cursor: 'pointer' }}
          onClick={() => setOpenAvatarDialog(true)}
        />
        <Box>
          <Typography variant="h6">{currentUser?.email}</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenAvatarDialog(true)}
          >
            Change Avatar
          </Button>
        </Box>
      </Paper>

      {/* Tabs Section */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={`Active Listings (${userItems.length})`} />
          <Tab label={`Purchases (${userPurchases.length})`} />
        </Tabs>

        {/* Active Listings Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : userItems.length > 0 ? (
            <Grid container spacing={2}>
              {userItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <ItemCard item={item} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No active listings found
            </Typography>
          )}
        </TabPanel>

        {/* Purchases Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : userPurchases.length > 0 ? (
            <Grid container spacing={2}>
              {userPurchases.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <ItemCard item={item} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No purchases found
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {/* Avatar Dialog */}
      <Dialog open={openAvatarDialog} onClose={() => setOpenAvatarDialog(false)}>
        <DialogTitle>Choose Avatar</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {avatarOptions.map((avatar, index) => (
              <Grid item key={index}>
                <Avatar
                  src={avatar}
                  sx={{
                    width: 64,
                    height: 64,
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
            onClick={() => handleUpdateAvatar(selectedAvatar)}
            disabled={!selectedAvatar || updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 