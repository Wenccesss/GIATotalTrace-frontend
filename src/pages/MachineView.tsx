import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useLocation } from 'wouter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface Event {
  id: string;
  estado: string; // "MARCHA" | "PARO"
  hora: string;   // ISO date string
}

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [, setLocation] = useLocation();

  // Datos y filtros
  const [events, setEvents] = useState<Event[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Líneas verticales y paneles de info
  const [selectedX1, setSelectedX1] = useState<number>(Date.now());
  const [selectedX2, setSelectedX2] = useState<number>(Date.now());
  const [draggingLine, setDraggingLine] = useState<"black" | "red" | null>(null);
  const [selectedInfo1, setSelectedInfo1] = useState<string>('');
  const [selectedInfo2, setSelectedInfo2] = useState<string>('');
  const [diffInfo, setDiffInfo] = useState<string>('');

  // Cargar eventos
  const fetchEvents = async () => {
    setLoading(true);
    let url = 'https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos';

    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('start', new Date(startDate).toISOString());
      if (endDate) params.append('end', new Date(endDate).toISOString());
      url += `?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Respuesta no OK:', res.status, res.statusText);
        setEvents([]);
      } else {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error de fetch:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(); // carga inicial al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    fetchEvents();
  };

  // Rangos de tiempo para el timeline continuo
  const startTimestamp = useMemo(() => {
    if (startDate) return new Date(startDate).getTime();
    if (events[0]) return new Date(events[0].hora).getTime();
    return Date.now() - 3600000; // último 1h por defecto
  }, [startDate, events]);

  const endTimestamp = useMemo(() => {
    if (endDate) return new Date(endDate).getTime();
    return Date.now();
  }, [endDate]);

  // Construir timeline continuo por segundos con estado persistente
  const chartData = useMemo(() => {
    const timeline: { x: number; y: number }[] = [];
    if (startTimestamp > endTimestamp) return timeline;

    // Ordenar eventos por tiempo por seguridad
    const sorted = [...events].sort(
      (a, b) => new Date(a.hora).getTime() - new Date(b.hora).getTime()
    );

    // Estado inicial: si hay eventos, se toma el del primer evento;
    // si no, asumimos PARO (0) para evitar estados vacíos.
    let currentState =
      sorted.length > 0 && sorted[0].estado === 'MARCHA' ? 1 : 0;

    let eventIndex = 0;

    for (let t = startTimestamp; t <= endTimestamp; t += 1000) {
      // Avanzar eventos que ocurren antes o en t
      while (
        eventIndex < sorted.length &&
        new Date(sorted[eventIndex].hora).getTime() <= t
      ) {
        currentState = sorted[eventIndex].estado === 'MARCHA' ? 1 : 0;
        eventIndex++;
      }
      timeline.push({ x: t, y: currentState });
    }
    return timeline;
  }, [events, startTimestamp, endTimestamp]);

  // Función util para formatear fecha/hora
  const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  // Buscar estado vigente en un instante (siempre existe en chartData)
  const getStateAt = (ms: number) => {
    if (!chartData.length) return 'PARO';
    // chartData está por segundo, podemos indexar
    // buscar último punto <= ms
    const idx = Math.min(
      chartData.length - 1,
      Math.max(0, Math.floor((ms - chartData[0].x) / 1000))
    );
    const probeX = chartData[0].x + idx * 1000;
    const y =
      probeX <= ms
        ? chartData[idx].y
        : chartData[Math.max(0, idx - 1)].y;
    return y === 1 ? 'MARCHA' : 'PARO';
  };

  // Diferencia de tiempo formateada
  const formatDiff = (ms: number) => {
    const diffSec = Math.floor(Math.abs(ms) / 1000);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    return ` ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Dragging handlers
  const handleMouseDownBlack = () => setDraggingLine('black');
  const handleMouseDownRed = () => setDraggingLine('red');

  const handleMouseMove = (e: any) => {
    if (!draggingLine || !e || !e.activeLabel) return;
    const x = e.activeLabel as number;
    if (draggingLine === 'black') setSelectedX1(x);
    if (draggingLine === 'red') setSelectedX2(x);
  };

  const handleMouseUp = () => {
    if (!draggingLine) return;

    if (draggingLine === 'black') {
      const estado = getStateAt(selectedX1);
      setSelectedInfo1(` ${estado} | ${formatDateTime(selectedX1)}`);
    } else {
      const estado = getStateAt(selectedX2);
      setSelectedInfo2(` ${estado} | ${formatDateTime(selectedX2)}`);
    }
    setDraggingLine(null);

    // Actualizar diferencia si ambas líneas tienen valores
    if (selectedX1 && selectedX2) {
      setDiffInfo(formatDiff(selectedX2 - selectedX1));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8f9fa', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setLocation('/dashboard')}
          sx={{ mb: 3, color: '#667eea', textTransform: 'none', fontSize: '1rem', fontWeight: 500 }}
        >
          Volver al Dashboard
        </Button>

        <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ color: '#2b6cb0', fontWeight: 600, mb: 2 }}>
              Estado de la máquina en el tiempo
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Inicio"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fin"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" color="primary" onClick={handleFilter} disabled={loading}>
                {loading ? 'Cargando…' : 'Filtrar'}
              </Button>

              {selectedInfo1 && (
                <Typography variant="body1" sx={{ ml: 2, color: 'black', fontWeight: 500 }}>
                  {selectedInfo1}
                </Typography>
              )}
              {selectedInfo2 && (
                <Typography variant="body1" sx={{ ml: 2, color: 'red', fontWeight: 500 }}>
                  {selectedInfo2}
                </Typography>
              )}
              {diffInfo && (
                <Typography variant="body1" sx={{ ml: 2, color: '#2b6cb0', fontWeight: 600 }}>
                  {diffInfo}
                </Typography>
              )}
            </Stack>

            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[startTimestamp, endTimestamp]}
                  tickFormatter={(unixTime) =>
                    new Date(unixTime).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  }
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => (v === 1 ? 'MARCHA' : 'PARO')}
                  width={80}
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(unixTime) =>
                    new Date(unixTime).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  }
                  formatter={(value) => (value === 1 ? 'MARCHA' : 'PARO')}
                />
                <Line
                  type="stepAfter"
                  dataKey="y"
                  stroke="#667eea"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />

                {/* Línea negra draggable */}
                <ReferenceLine
                  x={selectedX1}
                  stroke="black"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  onMouseDown={handleMouseDownBlack}
                />
                {/* Línea roja draggable */}
                <ReferenceLine
                  x={selectedX2}
                  stroke="red"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  onMouseDown={handleMouseDownRed}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}