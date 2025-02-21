import { useState } from 'react';
import {
  Container,
  Grid as Grid2,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  InputAdornment
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate } from 'react-router-dom';

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'likeNew', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

function SellItem() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    condition: '',
    location: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to create listing
    console.log('Form submitted:', formData);
    // Navigate to items list after successful submission
    navigate('/items');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Sell an Item
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid2 container spacing={4}>
          {/* Left Column - Image Upload */}
          <Grid2 item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main'
                    }
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    <Box sx={{ py: 5 }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography color="text.secondary">
                        Click to upload image
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          {/* Right Column - Form Fields */}
          <Grid2 item xs={12} md={8}>
            <Card>
              <CardContent>
                <Grid2 container spacing={3}>
                  <Grid2 item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </Grid2>

                  <Grid2 item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        )
                      }}
                    />
                  </Grid2>

                  <Grid2 item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      required
                    >
                      {conditions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid2>

                  <Grid2 item xs={12}>
                    <TextField
                      fullWidth
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </Grid2>

                  <Grid2 item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </Grid2>

                  <Grid2 item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                    >
                      List Item
                    </Button>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </form>
    </Container>
  );
}

export default SellItem; 