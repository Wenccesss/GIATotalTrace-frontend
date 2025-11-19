import { useState, useEffect, useMemo, useCallback } from 'react';
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

import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { curveStepAfter } from 'd3-shape';

interface Event {
  id: string;
  estado: 'MARCHA' | 'PARO';
  hora: string;
}

export default function MachineView({ machineId }: { machineId: string }) {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [startMs, setStartMs] = useState<number | null>(null);
  const [endMs, setEndMs] = useState<number | null>(null);

  const fetchEvents = async (start?: number | null, end?: number | null) => {
    try {
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
    } catch (err) {
      console.error('Error fetching events', err);
    }
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

  // Líneas arrastrables
  const [selectedX1, setSelectedX1] = useState<number | null>(null);
  const [selectedX2, setSelectedX2] = useState<number | null>(null);
  const [dragging, setDragging] = useState<'x1' | 'x2' | null>(null);

  const handleFilter = () => {
    const startLocalMs = startDateInput ? new Date(startDateInput).getTime() : null;
    const endLocalMs = endDateInput ? new Date(endDateInput).getTime() : null;

    setStartMs(startLocalMs);
    setEndMs(endLocalMs);
    fetchEvents(startLocalMs, endLocalMs);

    if (startLocalMs !== null) setSelectedX1(startLocalMs);
    if (endLocalMs !== null) setSelectedX2(endLocalMs);
  };

  useEffect(() => {
    if (selectedX1 === null && startTimestamp) {
      setSelectedX1(startTimestamp);
    }
    if (selectedX2 === null && endTimestamp) {
      setSelectedX2(endTimestamp);
    }
  }, [startTimestamp, endTimestamp, selectedX1, selectedX2]);

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [new Date(startTimestamp), new Date(endTimestamp)],
        range: [margin.left, width - margin.right],
      }),
    [startTimestamp, endTimestamp, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 1],
        range: [height - margin.bottom, margin.top],
      }),
    [height]
  );

  function stateAt(sortedEvents: Event[], ms: number): 'MARCHA' | 'PARO' {
    if (sortedEvents.length === 0) return 'PARO';
    let lo = 0, hi = sortedEvents.length - 1, idx = -1;
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
    return idx === -1 ? sortedEvents[0].estado : sortedEvents[idx].estado;
  }

  const chartData = useMemo(() => {
    const series: { x: number; y: number }[] = [];
    if (startTimestamp > endTimestamp) return series;

    const sorted = [...events];
    const initialState = stateAt(sorted, startTimestamp);
    series.push({ x: startTimestamp, y: initialState === 'MARCHA' ? 1 : 0 });

    for (const ev of sorted) {
      const t = new Date(ev.hora).getTime();
      if (t >= startTimestamp && t <= endTimestamp) {
        series.push({ x: t, y: ev.estado === 'MARCHA' ? 1 : 0 });
      }
    }

    const finalState = stateAt(sorted, endTimestamp);
    series.push({ x: endTimestamp, y: finalState === 'MARCHA' ? 1 : 0 });

    series.sort((a, b) => a.x - b.x);
    return series;
  }, [events, startTimestamp, endTimestamp]);

  const clamp = (ms: number) =>
    Math.max(startTimestamp, Math.min(endTimestamp, ms));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging) return;
      const point = localPoint(e);
      if (!point) return;
      const ms = clamp(xScale.invert(point.x).getTime());
      if (dragging === 'x1') setSelectedX1(ms);
      else if (dragging === 'x2') setSelectedX2(ms);
    },
    [dragging, xScale, startTimestamp, endTimestamp]
  );

  const handleMouseUp = () => setDragging(null);

  const [hover, setHover] = useState<{ x: number; y: number; fecha: string; estado: string } | null>(null);

  const safeX1 = selectedX1 ?? startTimestamp;
  const safeX2 = selectedX2 ?? endTimestamp;

  const estadoX1 = stateAt(events, safeX1);
  const estadoX2 = stateAt(events, safeX2);

  const diffMs = Math.abs(safeX2 - safeX1);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
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

            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2, flexWrap: 'wrap' }}>
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

              {/* Textos a la derecha del botón */}
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, color: 'black' }}>
                  Línea negra: {estadoX1} | {new Date(safeX1).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: 'red' }}>
                  Línea roja: {estadoX2} | {new Date(safeX2).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
                {/* Solo el tiempo (HH:MM:SS) */}
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  {String(Math.floor(diffSec / 3600)).padStart(2, '0')}:
                  {String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0')}:
                  {String(diffSec % 60).padStart(2, '0')}
                </Typography>
              </Box>
            </Stack>

            {/* Gráfico visx */}
            <svg
              width={width}
              height={height}
              style={{ background: '#fff' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Group>
                <AxisBottom top={height - margin.bottom} scale={xScale} />
                <AxisLeft
                  left={margin.left}
                  scale={yScale}
                  tickFormat={(v) => (v === 1 ? 'MARCHA' : 'PARO')}
                />

                <LinePath
                  data={chartData}
                  x={(d) => xScale(new Date(d.x))}
                  y={(d) => yScale(d.y)}
                  stroke="#667eea"
                  strokeWidth={2}
                  curve={curveStepAfter}
                />

                {/* Líneas arrastrables (sobresalen por debajo) */}
                <line
                  x1={xScale(new Date(safeX1))}
                  x2={xScale(new Date(safeX1))}
                  y1={margin.top}
                  y2={height - margin.bottom + 10}
                  stroke="black"
                  strokeWidth={2}
                  cursor="ew-resize"
                  onMouseDown={() => setDragging('x1')}
                />
                <line
                  x1={xScale(new Date(safeX2))}
                  x2={xScale(new Date(safeX2))}
                  y1={margin.top}
                  y2={height - margin.bottom + 10}
                  stroke="red"
                  strokeWidth={2}
                  cursor="ew-resize"
                  onMouseDown={() => setDragging('x2')}
                />
              </Group>

              {/* Overlay para hover */}
              <rect
                x={margin.left}
                y={margin.top}
                width={width - margin.left - margin.right}
                height={height - margin.top - margin.bottom}
                fill="transparent"
                onMouseMove={(e) => {
                  const point = localPoint(e);
                  if (!point) return;
                  const msDate = xScale.invert(point.x);
                  const estado = stateAt(events, msDate.getTime());
                  setHover({
                    x: point.x,
                    y: point.y,
                    fecha: msDate.toLocaleString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                    estado,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              />

              {/* Tooltip hover */}
              {hover && (
                <text x={hover.x + 10} y={hover.y - 10} fontSize={12} fill="black">
                  {hover.estado} | {hover.fecha}
                </text>
              )}
            </svg>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}