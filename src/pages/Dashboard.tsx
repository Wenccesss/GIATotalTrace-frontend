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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)" }}>
      
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
            <IconButton onClick={handleLogout} disabled={isLoggingOut} sx={{ color: "#2b6cb0" }}>
              <Logout />
            </IconButton>
          </Box>
        </Container>
      </Paper>

      {/* CONTENIDO CENTRAL */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* CARRUSEL */}
        <Box sx={{ width: "100%", flexGrow: 1, position: "relative" }}>
          <Box ref={emblaRef} sx={{ overflow: "hidden", height: "100%" }}>
            <Box sx={{ display: "flex", height: "100%" }}>
              {machines.map((m) => (
                <Box
                  key={m.id}
                  sx={{ flex: "0 0 100%", display: "flex", justifyContent: "center", alignItems: "center", padding: 2 }}
                  onClick={() => handleMachineClick(m)}
                >
                  <Card
                    elevation={5}
                    sx={{
                      borderRadius: 3,
                      cursor: "pointer",
                      width: "80%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": { transform: "scale(1.02)" },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={m.imageUrl}
                      alt={m.name}
                      sx={{
                        flexGrow: 1,
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

          {/* BOTONES */}
          <IconButton
            onClick={scrollPrev}
            sx={{ position: "absolute", top: "50%", left: 0, transform: "translate(-50%, -50%)", background: "white" }}
          >
            <ArrowBack />
          </IconButton>
          <IconButton
            onClick={scrollNext}
            sx={{ position: "absolute", top: "50%", right: 0, transform: "translate(50%, -50%)", background: "white" }}
          >
            <ArrowForward />
          </IconButton>
        </Box>
      </Box>

      {/* PANEL IA ABAJO */}
      <Container maxWidth="md" sx={{ mb: 4 }}>
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