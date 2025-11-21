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
  const [expanded, setExpanded] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const machines = [
    {
      id: '1',
      name: 'Máquina 1',
      description: 'Control Dimensional BARCINO',
      imageUrl: dashboardImage,
    },
    {
      id: '2',
      name: 'Máquina 2',
      description: 'Control Calidad ADDESCO',
      imageUrl: dashboardImage,
    },
    {
      id: '3',
      name: 'Máquina 3',
      description: 'Desbarbado Palets',
      imageUrl: dashboardImage,
    },
  ];

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    setTouchStartX(null);
  };

  const handleAccordionChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
      }}
    >
      {/* Barra superior */}
      {/* Barra superior */}
<Paper elevation={2} sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 1000, background: 'white' }}>
  <Container maxWidth="lg">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
      {/* Izquierda: Icono + texto EcoTrace */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Factory sx={{ fontSize: 32, color: '#2b6cb0' }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
          EcoTrace
        </Typography>
      </Box>

      {/* Derecha: Botón cerrar sesión */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#2d3748' }}>
          Cerrar sesión
        </Typography>
        <IconButton
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="button-logout"
          sx={{ color: '#2b6cb0', '&:hover': { backgroundColor: 'rgba(43, 108, 176, 0.1)' } }}
        >
          <Logout />
        </IconButton>
      </Box>
    </Box>
  </Container>
</Paper>

      {/* Área de imagen y controles */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          paddingX: 2,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Botones prev / next */}
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
            maxHeight: '80vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CardActionArea
            onClick={() => handleMachineClick(machines[currentIndex])}
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              flexDirection: 'column',
              paddingBottom: '80px', // reserva espacio para el texto
            }}
          >
            <CardMedia
              component="img"
              image={machines[currentIndex].imageUrl}
              alt={machines[currentIndex].name}
              sx={{
                objectFit: 'contain',
                width: '100%',
                height: 'auto',
                maxHeight: { xs: '50vh', md: '60vh' }, // limita altura para que no pise el texto
                display: 'block',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                paddingY: 1.5,
                paddingX: 2,
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

      {/* Sección IA */}
      <Box sx={{ paddingX: 2, paddingBottom: 2 }}>
        <Accordion expanded={expanded} onChange={handleAccordionChange}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600 }}>
              Preguntar a la IA sobre las máquinas
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#4a5568' }}>
                Escribe preguntas generales, por ejemplo:  
                • ¿Cuánto tiempo estuvo parada la máquina 1 hoy?  
                • ¿Cuál fue la máquina con más producción esta semana?
              </Typography>
              <TextField
                fullWidth
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Escribe tu pregunta..."
                multiline
                minRows={3}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary" onClick={handleAskAI}>
                  Preguntar
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}