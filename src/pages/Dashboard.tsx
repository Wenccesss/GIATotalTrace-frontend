import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
import dashboardImage from '../attached_assets/generated_images/Imagen_Dashboard.jpg';

function formatearDuracion(totalSegundos: number) {
  if (totalSegundos < 0) totalSegundos = 0;

  const dias = Math.floor(totalSegundos / 86400);
  totalSegundos %= 86400;

  const horas = Math.floor(totalSegundos / 3600);
  totalSegundos %= 3600;

  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  return { dias, horas, minutos, segundos };
}

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

// Tiempo real del panel industrial
const [estadoActual, setEstadoActual] = useState<"MARCHA" | "PARO" | null>(null);
const [ultimoCambio, setUltimoCambio] = useState<number | null>(null);
const [tick, setTick] = useState(Date.now());

// 🔥 Lista completa de eventos (para horas día/semana/mes)
const [eventos, setEventos] = useState<any[]>([]);

// ---------------------------------------------
// 🔥 Función para calcular horas día/semana/mes
// ---------------------------------------------
function calcularHorasEnMarcha(eventos, inicio, fin) {
  let total = 0;
  let enMarcha = false;
  let inicioTramo = null;

  for (const ev of eventos) {
    const t = ev.hora;

    if (t < inicio) continue;
    if (t > fin) break;

    if (ev.estado === "MARCHA") {
      enMarcha = true;
      inicioTramo = t;
    } else if (ev.estado === "PARO" && enMarcha) {
      total += (t - inicioTramo);
      enMarcha = false;
      inicioTramo = null;
    }
  }

  // Si sigue en marcha, sumar solo el tramo actual
  if (enMarcha && inicioTramo !== null) {
    total += (fin - inicioTramo);
  }

  return total / 3600000; // horas
}

useEffect(() => {
  const q = query(
    collection(db, "eventos"),
    orderBy("hora", "asc")
  );

  const unsub = onSnapshot(q, (snapshot) => {
    const arr = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        estado: data.estado,
        hora: data.hora.toMillis() - 2*60*60*1000,   // CAMBIO: corregir UTC+2
      };
    });

    if (arr.length === 0) return;

    const ultimo = arr[arr.length - 1];
    setEstadoActual(ultimo.estado);
    setUltimoCambio(ultimo.hora);
    setEventos(arr);
  });

  return () => unsub();
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setTick(Date.now());
  }, 1000);

  return () => clearInterval(interval);
}, []);

// ---------------------------------------------
// 🔥 Cálculo de horas día / semana / mes
// ---------------------------------------------
const ahora = Date.now();

// Día
const inicioDia = new Date();
inicioDia.setHours(0, 0, 0, 0);

// Semana (lunes)
const inicioSemana = new Date();
inicioSemana.setHours(0, 0, 0, 0);
inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);

// Mes
const inicioMes = new Date();
inicioMes.setDate(1);
inicioMes.setHours(0, 0, 0, 0);

const horasDia = calcularHorasEnMarcha(eventos, inicioDia.getTime(), Date.now());
const horasSemana = calcularHorasEnMarcha(eventos, inicioSemana.getTime(), Date.now());
const horasMes = calcularHorasEnMarcha(eventos, inicioMes.getTime(), Date.now());

const segundosDia = Math.floor(horasDia * 3600);
const segundosSemana = Math.floor(horasSemana * 3600);
const segundosMes = Math.floor(horasMes * 3600);

const prodDia = formatearDuracion(segundosDia);
const prodSemana = formatearDuracion(segundosSemana);
const prodMes = formatearDuracion(segundosMes);


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

  const handleLogout = () => {
  onLogout();
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
  <Container maxWidth={false} disableGutters>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
    {/* Izquierda */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Factory sx={{ fontSize: 32, color: '#2b6cb0' }} />
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
        EcoTrace
      </Typography>
    </Box>

    {/* Derecha */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, color: '#2d3748' }}>
        Cerrar sesión
      </Typography>
      <IconButton
        onClick={handleLogout}
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
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

         
{/* 🔥 Panel industrial a la derecha */}
<Box
  sx={{
    width: { xs: '100%', md: '340px' },
    minHeight: '420px',
    backgroundColor: '#f2f2f2',               // gris industrial
    borderRadius: '8px',
    padding: 3,
    boxShadow: '0 0 0 2px #c9c9c9, 0 4px 20px rgba(0,0,0,0.2)', // borde metálico + sombra
    border: '2px solid #d1d1d1',             // borde más marcado
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  }}
>
  <Typography variant="h6" sx={{ fontWeight: 600 }}>
    Estado en tiempo real
  </Typography>

  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
  
  {/* LED */}
  <Box
    sx={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      backgroundColor: estadoActual === "MARCHA" ? "#00c853" : "#d50000",
      boxShadow: estadoActual === "MARCHA"
        ? "0 0 10px #00e676"
        : "0 0 10px #ff1744",
      transition: "all 0.3s ease",
    }}
  />

{/* Estado actual */}
<Typography sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
  Estado:{" "}
  <span style={{ color: estadoActual === "MARCHA" ? "#00c853" : "#d50000" }}>
    {estadoActual ?? "Cargando..."}
  </span>
</Typography>

{/* Contador en vivo */}
<Typography sx={{ fontSize: "1rem", mt: 1 }}>
  Tiempo desde último cambio:
  <br />
  {ultimoCambio ? (() => {
    const tiempoSegundos = Math.floor((tick - ultimoCambio) / 1000);
    const { dias, horas, minutos, segundos } = formatearDuracion(tiempoSegundos);
    return `${dias}d ${horas}h ${minutos}m ${segundos}s`;
  })() : "Cargando..."}
</Typography>

{/* Producción diaria */}
<Typography sx={{ fontSize: "1rem", mt: 2 }}>
  Producción diaria: {prodDia.dias}d {prodDia.horas}h {prodDia.minutos}m {prodDia.segundos}s
</Typography>

{/* Producción semanal */}
<Typography sx={{ fontSize: "1rem" }}>
  Producción semanal: {prodSemana.dias}d {prodSemana.horas}h {prodSemana.minutos}m {prodSemana.segundos}s
</Typography>

{/* Producción mensual */}
<Typography sx={{ fontSize: "1rem" }}>
  Producción mensual: {prodMes.dias}d {prodMes.horas}h {prodMes.minutos}m {prodMes.segundos}s
</Typography>


</Box>
</Box>





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