import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
} from '@mui/material';
import { Factory, Logout, ExpandMore } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import dashboardImage from '../attached_assets/generated_images/Imagen_Dashboard.jpg';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [question, setQuestion] = useState('');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      await response.json();
      onLogout();
    } catch (err) {
      console.error('Error logging out:', err);
      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAskAI = () => {
    // En el futuro: enviar la pregunta al backend/IA
    console.log(`Pregunta a la IA: ${question}`);
  };

  const machines = [
    {
      id: '1',
      name: 'Máquina 1',
      description: 'Centro de Mecanizado CNC',
      imageUrl: dashboardImage,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Barra superior */}
      <Paper elevation={2} sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 1000, background: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Factory sx={{ fontSize: 32, color: '#2b6cb0' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                EcoTrace
              </Typography>
            </Box>
            <Tooltip title="Cerrar sesión">
              <IconButton
                onClick={handleLogout}
                disabled={isLoggingOut}
                data-testid="button-logout"
                sx={{ color: '#2b6cb0', '&:hover': { backgroundColor: 'rgba(43, 108, 176, 0.1)' } }}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Paper>

      {/* Contenido principal */}
      <Container maxWidth="lg">
        <Box sx={{ paddingY: 8, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            data-testid="text-dashboard-title"
            sx={{
              fontWeight: 700,
              marginBottom: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            EcoTrace
          </Typography>
          <Typography variant="h5" sx={{ color: '#718096', fontWeight: 400, marginBottom: 6 }}>
            Sistema de Trazabilidad Industrial
          </Typography>

          {/* Tarjetas de máquinas */}
          <Grid container spacing={4} justifyContent="center">
            {machines.map((machine) => (
              <Grid item xs={12} sm={6} md={4} key={machine.id}>
                <Card
                  elevation={4}
                  data-testid={`card-machine-${machine.id}`}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(43, 108, 176, 0.2)',
                    },
                  }}
                >
                  <CardActionArea onClick={() => setLocation(`/machine/${machine.id}`)} data-testid={`button-machine-${machine.id}`}>
                    <CardMedia
                      component="img"
                      height="120" // más pequeña
                      image={machine.imageUrl}
                      alt={machine.name}
                      sx={{
    height: 150,          // altura ajustable
    width: '100%',        // ocupa todo el ancho disponible
    objectFit: 'contain', // mantiene proporciones
    padding: 1,           // margen interno
    backgroundColor: '#f7fafc',
  }}
                    />
                    <CardContent sx={{ padding: 3 }}>
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: '#2d3748', marginBottom: 1 }}>
                        {machine.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#718096' }}>
                        {machine.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ marginTop: 8 }}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Haz clic en una máquina para ver su trazabilidad en tiempo real
            </Typography>
          </Box>

          {/* Desplegable IA */}
          <Box sx={{ marginTop: 6 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600 }}>
                  Preguntar a la IA sobre las máquinas
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#4a5568', marginBottom: 2 }}>
                  Escribe preguntas generales, por ejemplo:  
                  • ¿Cuánto tiempo estuvo parada la máquina 1 hoy?  
                  • ¿Cuál fue la máquina con más produccion esta semana?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                  />
                  <Button variant="contained" color="primary" onClick={handleAskAI}>
                    Preguntar
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
