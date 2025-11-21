import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Paper,
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
  const [currentIndex, setCurrentIndex] = useState(0);

  // Variables para swipe táctil
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? machines.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === machines.length - 1 ? 0 : prev + 1));
  };

  const handleMachineClick = (machine: typeof machines[0]) => {
    if (machine.id === '1') {
      setLocation(`/machine/${machine.id}`);
    } else {
      alert(`${machine.name} está en desarrollo`);
    }
  };

  // Eventos touch para móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) handleNext(); // swipe izquierda
    else if (diff < -50) handlePrev(); // swipe derecha
    setTouchStartX(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
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

      {/* Carrusel y sección IA */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {/* Carrusel de imagen central */}
        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            paddingX: 2,
            marginBottom: 2, // espacio para que IA siempre visible
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Botones laterales solo en escritorio */}
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: 8,
              zIndex: 10,
              display: { xs: 'none', md: 'flex' },
              backgroundColor: 'rgba(255,255,255,0.7)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
            }}
          >
            <ArrowBackIos />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 8,
              zIndex: 10,
              display: { xs: 'none', md: 'flex' },
              backgroundColor: 'rgba(255,255,255,0.7)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
            }}
          >
            <ArrowForwardIos />
          </IconButton>

          <Card
            elevation={4}
            sx={{
              width: { xs: '90%', md: '60%' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              position: 'relative',
            }}
          >
            <CardActionArea
              onClick={() => handleMachineClick(machines[currentIndex])}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            >
              <CardMedia
                component="img"
                image={machines[currentIndex].imageUrl}
                alt={machines[currentIndex].name}
                sx={{ objectFit: 'cover', width: '100%', flex: 1 }}
              />
              {/* Texto dentro de la imagen, centrado */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {machines[currentIndex].name}
                </Typography>
                <Typography variant="body2">{machines[currentIndex].description}</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Box>

        {/* Sección IA (siempre visible) */}
        <Box>
          <Accordion defaultExpanded>
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
      </Box>
    </Box>
  );
}
