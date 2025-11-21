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

// IMPORTA TUS IMÁGENES
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
    console.log(`Pregunta a la IA: ${question}`);
  };

  const machines = [
    {
      id: '1',
      name: 'Máquina 1',
      description: 'Centro de Mecanizado CNC',
      imageUrl: dashboardImage,
    },
    {
      id: '2',
      name: 'Máquina 2',
      description: 'En desarrollo',
      imageUrl: dashboardImage,
    },
    {
      id: '3',
      name: 'Máquina 3',
      description: 'En desarrollo',
      imageUrl: dashboardImage,
    },
  ];

  const handleMachineClick = (machineId: string) => {
    if (machineId === '1') {
      setLocation(`/machine/1`);
    } else {
      alert("⚙️ Esta máquina todavía está en desarrollo");
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      
      {/* Barra superior */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: 'white',
        }}
      >
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
        {/* 🔥 Eliminamos padding enorme y subimos todo */}
        <Box sx={{ paddingTop: 2, paddingBottom: 4, textAlign: 'center' }}>

          {/* Tarjetas de máquinas */}
          <Grid container spacing={4} justifyContent="center">
            {machines.map((machine) => (
              <Grid item xs={12} sm={6} md={4} key={machine.id}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(43, 108, 176, 0.2)',
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleMachineClick(machine.id)}>
                    <CardMedia
                      component="img"
                      image={machine.imageUrl}
                      alt={machine.name}
                      sx={{
                        height: 150,
                        width: '100%',
                        objectFit: 'contain',
                        padding: 1,
                        backgroundColor: '#f7fafc',
                      }}
                    />
                    <CardContent sx={{ padding: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748', marginBottom: 1 }}>
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

          {/* Desplegable IA */}
          <Box sx={{ marginTop: 4 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600 }}>
                  Preguntar a la IA sobre las máquinas
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Typography variant="body2" sx={{ color: '#4a5568', marginBottom: 2 }}>
                  Escribe preguntas como:<br />
                  • ¿Cuánto tiempo estuvo parada la máquina 1?<br />
                  • ¿Qué máquina produjo más hoy?
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Escribe tu pregunta..."
                  />
                  <Button variant="contained" onClick={handleAskAI}>
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

