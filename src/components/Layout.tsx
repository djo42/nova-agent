import { AppBar, Toolbar, Container, Box, Button } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const menuItems = [
    { path: '/', label: 'Auth Tester' },
    { path: '/countries', label: 'Countries' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', gap: 2 }}>
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path} passHref style={{ textDecoration: 'none' }}>
                <Button
                  color="inherit"
                  variant={router.pathname === item.path ? "outlined" : "text"}
                  sx={{
                    borderRadius: 2,
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </Container>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}; 