import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
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
  const [currentIndex, setCurrentIndex] = useState(0);

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
    { id: '1', name: 'Máquina 1', description: 'Centro de Mecanizado CNC', imageUrl: dashboardImage },
    { id: '2', name: 'Máquina 2', description: 'En desarrollo', imageUrl: dashboardImage },
    { id: '3', name: 'Máquina 3', description: 'En desarrollo', imageUrl: dashboardImage },
  ];

  const prevMachine = () => setCurrentIndex((prev) => (prev === 0 ? machines.length - 1 : prev - 1));
  const nextMachine = () => setCurrentIndex((prev) => (prev === machines.length - 1 ? 0 : prev + 1));

  const handleMachineClick = (machine: typeof machines[0]) => {
    if (machine.id === '1') {
      setLocation(`/machine/${machine.id}`);
    } else {
      alert('Esta máquina está en desarrollo');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)', display: 'flex', flexDirection: 'column' }}>
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

      {/* Contenedor principal del carrusel */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', paddingX: 2 }}>
        {/* Botón izquierdo */}
        <IconButton
          onClick={prevMachine}
          sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
        >
          <ArrowBackIos />
        </IconButton>

        {/* Imagen de máquina */}
        <Card sx={{ maxWidth: '800px', width: '100%' }}>
          <CardActionArea onClick={() => handleMachineClick(machines[currentIndex])}>
            <CardMedia
              component="img"
              image={machines[currentIndex].imageUrl}
              alt={machines[currentIndex].name}
              sx={{ height: '400px', objectFit: 'contain', backgroundColor: '#f7fafc' }}
            />
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748', marginBottom: 1 }}>
                {machines[currentIndex].name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                {machines[currentIndex].description}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Botón derecho */}
        <IconButton
          onClick={nextMachine}
          sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>

      {/* Sección IA abajo */}
      <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
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
      </Container>
    </Box>
  );
}
