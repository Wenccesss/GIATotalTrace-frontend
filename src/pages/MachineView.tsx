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
  const [currentFrequency, setCurrentFrequency] = useState<number>(30);
  const [newFrequency, setNewFrequency] = useState<number>(30);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");

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
      if (!res.ok) {
        const text = await res.text().catch(() => "<sin cuerpo>");
        console.error("❌ Respuesta no OK:", text);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("⚠️ La respuesta no es un array:", data);
        setLoading(false);
        return;
      }

      setEvents(data);
    } catch (err) {
      console.error("❌ Error de fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(); // solo al montar
  }, []);

  const handleApply = () => {
    setCurrentFrequency(newFrequency);
  };

  const handleFilter = () => {
    fetchEvents();
  };

  const noFilters = !startDate && !endDate;

  let chartData = events.map(ev => ({
    x: new Date(ev.hora).getTime(),
    y: ev.estado === "MARCHA" ? 1 : 0,
  }));

  if (noFilters && events.length > 0) {
    const lastEvent = events[events.length - 1];
    chartData.push({
      x: Date.now(),
      y: lastEvent.estado === "MARCHA" ? 1 : 0,
    });
  }

  const handleChartClick = (e: any) => {
    if (!e || !e.activeLabel) return;
    const xValue = e.activeLabel;
    setSelectedX(xValue);

    const closest = chartData.reduce((prev, curr) =>
      Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev
    );
    setSelectedState(closest.y === 1 ? "MARCHA" : "PARO");
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

        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600, marginBottom: 1 }}>
            Frecuencia de envío de datos actual:{' '}
            <span style={{ color: '#2b6cb0' }}>{currentFrequency} segundos</span>
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
            <TextField
              type="number"
              value={newFrequency}
              onChange={(e) => setNewFrequency(Number(e.target.value))}
              inputProps={{ min: 10, max: 86400 }}
              sx={{ width: 200 }}
            />
            <Button variant="contained" color="primary" onClick={handleApply}>
              Aplicar
            </Button>
          </Box>
        </Box>

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
                onClick={handleChartClick}
              >
                <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={
                    noFilters
                      ? [chartData[0]?.x || 'auto', Date.now()]
                      : [
                          startDate ? new Date(startDate).getTime() : 'auto',
                          endDate ? new Date(endDate).getTime() : 'auto'
                        ]
                  }
                  tickCount={30}
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
                  tick={{ fontSize: 14, fill: '#2d3748' }}
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
                {selectedX && (
                  <ReferenceLine
                    x={selectedX}
                    stroke="black"
                    strokeWidth={2}
                    label={`Estado: ${selectedState}`}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
