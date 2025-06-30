import React from 'react';
import { Container, Typography, Box } from '@mui/material';

function Reports() {
  return (
    <Container component="main" maxWidth="xl">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Reports
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          View usage statistics and other library reports.
        </Typography>
      </Box>
    </Container>
  );
}

export default Reports;
