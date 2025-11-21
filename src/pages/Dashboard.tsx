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
import { Factory, Logout, ExpandMore, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
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
  const [currentMachine, setCurrentMachine] = useState(0);

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

  const nextMachine = () => {
    setCurrentMachine((prev) => (prev + 1) % machines.length);
  };

  const prevMachine = () => {
    setCurrentMachine((prev) => (prev - 1 + machines.length) % machines.length);
  };

  const handleMachineClick = (index: number) => {
    if (index === 0) {
      setLocation(`/machine/${machines[index].id}`);
    } else {
      alert('Esta máquina está en desarrollo');
    }
  };

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

      {/* Contenedor principal */}
      <Container maxWidth="lg" sx={{ height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingY: 0 }}>
        {/* Carrusel de máquinas */}
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: 0 }}>
          {/* Botón izquierdo (oculto en móvil) */}
          <IconButton
            onClick={prevMachine}
            sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: { xs: 'none', sm: 'flex' } }}
          >
            <ArrowBackIos />
          </IconButton>

          <Card
            elevation={4}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f7fafc',
              padding: 1,
            }}
          >
            <CardActionArea onClick={() => handleMachineClick(currentMachine)}>
              <CardMedia
                component="img"
                image={machines[currentMachine].imageUrl}
                alt={machines[currentMachine].name}
                sx={{ height: '80vh', width: 'auto', objectFit: 'contain' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  {machines[currentMachine].name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  {machines[currentMachine].description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Botón derecho (oculto en móvil) */}
          <IconButton
            onClick={nextMachine}
            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: { xs: 'none', sm: 'flex' } }}
          >
            <ArrowForwardIos />
          </IconButton>
        </Box>

        {/* Sección IA */}
        <Box sx={{ marginTop: 2 }}>
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
                • ¿Cuál fue la máquina con más producción esta semana?
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
      </Container>
    </Box>
  );
}
