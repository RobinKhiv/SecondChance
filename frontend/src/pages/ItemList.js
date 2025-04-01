import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import UserAvatar from '../components/UserAvatar';

const conditions = ['All', 'Excellent', 'Good', 'Fair'];
const categories = ['All', 'Clothing', 'Electronics', 'Furniture'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
];

function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/items');
      const data = await response.json();
      setItems(data);
      if (data.length > 0) {
        const maxPrice = Math.max(...data.map(item => item.price));
        setPriceRange([0, maxPrice]);
      }
    } catch (error) {
      setError('Failed to fetch items');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCondition('All');
    setSelectedCategory('All');
    setSortBy('newest');
    setPriceRange([0, Math.max(...items.map(item => item.price))]);
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCondition = selectedCondition === 'All' || item.condition === selectedCondition;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      return matchesSearch && matchesCondition && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Available Items
      </Typography>

      {/* Search and Filters */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Collapse in={showFilters}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  label="Condition"
                >
                  {conditions.map(condition => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>Price Range</Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={Math.max(...items.map(item => item.price))}
                  valueLabelFormat={(value) => `$${value}`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2">${priceRange[0]}</Typography>
                  <Typography variant="body2">${priceRange[1]}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" onClick={resetFilters}>
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Items Grid */}
      <Grid container spacing={3}>
        {filteredAndSortedItems.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
                transition: 'transform 0.2s ease-in-out'
              }
            }}>
              <CardActionArea component={Link} to={`/items/${item.id}`} sx={{ flexGrow: 1 }}>
                <Box sx={{ pt: '60%', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={item.images?.[0] || 'https://picsum.photos/400/300?blur=2'}
                    alt={item.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" component="h2" noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', my: 1 }}>
                    ${item.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 2
                  }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 2
                  }}>
                    <UserAvatar 
                      src={item.seller_avatar}
                      alt={item.seller_email}
                      size={32}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
                      {item.seller_email}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ItemList;