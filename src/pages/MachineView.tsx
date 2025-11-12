import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
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
  const [currentFrequency, setCurrentFrequency] = useState<number>(30); // valor actual del servidor
  const [newFrequency, setNewFrequency] = useState<number>(30); // valor que escribe el usuario

  useEffect(() => {
    // Aquí más adelante harás la llamada real al servidor para obtener el valor actual
    // Simulación: recibimos 30 segundos como valor inicial
    setCurrentFrequency(30);
    setNewFrequency(30);
  }, []);

  const handleApply = () => {
    // En el futuro: enviar newFrequency al servidor
    // De momento actualizamos el valor mostrado arriba
    setCurrentFrequency(newFrequency);
    console.log(`Nuevo valor aplicado: ${newFrequency} segundos`);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8f9fa', paddingY: 4 }}>
      <Container maxWidth="lg">
        {/* Valor actual + campo editable */}
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600, marginBottom: 1 }}>
            Frecuencia de envío de datos actual: <span style={{ color: '#2b6cb0' }}>{currentFrequency} segundos</span>
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
            <TextField
              type="number"
              value={newFrequency}
              onChange={(e) => setNewFrequency(Number(e.target.value))}
              inputProps={{
                min: 10,
                max: 86400, // 24h en segundos
              }}
              sx={{ width: 200 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleApply}
            >
              Aplicar
            </Button>
          </Box>
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