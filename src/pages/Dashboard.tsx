<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
  {/* Barra superior */}
  <Paper elevation={2} sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 1000, background: 'white' }}>
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Factory sx={{ fontSize: 32, color: '#2b6cb0' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
            EcoTrace
          </Typography>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-testid="button-logout"
            sx={{ color: '#2b6cb0', '&:hover': { backgroundColor: 'rgba(43, 108, 176, 0.1)' } }}
          >
            <Logout />
          </IconButton>
        </Tooltip>
      </Box>
    </Container>
  </Paper>

  {/* Contenedor principal flex */}
  <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', py: 4 }}>
    
    {/* Carrusel de máquinas */}
    <Box sx={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {/* Botón izquierda */}
      <IconButton
        onClick={prevMachine}
        sx={{ position: 'absolute', left: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
      >
        &#9664;
      </IconButton>

      {/* Imagen central */}
      <Card
        elevation={4}
        sx={{ width: { xs: '90%', md: '60%' }, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}
      >
        <CardActionArea onClick={handleMachineClick}>
          <CardMedia
            component="img"
            image={machines[currentMachine].imageUrl}
            alt={machines[currentMachine].name}
            sx={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </CardActionArea>
      </Card>

      {/* Botón derecha */}
      <IconButton
        onClick={nextMachine}
        sx={{ position: 'absolute', right: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
      >
        &#9654;
      </IconButton>
    </Box>

    {/* Sección IA abajo */}
    <Box sx={{ width: '100%', mt: 4 }}>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600 }}>
            Preguntar a la IA sobre las máquinas
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ color: '#4a5568', mb: 2 }}>
            Escribe preguntas generales, por ejemplo:  
            • ¿Cuánto tiempo estuvo parada la máquina 1 hoy?  
            • ¿Cuál fue la máquina con más producción esta semana?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe tu pregunta..."
            />
            <Button variant="contained" color="primary" onClick={handleAskAI}>
              Preguntar
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>

  </Container>
</Box>
