import { useState, useRef } from 'react';
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
import EmblaCarouselReact, { EmblaCarouselType } from 'embla-carousel-react';
import dashboardImage from '../attached_assets/generated_images/Imagen_Dashboard.jpg';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [question, setQuestion] = useState('');
  const emblaRef = useRef<EmblaCarouselType | null>(null);

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
      description: 'Control Dimensional Barcino',
      imageUrl: dashboardImage,
    },
    {
      id: '2',
      name: 'Máquina 2',
      description: 'Control_calidad_ADDESCO',
      imageUrl: dashboardImage,
    },
    {
      id: '3',
      name: 'Máquina 3',
      description: 'Desbarbado_Palet',
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

          {/* Carrusel de máquinas */}
          <Box sx={{ position: 'relative', maxWidth: 600, marginX: 'auto' }}>
            <EmblaCarouselReact
              htmlTagName="div"
              emblaRef={emblaRef}
              options={{ loop: true }}
              style={{ overflow: 'hidden' }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                {machines.map((machine) => (
                  <Card key={machine.id} sx={{ minWidth: 300, flexShrink: 0 }}>
                    <CardActionArea onClick={() => setLocation(`/machine/${machine.id}`)}>
                      <CardMedia
                        component="img"
                        image={machine.imageUrl}
                        alt={machine.name}
                        sx={{ height: 200, objectFit: 'contain', backgroundColor: '#f7fafc' }}
                      />
                      <CardContent>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                          {machine.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096' }}>
                          {machine.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            </EmblaCarouselReact>

            {/* Botones de navegación */}
            <IconButton
              onClick={() => emblaRef.current?.scrollPrev()}
              sx={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', zIndex: 10 }}
            >
              <ArrowBackIos />
            </IconButton>
            <IconButton
              onClick={() => emblaRef.current?.scrollNext()}
              sx={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', zIndex: 10 }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Box>

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
