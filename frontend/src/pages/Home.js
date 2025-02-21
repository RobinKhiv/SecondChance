import { Container, Typography, Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(to right bottom, #FFFFFF, #F0F2F5)'
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" py={8}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Welcome to MarketPlace
          </Typography>
          
          <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Discover amazing deals on used items from trusted sellers in your community
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/items')}
              sx={{ px: 4, py: 1.5 }}
            >
              Browse Items
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Join Now
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Home; 