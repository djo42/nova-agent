import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Container, 
  Box, 
  IconButton, 
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/router';

const SIXT_ORANGE = '#ff5f00';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuItems = [
    { path: '/booking', label: 'Book a Car' },
    { path: '/', label: 'Auth Tester' },
    { path: '/countries', label: 'Countries' },
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: SIXT_ORANGE }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: 0 }}>
            {/* Sixt Logo */}
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                fontWeight: 'bold',
                letterSpacing: 1,
              }}
            >
              SIXT
            </Typography>

            {/* Burger Menu */}
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              {menuItems.map((item) => (
                <MenuItem 
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  selected={router.pathname === item.path}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: `${SIXT_ORANGE}20`,
                    },
                    '&:hover': {
                      backgroundColor: `${SIXT_ORANGE}10`,
                    },
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}; 