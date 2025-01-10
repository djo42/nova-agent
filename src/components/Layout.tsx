import { AppBar, Toolbar, Container, Box, Button, ButtonGroup } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { path: '/booking', label: 'Book a Car' },
    { path: '/', label: 'Auth Tester' },
    { path: '/countries', label: 'Countries' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Container maxWidth="lg">
            {mounted && (
              <ButtonGroup 
                variant="contained" 
                sx={{ 
                  backgroundColor: 'transparent',
                  '& .MuiButton-root': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    sx={{
                      color: 'white',
                      backgroundColor: router.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </ButtonGroup>
            )}
          </Container>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}; 