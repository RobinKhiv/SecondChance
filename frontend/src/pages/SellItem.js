import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, getAuthHeaders } from '../config/api';
import axios from 'axios';
import {
  Container,
  TextField,
  Button,
  Grid,
  Typography,
  Card,
  CardMedia,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper
} from '@mui/material';

// Constants for categories and conditions
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const SAMPLE_IMAGES = [
  "https://picsum.photos/400/300?random=1",
  "https://picsum.photos/400/300?random=2",
  "https://picsum.photos/400/300?random=3",
  "https://picsum.photos/400/300?random=4"
];

function SellItem() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [selectedImage, setSelectedImage] = useState(SAMPLE_IMAGES[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    if (!condition) {
      setError('Please select the item condition');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/items`, {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        images: [selectedImage]
      }, {
        headers: getAuthHeaders(token)
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error creating item:', error);
      setError(error.response?.data?.error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sell an Item
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                InputProps={{
                  startAdornment: '$'
                }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  label="Condition"
                >
                  {CONDITIONS.map(cond => (
                    <MenuItem key={cond} value={cond}>
                      {cond}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select an Image
              </Typography>
              <Grid container spacing={2}>
                {SAMPLE_IMAGES.map((image, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Card 
                      onClick={() => setSelectedImage(image)}
                      sx={{
                        cursor: 'pointer',
                        border: selectedImage === image ? '2px solid #1976d2' : 'none'
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="140"
                        image={image}
                        alt={`Sample ${index + 1}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  fullWidth
                  size="large"
                >
                  {loading ? 'Creating...' : 'Create Listing'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default SellItem; 