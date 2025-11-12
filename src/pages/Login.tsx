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

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Lógica de validación hardcodeada
    if (username === 'admin' && password === 'GIATT') {
      onLogin(); // acceso correcto
    } else {
      setError('Usuario o contraseña incorrectos. Intenta nuevamente.');
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', // gradiente azul corporativo
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
              background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', // gradiente azul corporativo
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
              EcoTrace
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
                    background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)', // azul corporativo
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2c5282 0%, #1a365d 100%)',
                    },
                  }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}