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
  estado: 'MARCHA' | 'PARO';
  hora: string; // ISO datetime string
}

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [, setLocation] = useLocation();

  // Inputs pasivos (no disparan fetch hasta pulsar Filtrar)
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');

  // Filtros activos
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Datos y carga
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Líneas verticales y panel de info
  const [selectedX1, setSelectedX1] = useState<number>(Date.now());
  const [selectedX2, setSelectedX2] = useState<number>(Date.now());
  const [draggingLine, setDraggingLine] = useState<'black' | 'red' | null>(null);
  const [selectedInfo1, setSelectedInfo1] = useState<string>('');
  const [selectedInfo2, setSelectedInfo2] = useState<string>('');
  const [diffInfo, setDiffInfo] = useState<string>('');

  // Límites del calendario
  const nowIso = new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  const oneMonthAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  // Fetch de eventos (usa filtros activos)
  const fetchEvents = async (start?: string, end?: string) => {
    setLoading(true);
    let url = 'https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos';

    if (start || end) {
      const params = new URLSearchParams();
      if (start) params.append('start', new Date(start).toISOString());
      if (end) params.append('end', new Date(end).toISOString());
      url += `?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      const normalized: Event[] = arr
        .map((e: any) => ({
          id: String(e.id ?? ''),
          estado: e.estado === 'MARCHA' ? 'MARCHA' : 'PARO',
          hora: String(e.hora),
        }))
        .sort((a: Event, b: Event) => new Date(a.hora).getTime() - new Date(b.hora).getTime());
      setEvents(normalized);
    } catch (err) {
      console.error('Error de fetch:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchEvents();
  }, []);

  // Aplicar filtros solo al pulsar “Filtrar”
  const handleFilter = () => {
    const startValid = startDateInput
      ? Math.max(new Date(startDateInput).getTime(), new Date(oneMonthAgoIso).getTime())
      : undefined;
    const endValid = endDateInput
      ? Math.min(new Date(endDateInput).getTime(), new Date(nowIso).getTime())
      : undefined;

    const startISO = startValid ? new Date(startValid).toISOString().slice(0, 16) : '';
    const endISO = endValid ? new Date(endValid).toISOString().slice(0, 16) : '';

    setStartDate(startISO);
    setEndDate(endISO);
    fetchEvents(startISO, endISO);
  };

  // Rango activo de la gráfica
  const startTimestamp = useMemo(() => {
    if (startDate) return new Date(startDate).getTime();
    if (events[0]) return new Date(events[0].hora).getTime();
    return Date.now() - 3600000; // último 1h por defecto
  }, [startDate, events]);

  const endTimestamp = useMemo(() => {
    if (endDate) return new Date(endDate).getTime();
    return Date.now();
  }, [endDate]);

  // Serie discreta basada en eventos para rendimiento
  const chartData = useMemo(() => {
    const series: { x: number; y: number }[] = [];
    if (startTimestamp > endTimestamp) return series;

    const sorted = [...events].sort(
      (a, b) => new Date(a.hora).getTime() - new Date(b.hora).getTime()
    );

    // Estado vigente al inicio del rango
    const initialState = getStateAtRaw(sorted, startTimestamp);
    series.push({ x: startTimestamp, y: initialState === 'MARCHA' ? 1 : 0 });

    // Eventos dentro del rango
    for (const ev of sorted) {
      const t = new Date(ev.hora).getTime();
      if (t >= startTimestamp && t <= endTimestamp) {
        series.push({ x: t, y: ev.estado === 'MARCHA' ? 1 : 0 });
      }
    }

    // Punto final para cerrar tramo
    const lastState = getStateAtRaw(sorted, endTimestamp);
    series.push({ x: endTimestamp, y: lastState === 'MARCHA' ? 1 : 0 });

    series.sort((a, b) => a.x - b.x);
    return series;
  }, [events, startTimestamp, endTimestamp]);

  // Utilidades
  const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  function getStateAtRaw(sortedEvents: Event[], ms: number): 'MARCHA' | 'PARO' {
    if (sortedEvents.length === 0) return 'PARO';
    let state: 'MARCHA' | 'PARO' = sortedEvents[0].estado;
    for (let i = 0; i < sortedEvents.length; i++) {
      const t = new Date(sortedEvents[i].hora).getTime();
      if (t <= ms) {
        state = sortedEvents[i].estado;
      } else {
        break;
      }
    }
    return state;
  }

  const getStateAt = (ms: number) => getStateAtRaw(events, ms);

  const formatDiff = (ms: number) => {
    const diffSec = Math.floor(Math.abs(ms) / 1000);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    return `Diferencia: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Arrastre de líneas
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
      setSelectedInfo1(`${estado} | ${formatDateTime(selectedX1)}`);
    } else {
      const estado = getStateAt(selectedX2);
      setSelectedInfo2(`${estado} | ${formatDateTime(selectedX2)}`);
    }
    setDraggingLine(null);

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
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: oneMonthAgoIso, // no más allá de 1 mes
                  max: nowIso,         // no más allá de ahora
                }}
              />
              <TextField
                label="Fin"
                type="datetime-local"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: oneMonthAgoIso, // coherencia del rango
                  max: nowIso,         // bloquear futuro
                }}
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

            <ResponsiveContainer width="100%" height={360}>
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
                    new Date(unixTime).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
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

                {/* Línea negra arrastrable */}
                <ReferenceLine
                  x={selectedX1}
                  stroke="black"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                  onMouseDown={handleMouseDownBlack}
                />
                {/* Línea roja arrastrable */}
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