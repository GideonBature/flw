import { useState } from 'react'
// eslint-disable-next-line no-unused-vars
import reactLogo from './assets/react.svg'
// eslint-disable-next-line no-unused-vars
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import PaymentForm from './components/PaymentForm';
import ComplaintForm from './components/ComplaintForm';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Container, CssBaseline } from '@mui/material';

function App() {
  // eslint-disable-next-line no-unused-vars
  const [count, setCount] = useState(0)
  const mockUserId = "64fd343abc01234567890123";
  const mockLawyerId = "64fd343abc98765432101234";

  return (
    <Router>
      <CssBaseline />
      <ToastContainer position="top-right" />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Routes>
            <Route 
              path="/" 
              element={<PaymentForm userId={mockUserId} lawyerId={mockLawyerId} />} 
            />
            <Route 
              path="/complaint/:transactionId" 
              element={<ComplaintForm />} 
            />
          </Routes>
        </Box>
      </Container>
    </Router>
  );
}

export default App
