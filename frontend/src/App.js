import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landlords from './pages/Landlords';
import Properties from './pages/Properties';
import Rooms from './pages/Rooms';
import './styles/App.css';
import Meters from './pages/Meters';
import Readings from './pages/Readings';
import Bills from './pages/Bills';
import Reports from './pages/Reports';
//import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/landlords" element={
            <PrivateRoute>
              <Landlords />
            </PrivateRoute>
          } />
          
          <Route path="/properties" element={
            <PrivateRoute>
              <Properties />
            </PrivateRoute>
          } />
          
          <Route path="/rooms" element={
            <PrivateRoute>
              <Rooms />
            </PrivateRoute>
          } />
          <Route path="/meters" element={
            <PrivateRoute>
                <Meters />
            </PrivateRoute>
            } />

            <Route path="/readings" element={
            <PrivateRoute>
                <Readings />
            </PrivateRoute>
            } />

            <Route path="/bills" element={
            <PrivateRoute>
                <Bills />
            </PrivateRoute>
            } />

            <Route path="/reports" element={
            <PrivateRoute>
                <Reports />
            </PrivateRoute>
            } />
          
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;