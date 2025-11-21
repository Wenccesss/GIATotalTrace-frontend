import { useState, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Paper,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Snackbar,
} from "@mui/material";
import { Factory, Logout, ExpandMore, ArrowBack, ArrowForward } from "@mui/icons-material";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

import dashboardImage1 from "../attached_assets/generated_images/Imagen_Dashboard.jpg";
import dashboardImage2 from "../attached_assets/generated_images/Imagen_Dashboard.jpg";
import dashboardImage3 from "../attached_assets/generated_images/Imagen_Dashboard.jpg";

import useEmblaCarousel from "embla-carousel-react";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const machines = [
    {
      id: "1",
      name: "Máquina 1",
      description: "Centro de Mecanizado CNC",
      imageUrl: dashboardImage1,
      active: true,
    },
    {
      id: "2",
      name: "Máquina 2",
      description: "Robot Industrial",
      imageUrl: dashboardImage2,
      active: false,
    },
    {
      id: "3",
      name: "Máquina 3",
      description: "Torno CNC",
      imageUrl: dashboardImage3,
      active: false,
    },
  ];

  // Carrusel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const handleMachineClick = (machine: any) => {
    if (machine.active) {
      setLocation(`/machine/${machine.id}`);
    } else {
      setSnackbar({ open: true, message: `⚙️ ${machine.name} está en desarrollo` });
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      await response.json();
      onLogout();
    } catch {
      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)" }}>
      
      {/* BARRA SUPERIOR */}
      <Paper elevation={2} sx={{ borderRadius: 0, position: "sticky", top: 0, zIndex: 1000, background: "white" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Factory sx={{ fontSize: 32, color: "#2b6cb0" }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#2d3748" }}>
                EcoTrace
              </Typography>
            </Box>

            <Tooltip title="Cerrar sesión">
              <IconButton onClick={handleLogout} disabled={isLoggingOut} sx={{ color: "#2b6cb0" }}>
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Paper>

      {/* CONTENIDO */}
      <Container maxWidth="md">
        <Box sx={{ mt: 2, textAlign: "center" }}>

          {/* 🔵 CARRUSEL DE MÁQUINAS */}
          <Box sx={{ position: "relative" }}>
            <Box ref={emblaRef} sx={{ overflow: "hidden" }}>
              <Box sx={{ display: "flex" }}>
                {machines.map((m) => (
                  <Box
                    key={m.id}
                    sx={{
                      flex: "0 0 100%",
                      padding: 2,
                    }}
                    onClick={() => handleMachineClick(m)}
                  >
                    <Card
                      elevation={5}
                      sx={{
                        borderRadius: 3,
                        cursor: "pointer",
                        transition: "0.3s",
                        "&:hover": { transform: "scale(1.02)" },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={m.imageUrl}
                        alt={m.name}
                        sx={{
                          height: 250,
                          objectFit: "contain",
                          backgroundColor: "#f7fafc",
                          padding: 2,
                        }}
                      />
                      <CardContent>
                        <Typography variant="h5" fontWeight={700}>
                          {m.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {m.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* BOTONES DE NAVEGACIÓN */}
            <IconButton
              onClick={scrollPrev}
              sx={{ position: "absolute", top: "45%", left: -10, background: "white" }}
            >
              <ArrowBack />
            </IconButton>

            <IconButton
              onClick={scrollNext}
              sx={{ position: "absolute", top: "45%", right: -10, background: "white" }}
            >
              <ArrowForward />
            </IconButton>
          </Box>

          {/* 🔵 PANEL IA */}
          <Box sx={{ mt: 6 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Preguntar a la IA sobre las máquinas
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Escribe tu pregunta..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <Button variant="contained">Preguntar</Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: "" })}
      />
    </Box>
  );
}
