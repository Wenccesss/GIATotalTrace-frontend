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
import { Factory, Logout, ExpandMore, ArrowBack, ArrowForward } from '@mui/icons-material';
import { useLocation } from 'wouter';

// IMPORTA TUS IMÁGENES
import imgMachine1 from '../attached_assets/generated_images/Imagen_Dashboard.jpg';
import imgMachine2 from '../attached_assets/generated_images/Imagen_Dashboard.jpg'; // puedes cambiar luego
import imgMachine3 from '../attached_assets/generated_images/Imagen_Dashboard.jpg'; // puedes cambiar luego

interface DashboardProps {
  onLogout: () => void; // sigue siendo simulada
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState('');

  // 🔥 AUTENTICACIÓN SIMULADA (no llama backend)
  const handleLogout = () => {
    console.log("Simulando logout...");
    onLogout();
  };

  // Máquinas para el carrusel
  const machines = [
    { id: '1', name: 'Máquina 1', description: 'Control Dimensional BARCINO', imageUrl: imgMachine1 },
    { id: '2', name: 'Máquina 2', description: 'Control Calidad ADDESCO', imageUrl: imgMachine2 },
    { id: '3', name: 'Máquina 3', description: 'Desbarbado Palets', imageUrl: imgMachine3 },
  ];

  // 🔥 Estado del carrusel
  const [index, setIndex] = useState(0);

  const prevMachine = () => {
    setIndex((i) => (i === 0 ? machines.length - 1 : i - 1));
  };

  const nextMachine = () => {
    setIndex((i) => (i === machines.length - 1 ? 0 : i + 1));
  };

  // Soporte swipe para móvil
  let touchStartX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;

    if (touchStartX - endX > 50) nextMachine();  
    if (endX - touchStartX > 50) prevMachine();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* BARRA SUPERIOR */}
      <Paper elevation={2} sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 1000, background: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Factory sx={{ fontSize: 32, color: '#2b6cb0' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                EcoTrace
              </Typography>
            </Box>
            <Tooltip title="Cerrar sesión (Simulada)">
              <IconButton
                onClick={handleLogout}
                data-testid="button-logout"
                sx={{ color: '#2b6cb0', '&:hover': { backgroundColor: 'rgba(43, 108, 176, 0.1)' } }}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Paper>

      {/* CONTENIDO PRINCIPAL */}
      <Container maxWidth="lg">
        <Box sx={{ paddingY: 8, textAlign: 'center' }}>
          <Typography
            variant="h2"
            data-testid="text-dashboard-title"
            sx={{
              fontWeight: 700,
              marginBottom: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EcoTrace
          </Typography>

          {/* CARRUSEL */}
          <Box
            sx={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {/* Botones en PC */}
            <IconButton
              onClick={prevMachine}
              sx={{
                position: 'absolute',
                left: -50,
                top: '45%',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <ArrowBack />
            </IconButton>

            <Card
              elevation={4}
              onClick={() => setLocation(`/machine/${machines[index].id}`)}
              data-testid={`card-machine-${machines[index].id}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <CardMedia
                component="img"
                height="160"
                image={machines[index].imageUrl}
                alt={machines[index].name}
                sx={{ objectFit: 'contain', p: 1, backgroundColor: '#f7fafc' }}
              />
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {machines[index].name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  {machines[index].description}
                </Typography>
              </CardContent>
            </Card>

            {/* Siguiente */}
            <IconButton
              onClick={nextMachine}
              sx={{
                position: 'absolute',
                right: -50,
                top: '45%',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <ArrowForward />
            </IconButton>
          </Box>

          {/* TEXTO */}
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
              Desliza o usa las flechas para cambiar de máquina
            </Typography>
          </Box>

          {/* IA */}
          <Box sx={{ marginTop: 6 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Preguntar a la IA sobre las máquinas
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                />
                <Button variant="contained" sx={{ mt: 2 }}>
                  Preguntar
                </Button>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
