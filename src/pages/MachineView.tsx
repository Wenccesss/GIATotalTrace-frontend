import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBack, InfoOutlined, AccessTime } from '@mui/icons-material';
import { useLocation } from 'wouter';

interface MachineViewProps {
  machineId: string;
}

export default function MachineView({ machineId }: MachineViewProps) {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
        paddingY: 4,
      }}
    >
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setLocation('/dashboard')}
          data-testid="button-back"
          sx={{
            marginBottom: 3,
            color: '#667eea',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          Volver al Dashboard
        </Button>

        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            padding: 4,
            marginBottom: 3,
            background: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              marginBottom: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              data-testid="text-machine-title"
              sx={{
                fontWeight: 600,
                color: '#2d3748',
              }}
            >
              Trazabilidad de Máquina {machineId}
            </Typography>
            <Chip
              icon={<InfoOutlined />}
              label="En Espera"
              color="default"
              data-testid="chip-machine-status"
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                paddingX: 1,
              }}
            />
          </Box>
          <Divider sx={{ marginY: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Centro de Mecanizado CNC
          </Typography>
        </Paper>

        <Card
          elevation={3}
          sx={{
            borderRadius: 2,
            marginBottom: 3,
          }}
        >
          <CardContent
            sx={{
              padding: 6,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 3,
                }}
              >
                <InfoOutlined
                  sx={{
                    fontSize: 60,
                    color: '#667eea',
                  }}
                />
              </Box>
              <Typography
                variant="h5"
                data-testid="text-no-data"
                sx={{
                  color: '#4a5568',
                  fontWeight: 500,
                  marginBottom: 1,
                }}
              >
                No hay datos disponibles
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#718096',
                  maxWidth: 500,
                  marginTop: 1,
                }}
              >
                Esta vista está preparada para recibir datos de trazabilidad en tiempo
                real desde el servidor. Los datos aparecerán aquí cuando estén
                disponibles.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AccessTime sx={{ fontSize: 20, color: '#a0aec0' }} />
          <Typography
            variant="body2"
            data-testid="text-timestamp"
            sx={{
              color: '#718096',
              fontFamily: 'Roboto Mono, monospace',
            }}
          >
            {formatDate(currentTime)} - {formatTime(currentTime)}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
