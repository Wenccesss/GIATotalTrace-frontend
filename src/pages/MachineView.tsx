import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
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
  estado: string;
  hora: string;
}

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedX, setSelectedX] = useState<number>(Date.now());
  const [dragging, setDragging] = useState<boolean>(false);
  const [selectedInfo, setSelectedInfo] = useState<string>("");

  const fetchEvents = async () => {
    setLoading(true);
    let url = "https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos";

    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append("start", new Date(startDate).toISOString());
      if (endDate) params.append("end", new Date(endDate).toISOString());
      url += `?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error de fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(); // carga inicial
  }, []);

  const handleFilter = () => {
    fetchEvents();
  };

  // Construir timeline continuo por segundos
  const buildTimeline = (events: Event[], start: number, end: number) => {
    const timeline: { x: number; y: number }[] = [];
    let currentState = events[0]?.estado === "MARCHA" ? 1 : 0;
    let eventIndex = 0;

    for (let t = start; t <= end; t += 1000) { // cada segundo
      if (
        eventIndex < events.length &&
        new Date(events[eventIndex].hora).getTime() <= t
      ) {
        currentState = events[eventIndex].estado === "MARCHA" ? 1 : 0;
        eventIndex++;
      }
      timeline.push({ x: t, y: currentState });
    }
    return timeline;
  };

  const startTimestamp = startDate ? new Date(startDate).getTime() : (events[0] ? new Date(events[0].hora).getTime() : Date.now() - 3600000);
  const endTimestamp = endDate ? new Date(endDate).getTime() : Date.now();

  const chartData = buildTimeline(events, startTimestamp, endTimestamp);

  // Dragging logic
  const handleMouseDown = () => setDragging(true);
  const handleMouseUp = () => {
    setDragging(false);
    const fecha = new Date(selectedX).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Buscar último estado válido en ese instante
    const lastPoint = chartData.filter(d => d.x <= selectedX).pop();
    const estado = lastPoint?.y === 1 ? "MARCHA" : "PARO";

    setSelectedInfo(`Estado: ${estado} | ${fecha}`);
  };

  const handleMouseMove = (e: any) => {
    if (!dragging || !e || !e.activeLabel) return;
    setSelectedX(e.activeLabel);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8f9fa', paddingY: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setLocation('/dashboard')}
          sx={{ marginBottom: 3, color: '#667eea', textTransform: 'none', fontSize: '1rem', fontWeight: 500 }}
        >
          Volver al Dashboard
        </Button>

        <Card elevation={3} sx={{ borderRadius: 2, marginBottom: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ color: '#2b6cb0', fontWeight: 600, marginBottom: 2 }}>
              Estado de la Máquina en el tiempo
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
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
              <Button variant="contained" color="primary" onClick={handleFilter}>
                Filtrar
              </Button>
            </Box>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
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
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => (v === 1 ? 'MARCHA' : 'PARO')}
                  width={80}
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
                <Line type="stepAfter" dataKey="y" stroke="#667eea" strokeWidth={2} dot={false} />

                <ReferenceLine
                  x={selectedX}
                  stroke="black"
                  strokeWidth={2}
                  label={selectedInfo}
                  ifOverflow="extendDomain"
                  onMouseDown={handleMouseDown}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
