import { useState, useEffect } from 'react';
import { Switch, Route, Redirect, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MachineView from '@/pages/MachineView';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2b6cb0',   // azul corporativo
      dark: '#2c5282',
      light: '#4299e1',
    },
    secondary: {
      main: '#2d3748',   // gris oscuro corporativo
      dark: '#1a202c',
      light: '#4a5568',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function ProtectedRoute({ component: Component, isAuthenticated, ...rest }: any) {
  const [location] = useLocation();
  
  if (!isAuthenticated && location !== '/') {
    return <Redirect to="/" />;
  }
  
  return <Component {...rest} />;
}

function Router({ isAuthenticated, onLogin, onLogout }: any) {
  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to="/dashboard" />
        ) : (
          <Login onLogin={onLogin} />
        )}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute
          component={Dashboard}
          isAuthenticated={isAuthenticated}
          onLogout={onLogout}
        />
      </Route>
      
      <Route path="/machine/:id">
        {(params) => (
          <ProtectedRoute
            component={MachineView}
            isAuthenticated={isAuthenticated}
            machineId={params.id}
          />
        )}
      </Route>

      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated || false);
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', // gradiente azul
          }}
        >
          <CircularProgress sx={{ color: 'white' }} size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TooltipProvider>
          <Toaster />
          <Router
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;