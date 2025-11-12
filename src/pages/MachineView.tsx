import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
} from '@mui/material';

interface Event {
  id: number;
  status: string;
  datetime: string;
}

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [frequency, setFrequency] = useState(30); // frecuencia en segundos

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f8f9fa',
        paddingY: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Selector de frecuencia */}
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600, marginBottom: 1 }}>
            Frecuencia de envío de datos
          </Typography>
          <Select
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value={5}>Cada 5 segundos</MenuItem>
            <MenuItem value={30}>Cada 30 segundos</MenuItem>
            <MenuItem value={60}>Cada 1 minuto</MenuItem>
          </Select>
        </Box>

        {/* Lista de eventos */}
        <Card elevation={3} sx={{ borderRadius: 2, marginBottom: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ color: '#2b6cb0', fontWeight: 600, marginBottom: 2 }}>
              Eventos de la Máquina {machineId}
            </Typography>

            <Box
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              {events.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#718096', textAlign: 'center', padding: 2 }}>
                  No hay eventos disponibles todavía.
                </Typography>
              ) : (
                <List>
                  {events.map((event) => (
                    <ListItem key={event.id} divider>
                      <ListItemText
                        primary={`${event.status} — ${event.datetime}`}
                        primaryTypographyProps={{ sx: { color: '#2d3748', fontWeight: 500 } }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Apartado reservado para IA */}
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ color: '#2b6cb0', fontWeight: 600, marginBottom: 2 }}>
              Análisis con IA (próximamente)
            </Typography>
            <Typography variant="body2" sx={{ color: '#4a5568' }}>
              Aquí podrás preguntar cosas como: <br />
              • ¿Cuánto tiempo estuvo parada esta máquina hoy? <br />
              • ¿Cuántas veces se reinició esta máquina esta semana?
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
  }