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

  const fetchEvents = async () => {
    console.log("🔎 fetchEvents ejecutado");
    let url = "https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos";

    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append("start", new Date(startDate).toISOString());
      if (endDate) params.append("end", new Date(endDate).toISOString());
      url += `?${params.toString()}`;
    }

    console.log("🌐 URL llamada:", url);

    try {
      const res = await fetch(url);
      console.log("📡 HTTP status:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text().catch(() => "<sin cuerpo>");
        console.error("❌ Respuesta no OK:", text);
        return;
      }

      const data = await res.json();
      console.log("📦 Eventos recibidos:", data);

      if (!Array.isArray(data)) {
        console.error("⚠️ La respuesta no es un array:", data);
        return;
      }

      setEvents(data);
    } catch (err) {
      console.error("❌ Error de fetch (posible CORS / red):", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [startDate, endDate]);

  const handleApply = () => {
    setCurrentFrequency(newFrequency);
    console.log(`⚙️ Nuevo valor aplicado: ${newFrequency} segundos`);
  };

  // Transformación de eventos a chartData
  let chartData = events.map(ev => ({
    x: new Date(ev.hora).getTime(),
    y: ev.estado === "MARCHA" ? 1 : 0,
  }));

  // Si NO hay filtros aplicados y sí hay eventos → añadimos punto hasta ahora
  const noFilters = !startDate && !endDate;
  if (noFilters && events.length > 0) {
    const lastEvent = events[events.length - 1];
    chartData.push({
      x: Date.now(),
      y: lastEvent.estado === "MARCHA" ? 1 : 0,
    });
  }

  console.log("📊 chartData:", chartData);

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
              <Button variant="contained" color="primary" onClick={fetchEvents}>
                Filtrar
              </Button>
            </Box>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
              >
                <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={['auto', 'auto']}
                  tickFormatter={(unixTime) =>
                    new Date(unixTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
                    new Date(unixTime).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  }
                />
                <Line type="stepAfter" dataKey="y" stroke="#667eea" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}