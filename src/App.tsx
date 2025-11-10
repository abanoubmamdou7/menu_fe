
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';
import { adminRoutes } from './adminRoutes';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import Index from './pages/Index';
import Menu from './pages/Menu';
import NotFound from './pages/NotFound';
import Locations from './pages/Locations';
import Register from './pages/Register';

function AppContent() {
  useTheme(); // Apply theme across the application
  
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/register" element={<Register />} />
        {adminRoutes}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return <AppContent />;
}

export default App;
