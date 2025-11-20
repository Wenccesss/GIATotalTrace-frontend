import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useLocation } from 'wouter';

import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { LinePath } from '@visx/shape';
import { localPoint } from '@visx/event';
import { Group } from '@visx/group';
import { curveStepAfter } from 'd3-shape';

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  // Estado para el Dialog
  const [openDialog, setOpenDialog] = useState(false);

  const handleFilter = () => {
    if (!startDateInput || !endDateInput) {
      setOpenDialog(true);
      return;
    }

    const startLocalMs = new Date(startDateInput).getTime();
    const endLocalMs = new Date(endDateInput).getTime();

    setStartMs(startLocalMs);
    setEndMs(endLocalMs);
    fetchEvents(startLocalMs, endLocalMs);

    setSelectedX1(startLocalMs);
    setSelectedX2(endLocalMs);
  };

  useEffect(() => {
    if (selectedX1 === null && startTimestamp) {
      setSelectedX1(startTimestamp);
    }
    if (selectedX2 === null && endTimestamp) {
      setSelectedX2(endTimestamp);
    }
  }, [startTimestamp, endTimestamp, selectedX1, selectedX2]);

  // 🔧 ResizeObserver + useMediaQuery
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 400;

  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:1024px)');

  const margin = {
    top: 20,
    bottom: 40,
    left: isMobile ? 60 : isTablet ? 80 : 100,
    right: isMobile ? 60 : isTablet ? 80 : 100,
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  // 🔧 Zoom progresivo (concatenable)
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (startTimestamp && endTimestamp) {
      setCurrentRange([startTimestamp, endTimestamp]);
    }
  }, [startTimestamp, endTimestamp]);

  const handleZoomIn = () => {
    if (selectedX1 && selectedX2) {
      setCurrentRange([selectedX1, selectedX2]);
    }
  };

  const handleZoomOut = () => {
    setCurrentRange([startTimestamp, endTimestamp]);
  };

  const xScale = useMemo(() => {
    if (!currentRange) {
      return scaleTime({ domain: [new Date(), new Date()], range: [margin.left, width - margin.right] });
    }
    return scaleTime({
      domain: [new Date(currentRange[0]), new Date(currentRange[1])],
      range: [margin.left, width - margin.right],
    });
  }, [currentRange, width, margin.left, margin.right]);

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 1],
        range: [height - margin.bottom, margin.top],
      }),
    [height, margin.top, margin.bottom]
  );

  function stateAt(sortedEvents: Event[], ms: number): 'MARCHA' | 'PARO' | null {
    if (sortedEvents.length === 0) return null;
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
    if (!currentRange || events.length === 0) return [];
    const series: { x: number; y: number }[] = [];
    const sorted = [...events];

    const zoomStart = currentRange[0];
    const zoomEnd = currentRange[1];

    const initialState = stateAt(sorted, zoomStart);
    if (initialState) {
      series.push({ x: zoomStart, y: initialState === 'MARCHA' ? 1 : 0 });
    }

    for (const ev of sorted) {
      const t = new Date(ev.hora).getTime();
      if (t >= zoomStart && t <= zoomEnd) {
        series.push({ x: t, y: ev.estado === 'MARCHA' ? 1 : 0 });
      }
    }

    const finalState = stateAt(sorted, zoomEnd);
    if (finalState) {
      series.push({ x: zoomEnd, y: finalState === 'MARCHA' ? 1 : 0 });
    }

    series.sort((a, b) => a.x - b.x);
    return series;
  }, [events, currentRange]);

  const clamp = (ms: number) =>
    currentRange ? Math.max(currentRange[0], Math.min(currentRange[1], ms)) : ms;

  const handleTouchStart = (line: 'x1' | 'x2') => {
  setDragging(line);
};

const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
  e.preventDefault(); // 🔧 evita scroll durante el arrastre
  if (!dragging || !currentRange) return;
  const touch = e.touches[0];
  if (!touch) return;
  const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const ms = clamp(xScale.invert(x).getTime());
  if (dragging === 'x1') setSelectedX1(ms);
  else if (dragging === 'x2') setSelectedX2(ms);
};

const handleTouchEnd = () => setDragging(null);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging || !currentRange) return;
      const point = localPoint(e);
      if (!point) return;
      const ms = clamp(xScale.invert(point.x).getTime());
      if (dragging === 'x1') setSelectedX1(ms);
      else if (dragging === 'x2') setSelectedX2(ms);
    },
    [dragging, xScale, currentRange]
  );

  const handleMouseUp = () => setDragging(null);

  const [hover, setHover] = useState<{ x: number; y: number; fecha: string; estado: string } | null>(null);

  const safeX1 = selectedX1 ?? (currentRange ? currentRange[0] : startTimestamp);
  const safeX2 = selectedX2 ?? (currentRange ? currentRange[1] : endTimestamp);

  const estadoX1 = stateAt(events, safeX1);
  const estadoX2 = stateAt(events, safeX2);

  const diffMs = Math.abs(safeX2 - safeX1);
  const diffSec = Math.floor(diffMs / 1000);

  // 🔧 límite de 3 meses atrás
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // --- Exportar CSV ---
  const exportCSV = () => {
    if (!events.length) return;
    const header = "id,estado,hora\n";
    const rows = events.map(ev => `${ev.id},${ev.estado},${ev.hora}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `trazabilidad_${machineId}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Exportar PDF ---
  const exportPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "pt", "a4"); // orientación horizontal
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save(`trazabilidad_${machineId}_${new Date().toISOString()}.pdf`);
  };

  // 🔧 Generar ticks adaptativos
  const tickValues = useMemo(() => {
  const ticks: Date[] = [];
  const start = new Date(currentRange?.[0] ?? Date.now());
  const end = new Date(currentRange?.[1] ?? Date.now());

  const desiredTicks = width < 600 ? 6 : width < 1024 ? 12 : 20;
  const diff = end.getTime() - start.getTime();
  if (diff <= 0) return ticks; // 🔧 evita step=0 o negativo

  const step = diff / desiredTicks;

  for (let t = start.getTime(); t <= end.getTime(); t += step) {
    ticks.push(new Date(t));
  }
  return ticks;
}, [currentRange, width]);

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
          <CardContent sx={{ p: 0 }}>
            <Typography
              variant="h5"
              align="center"
              sx={{ color: '#2b6cb0', fontWeight: 600, mb: 2 }}
            >
              TRAZABILIDAD MAQUINA-1
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="center"
              sx={{ mb: 2, flexWrap: 'wrap', textAlign: 'center', width: '100%' }}
            >
              <TextField
                label="Inicio"
                type="datetime-local"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: threeMonthsAgo.toISOString().slice(0,16),
                  max: new Date().toISOString().slice(0,16),
                }}
                onKeyDown={(e) => e.preventDefault()} // 🔒 bloquea escritura manual
              />

              <TextField
                label="Fin"
                type="datetime-local"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!startDateInput}
                inputProps={{
                  min: startDateInput || threeMonthsAgo.toISOString().slice(0,16),
                  max: new Date().toISOString().slice(0,16),
                }}
                onKeyDown={(e) => e.preventDefault()} // 🔒 bloquea escritura manual
              />

              <Button variant="contained" color="primary" onClick={handleFilter}>
                Filtrar
              </Button>

              <Button variant="outlined" onClick={handleZoomIn} sx={{ ml: 2 }}>
                Zoom In
              </Button>
              <Button variant="outlined" onClick={handleZoomOut} sx={{ ml: 2 }}>
                Zoom Out
              </Button>

              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, color: 'black' }}>
                  {estadoX1 ?? 'Sin estado'} | {new Date(safeX1).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: 'red' }}>
                  {estadoX2 ?? 'Sin estado'} | {new Date(safeX2).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
                <Typography sx={{ mt: 1, fontWeight: 600 }}>
                  {String(Math.floor(diffSec / 3600)).padStart(2, '0')}:
                  {String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0')}:
                  {String(diffSec % 60).padStart(2, '0')}
                </Typography>

                {/* Botones de exportación CSV y PDF */}
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button variant="contained" color="primary" onClick={exportCSV}>
                    CSV
                  </Button>
                  <Button variant="contained" color="primary" onClick={exportPDF}>
                    PDF
                  </Button>
                </Stack>
              </Box>
            </Stack>

            <Box ref={chartRef} sx={{ width: '100%' }}>
              <svg
                width={width}
                height={height}
                style={{ background: '#fff', touchAction: 'none' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchMove={handleTouchMove}   // 👈 soporte móvil
                onTouchEnd={handleTouchEnd}     // 👈 soporte móvil
              >
                <Group>
                  {/* 🔧 Eje inferior con ticks adaptativos */}
                  <AxisBottom
                    top={height - margin.bottom}
                    scale={xScale}
                    tickValues={tickValues}
                    tickFormat={(d) =>
                      new Date(d as Date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    }
                  />

                  <AxisLeft
                    left={margin.left}
                    scale={yScale}
                    tickValues={[0, 1]}
                    tickFormat={(v) => (v === 1 ? 'MARCHA' : v === 0 ? 'PARO' : '')}
                  />

                  <LinePath
                    data={chartData}
                    x={(d) => xScale(new Date(d.x))}
                    y={(d) => yScale(d.y)}
                    stroke="#667eea"
                    strokeWidth={2}
                    curve={curveStepAfter}
                  />
                  <line
                    x1={xScale(new Date(safeX1))}
                    x2={xScale(new Date(safeX1))}
                    y1={margin.top}
                    y2={height - margin.bottom + 10}
                    stroke="black"
                    strokeWidth={2}
                    cursor="ew-resize"
                    onMouseDown={() => setDragging('x1')}
                    onTouchStart={() => handleTouchStart('x1')} // 👈 soporte móvil
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
                    onTouchStart={() => handleTouchStart('x2')} // 👈 soporte móvil
                  />
                </Group>

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
                      estado: estado ?? 'Sin estado',
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />

                {hover && (
                  <text x={hover.x + 10} y={hover.y - 10} fontSize={12} fill="black">
                    {hover.estado} | {hover.fecha}
                  </text>
                )}
              </svg>
            </Box>

            {/* Dialog de validación */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
              <DialogTitle>Atención</DialogTitle>
              <DialogContent>
                Debes seleccionar un rango de fechas antes de filtrar.
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Aceptar</Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}