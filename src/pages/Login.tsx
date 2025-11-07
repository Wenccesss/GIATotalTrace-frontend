import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
      });
      
      const data = await response.json();

      if (data.success) {
        onLogin();
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos. Intenta nuevamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: 4,
              textAlign: 'center',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <LockOutlined sx={{ fontSize: 40, color: 'white' }} />
            </Paper>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: 'white',
                fontWeight: 600,
                marginTop: 2,
                letterSpacing: '0.5px',
              }}
            >
              GIATotalTrace
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: 1,
              }}
            >
              Sistema de Trazabilidad Industrial
            </Typography>
          </Box>

          <CardContent sx={{ padding: 4 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {error && (
                  <Alert
                    severity="error"
                    data-testid="alert-login-error"
                    sx={{ borderRadius: 1 }}
                  >
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Usuario"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  data-testid="input-username"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  data-testid="button-login"
                  sx={{
                    height: 48,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <Box sx={{ textAlign: 'center', marginTop: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Credenciales de prueba: admin / 1234
                  </Typography>
                </Box>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
