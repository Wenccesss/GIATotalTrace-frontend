import { useState, useEffect, useMemo, useRef } from 'react';
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
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface Event {
  id: string;
  estado: 'MARCHA' | 'PARO';
  hora: string;
}

interface TimeChartProps {
  start: number;
  end: number;
  events: Event[];
  chartData: { x: number; y: number }[];
  selectedX1: number;
  selectedX2: number;
  setSelectedX1: (x: number) => void;
  setSelectedX2: (x: number) => void;
}

function TimeChart({
  start,
  end,
  events,
  chartData,
  selectedX1,
  selectedX2,
  setSelectedX1,
  setSelectedX2,
}: TimeChartProps) {
  const chartRef = useRef<any>(null);
  const [draggingLine, setDraggingLine] = useState<'black' | 'red' | null>(null);

  const timeToPixel = (ms: number) => {
    const scale = chartRef.current?.state?.xAxisMap?.x?.scale;
    return scale ? scale(ms) : 0;
  };

  const pixelToTime = (clientX: number) => {
    const scale = chartRef.current?.state?.xAxisMap?.x?.scale;
    if (!scale) return start;
    const rect = chartRef.current.container.getBoundingClientRect();
    const relX = clientX - rect.left;
    return scale.invert(relX);
  };

  const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  function stateAt(sortedEvents: Event[], ms: number): 'MARCHA' | 'PARO' {
    if (sortedEvents.length === 0) return 'PARO';
    let lo = 0, hi = sortedEvents.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const tMid = new Date(sortedEvents[mid].hora).getTime();
      if (tMid <= ms) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return idx === -1 ? sortedEvents[0].estado : sortedEvents[idx].estado;
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 380 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          ref={chartRef}
          data={chartData}
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[start, end]}
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
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 1]}
            tickFormatter={(v) => (v === 1 ? 'MARCHA' : 'PARO')}
          />
          <Line type="stepAfter" dataKey="y" stroke="#667eea" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      {/* Overlay transparente para capturar arrastre */}
      <Box
        sx={{ position: 'absolute', inset: 0, zIndex: 3 }}
        onMouseMove={(e) => {
          if (!draggingLine) return;
          const ms = pixelToTime(e.clientX);
          if (draggingLine === 'black') setSelectedX1(ms);
          if (draggingLine === 'red') setSelectedX2(ms);
        }}
        onMouseUp={() => {
          if (draggingLine === 'black') {
            console.log(`Negra → ${stateAt(events, selectedX1)} | ${formatDateTime(selectedX1)}`);
          } else if (draggingLine === 'red') {
            console.log(`Roja → ${stateAt(events, selectedX2)} | ${formatDateTime(selectedX2)}`);
          }
          setDraggingLine(null);
        }}
        onMouseLeave={() => setDraggingLine(null)}
      />

      {/* Líneas verticales */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          bottom: 20,
          left: timeToPixel(selectedX1),
          width: 2,
          backgroundColor: 'black',
          cursor: 'ew-resize',
          zIndex: 4,
        }}
        onMouseDown={() => setDraggingLine('black')}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          bottom: 20,
          left: timeToPixel(selectedX2),
          width: 2,
          backgroundColor: 'red',
          cursor: 'ew-resize',
          zIndex: 4,
        }}
        onMouseDown={() => setDraggingLine('red')}
      />
    </Box>
  );
}

export default function MachineView({ machineId }: { machineId: string }) {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [startMs, setStartMs] = useState<number | null>(null);
  const [endMs, setEndMs] = useState<number | null>(null);
  const [selectedX1, setSelectedX1] = useState(Date.now());
  const [selectedX2, setSelectedX2] = useState(Date.now());

  const fetchEvents = async (start?: number | null, end?: number | null) => {
    let url = 'https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos';
    if (start || end) {
      const params = new URLSearchParams();
      if (start) params.append('start', new Date(start!).toISOString());
      if (end) params.append('end', new Date(end!).toISOString());
      url += `?${params.toString()}`;
    }
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
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const startTimestamp = useMemo(() => {
    if (startMs !== null) return startMs;
    if (events[0]) return new Date(events[0].hora).getTime();
    return Date.now() - 3600000;
  }, [startMs, events]);

  const endTimestamp = useMemo(() => {
    if (endMs !== null) return endMs;
    return Date.now();
  }, [endMs]);

  const chartData = useMemo(() => {
    const series: { x: number; y: number }[] = [];
    if (startTimestamp > endTimestamp) return series;

    const sorted = [...events];
    const initialState = sorted.length ? sorted[0].estado : 'PARO';
    series.push({ x: startTimestamp, y: initialState === 'MARCHA' ? 1 : 0 });

    for (const ev of sorted) {
      const t = new Date(ev.hora).getTime();
      if (t >= startTimestamp && t <= endTimestamp) {
        series.push({ x: t, y: ev.estado === 'MARCHA' ? 1 : 0 });
      }
    }

    const lastState = sorted.length ? sorted[sorted.length - 1].estado : initialState;
    series.push({ x: endTimestamp, y: lastState === 'MARCHA' ? 1 : 0 });

  series.sort((a, b) => a.x - b.x);
  return series;
}, [events, startTimestamp, endTimestamp]);

const handleFilter = () => {
  const startLocalMs = startDateInput ? new Date(startDateInput).getTime() : null;
  const endLocalMs = endDateInput ? new Date(endDateInput).getTime() : null;
  setStartMs(startLocalMs);
  setEndMs(endLocalMs);
  fetchEvents(startLocalMs, endLocalMs);
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
            />
            <TextField
              label="Fin"
              type="datetime-local"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" color="primary" onClick={handleFilter}>
              Filtrar
            </Button>
          </Stack>

          <TimeChart
            start={startTimestamp}
            end={endTimestamp}
            events={events}
            chartData={chartData}
            selectedX1={selectedX1}
            selectedX2={selectedX2}
            setSelectedX1={setSelectedX1}
            setSelectedX2={setSelectedX2}
          />
        </CardContent>
      </Card>
    </Container>
  </Box>
);
}