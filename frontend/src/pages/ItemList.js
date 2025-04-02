import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Button,
  Slider,
  Collapse,
  Paper,
  CardActionArea,
  CircularProgress,
  Alert,
  CardMedia,
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import UserAvatar from '../components/UserAvatar';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];

function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availability, setAvailability] = useState('available');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      const parsedItems = response.data.map(item => ({
        ...item,
        images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
      }));
      console.log('Parsed items:', parsedItems);
      setItems(parsedItems);
      
      // Update price range based on actual items
      if (parsedItems.length > 0) {
        const prices = parsedItems.map(item => item.price);
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange([0, maxPrice]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetFilters = () => {
    setSearchTerm('');
    setAvailability('all');
    setSortBy('newest');
    setSelectedCondition('');
    setSelectedCategory('');
    setPriceRange([0, 1000]);
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesAvailability = availability === 'all' ? true :
                                 availability === 'available' ? !item.buyer_id :
                                 item.buyer_id;
      const matchesCondition = !selectedCondition || item.condition === selectedCondition;
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];

      return matchesSearch && matchesAvailability && matchesCondition && 
             matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Marketplace Items
          </Typography>
          
          {/* Search and Basic Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "contained" : "outlined"}
            >
              Filters
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <ToggleButtonGroup
              value={availability}
              exclusive
              onChange={(e, newValue) => setAvailability(newValue || 'all')}
              aria-label="item availability"
            >
              <ToggleButton value="all">
                All ({items.length})
              </ToggleButton>
              <ToggleButton value="available">
                Available ({items.filter(item => !item.buyer_id).length})
              </ToggleButton>
              <ToggleButton value="sold">
                Sold ({items.filter(item => item.buyer_id).length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                      <MenuItem value="priceAsc">Price: Low to High</MenuItem>
                      <MenuItem value="priceDesc">Price: High to Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      label="Condition"
                    >
                      <MenuItem value="">Any</MenuItem>
                      {CONDITIONS.map(condition => (
                        <MenuItem key={condition} value={condition}>
                          {condition}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">Any</MenuItem>
                      {CATEGORIES.map(category => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ px: 2 }}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={Math.max(...items.map(item => item.price), 1000)}
                  valueLabelFormat={value => `$${value}`}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={resetFilters}>
                  Reset Filters
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Paper>

      {filteredAndSortedItems.length === 0 ? (
        <Alert severity="info">No items found matching your criteria</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardActionArea component={Link} to={`/items/${item.id}`}>
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
                    {item.condition && (
                      <Chip 
                        label={item.condition} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1,mt:1}}>
                      {item.seller && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <UserAvatar 
                            user={item.seller}
                            src={item.seller.avatar}
                            sx={{ width: 24, height: 24, mr: 1 }} 
                          />
                          <Typography variant="body2" color="text.secondary">
                            {item.seller.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {item.buyer_id && (
                      <Chip 
                        label="Sold" 
                        color="error" 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default ItemList;