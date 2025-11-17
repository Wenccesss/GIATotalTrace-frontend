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
  hora: string; // ISO datetime
}

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [, setLocation] = useLocation();

  // Inputs pasivos (no disparan fetch hasta pulsar Filtrar)
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');

  // Filtros activos como timestamps (ms)
  const [startMs, setStartMs] = useState<number | null>(null);
  const [endMs, setEndMs] = useState<number | null>(null);

  // Datos y carga
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Líneas verticales y paneles de info
  const [selectedX1, setSelectedX1] = useState<number>(Date.now());
  const [selectedX2, setSelectedX2] = useState<number>(Date.now());
  const [draggingLine, setDraggingLine] = useState<'black' | 'red' | null>(null);
  const [selectedInfo1, setSelectedInfo1] = useState<string>('');
  const [selectedInfo2, setSelectedInfo2] = useState<string>('');
  const [diffInfo, setDiffInfo] = useState<string>('');
  const [hoverInfo, setHoverInfo] = useState<string>('');

  // Ref del contenedor para overlay y conversión pixel↔tiempo
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  // Límites del calendario (construidos desde hora local)
  const now = new Date();
  const nowIsoLocal = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes()
  )
    .toISOString()
    .slice(0, 16);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneMonthAgoIsoLocal = new Date(
    oneMonthAgo.getFullYear(),
    oneMonthAgo.getMonth(),
    oneMonthAgo.getDate(),
    oneMonthAgo.getHours(),
    oneMonthAgo.getMinutes()
  )
    .toISOString()
    .slice(0, 16);

  // Márgenes del gráfico (deben coincidir con LineChart.margin)
  const MARGINS = { top: 20, right: 30, left: 60, bottom: 20 };

  // Fetch de eventos (usa filtros activos; ISO solo para la petición)
  const fetchEvents = async (start?: number | null, end?: number | null) => {
    setLoading(true);
    let url = 'https://us-central1-ecotrace-d35d9.cloudfunctions.net/eventos';

    if (start || end) {
      const params = new URLSearchParams();
      if (start) params.append('start', new Date(start!).toISOString());
      if (end) params.append('end', new Date(end!).toISOString());
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

  // Aplicar filtros al pulsar “Filtrar”
  const handleFilter = () => {
    const startLocalMs = startDateInput ? new Date(startDateInput).getTime() : null;
    const endLocalMs = endDateInput ? new Date(endDateInput).getTime() : null;

    const minStart = oneMonthAgo.getTime();
    const maxEnd = now.getTime();
    const startValid = startLocalMs ? Math.max(startLocalMs, minStart) : null;
    const endValid = endLocalMs ? Math.min(endLocalMs, maxEnd) : null;

    setStartMs(startValid);
    setEndMs(endValid);
    fetchEvents(startValid, endValid);
  };

  // Rango activo de la gráfica (ms)
  const startTimestamp = useMemo(() => {
    if (startMs !== null) return startMs;
    if (events[0]) return new Date(events[0].hora).getTime();
    return Date.now() - 3600000; // último 1h por defecto
  }, [startMs, events]);

  const endTimestamp = useMemo(() => {
    if (endMs !== null) return endMs;
    return Date.now();
  }, [endMs]);

  // Serie discreta basada en eventos (rendimiento) con eje continuo
  const chartData = useMemo(() => {
    const series: { x: number; y: number }[] = [];
    if (startTimestamp > endTimestamp) return series;

    const sorted = [...events]; // ya ordenado

    // Estado vigente al inicio del rango
    const initialState = stateAt(sorted, startTimestamp);
    series.push({ x: startTimestamp, y: initialState === 'MARCHA' ? 1 : 0 });

    // Eventos dentro del rango
    for (const ev of sorted) {
      const t = new Date(ev.hora).getTime();
      if (t >= startTimestamp && t <= endTimestamp) {
        series.push({ x: t, y: ev.estado === 'MARCHA' ? 1 : 0 });
      }
    }

    // Punto final para cerrar tramo
    const lastState = stateAt(sorted, endTimestamp);
    series.push({ x: endTimestamp, y: lastState === 'MARCHA' ? 1 : 0 });

    series.sort((a, b) => a.x - b.x);
    return series;
  }, [events, startTimestamp, endTimestamp]);

  // Formato de fecha para UI
  const formatDateTime = (ms: number) =>
    new Date(ms).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  // Estado vigente en ms (búsqueda binaria: último evento con hora <= ms)
  function stateAt(sortedEvents: Event[], ms: number): 'MARCHA' | 'PARO' {
    if (sortedEvents.length === 0) return 'PARO';
    let lo = 0;
    let hi = sortedEvents.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const tMid = new Date(sortedEvents[mid].hora).getTime();
      if (tMid <= ms) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (idx === -1) return sortedEvents[0].estado;
    return sortedEvents[idx].estado;
  }

  // Diferencia entre líneas
  const formatDiff = (ms: number) => {
    const diffSec = Math.floor(Math.abs(ms) / 1000);
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    return `Diferencia: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Conversión pixel ↔ tiempo (overlay propio)
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const pixelToTime = (clientX: number) => {
    const rect = chartWrapRef.current?.getBoundingClientRect();
    if (!rect) return startTimestamp;
    const plotW = rect.width - MARGINS.left - MARGINS.right;
    if (plotW <= 0) return startTimestamp;
    const xInPlot = clamp(clientX - rect.left - MARGINS.left, 0, plotW);
    const rel = xInPlot / plotW;
    const ms = startTimestamp + rel * (endTimestamp - startTimestamp);
    return Math.round(ms / 1000) * 1000; // redondeo a segundo
  };

  const timeToLeftPx = (ms: number) => {
    const rect = chartWrapRef.current?.getBoundingClientRect();
    if (!rect || endTimestamp === startTimestamp) return MARGINS.left;
    const plotW = rect.width - MARGINS.left - MARGINS.right;
    const rel = (ms - startTimestamp) / (endTimestamp - startTimestamp);
    return MARGINS.left + clamp(rel, 0, 1) * plotW;
  };

  // Overlay: selección de línea por proximidad
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    const clickX = e.clientX;
    const rectLeft = chartWrapRef.current?.getBoundingClientRect().left ?? 0;
    const clickRel = clickX - rectLeft;
    const x1 = timeToLeftPx(selectedX1);
    const x2 = timeToLeftPx(selectedX2);
    const d1 = Math.abs(x1 - clickRel);
    const d2 = Math.abs(x2 - clickRel);
    const threshold = 12; // px
    if (d1 < d2 && d1 <= threshold) setDraggingLine('black');
    else if (d2 <= threshold) setDraggingLine('red');
  };

  // Overlay: mover y hover info en tiempo real
  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    const xMs = pixelToTime(e.clientX);
    const estadoHover = stateAt(events, xMs);
    setHoverInfo(`${estadoHover} | ${formatDateTime(xMs)}`);

    if (!draggingLine) return;
    if (draggingLine === 'black') setSelectedX1(xMs);
    if (draggingLine === 'red') setSelectedX2(xMs);
  };

  const handleOverlayMouseUp = () => {
    if (!draggingLine) return;

    if (draggingLine === 'black') {
      const estado = stateAt(events, selectedX1);
      setSelectedInfo1(`${estado} | ${formatDateTime(selectedX1)}`);
    } else {
      const estado = stateAt(events, selectedX2);
      setSelectedInfo2(`${estado} | ${formatDateTime(selectedX2)}`);
    }
    setDraggingLine(null);

    if (selectedX1 && selectedX2) {
      setDiffInfo(formatDiff(selectedX2 - selectedX1));
    }
  };

  // Reiniciar líneas y paneles al cambiar el rango visible
  useEffect(() => {
    setSelectedX1(startTimestamp);
    setSelectedX2(endTimestamp);
    setSelectedInfo1('');
    setSelectedInfo2('');
    setDiffInfo('');
    setHoverInfo('');
  }, [startTimestamp, endTimestamp]);

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
                  min: oneMonthAgoIsoLocal,
                  max: nowIsoLocal,
                }}
              />
              <TextField
                label="Fin"
                type="datetime-local"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: oneMonthAgoIsoLocal,
                  max: nowIsoLocal,
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
              {hoverInfo && (
                <Typography variant="body1" sx={{ ml: 2, color: '#475569', fontWeight: 500 }}>
                  {hoverInfo}
                </Typography>
              )}
            </Stack>

            {/* Contenedor del gráfico + overlay de arrastre y hover */}
            <Box
              ref={chartWrapRef}
              sx={{ position: 'relative', width: '100%', height: 380, userSelect: 'none' }}
              onMouseDown={handleOverlayMouseDown}
              onMouseMove={handleOverlayMouseMove}
              onMouseUp={handleOverlayMouseUp}
              onMouseLeave={handleOverlayMouseUp}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={MARGINS}>
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
                  {/* Sin Tooltip de Recharts para no mostrar mensajes automáticos */}
                  <Line
                    type="stepAfter"
                    dataKey="y"
                    stroke="#667eea"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Overlay: líneas verticales posicionadas por píxeles */}
              <Box
                sx={{
                  position: 'absolute',
                  top: MARGINS.top,
                  bottom: MARGINS.bottom,
                  left: timeToLeftPx(selectedX1),
                  width: 0,
                  borderLeft: '2px solid black',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: MARGINS.top,
                  bottom: MARGINS.bottom,
                  left: timeToLeftPx(selectedX2),
                  width: 0,
                  borderLeft: '2px solid red',
                  pointerEvents: 'none',
                }}
              />

              {/* Handles transparentes para facilitar el arrastre */}
              <Box
                sx={{
                  position: 'absolute',
                  top: MARGINS.top,
                  bottom: MARGINS.bottom,
                  left: timeToLeftPx(selectedX1) - 6,
                  width: 12,
                  cursor: 'ew-resize',
                }}
                onMouseDown={() => setDraggingLine('black')}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: MARGINS.top,
                  bottom: MARGINS.bottom,
                  left: timeToLeftPx(selectedX2) - 6,
                  width: 12,
                  cursor: 'ew-resize',
                }}
                onMouseDown={() => setDraggingLine('red')}
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}