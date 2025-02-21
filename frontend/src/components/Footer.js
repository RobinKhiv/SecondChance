import { Box, Container, Grid as Grid2, Typography, Link, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid2 container spacing={4}>
          <Grid2 item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              MarketPlace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Buy and sell items in your local community.
              Find the best deals on used items.
            </Typography>
          </Grid2>
          
          <Grid2 item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Box>
              <Link href="/" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Home
              </Link>
              <Link href="/items" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Browse Items
              </Link>
              <Link href="/sell" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Sell an Item
              </Link>
              <Link href="/profile" color="text.secondary" sx={{ display: 'block' }}>
                My Profile
              </Link>
            </Box>
          </Grid2>
          
          <Grid2 item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Connect With Us
            </Typography>
            <Box>
              <IconButton aria-label="Facebook" color="primary">
                <FacebookIcon />
              </IconButton>
              <IconButton aria-label="Twitter" color="primary">
                <TwitterIcon />
              </IconButton>
              <IconButton aria-label="Instagram" color="primary">
                <InstagramIcon />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Follow us on social media for the latest updates and deals.
            </Typography>
          </Grid2>
        </Grid2>
        
        <Box sx={{ mt: 5, borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} MarketPlace. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer; 