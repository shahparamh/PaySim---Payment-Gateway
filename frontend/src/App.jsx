import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Transactions from './pages/Transactions';
import MyMethods from './pages/MyMethods';
import AddMethod from './pages/AddMethod';
import Profile from './pages/Profile';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantDeveloper from './pages/MerchantDeveloper';
import MerchantLinks from './pages/MerchantLinks';
import MerchantPayouts from './pages/MerchantPayouts';
import AdminDashboard from './pages/AdminDashboard';
import EcommerceDemo from './pages/EcommerceDemo';
import PaymentResult from './pages/PaymentResult';
import { Button } from './components/ui/Button';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import PayPage from './pages/PayPage';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Public Payment Link — no login required */}
          <Route path="/pay/:sessionId" element={<PayPage />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/make-payment" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/banking" element={<ProtectedRoute><MyMethods /></ProtectedRoute>} />
          <Route path="/banking/add" element={<ProtectedRoute><AddMethod /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* eCommerce Demo Routes */}
          <Route path="/ecommerce" element={<EcommerceDemo />} />
          <Route path="/ecommerce/:status" element={<PaymentResult />} />
          
          {/* Merchant & Admin Routes */}
          <Route path="/merchant/dashboard" element={<ProtectedRoute roles={['merchant']}><MerchantDashboard /></ProtectedRoute>} />
          <Route path="/merchant/developer" element={<ProtectedRoute roles={['merchant']}><MerchantDeveloper /></ProtectedRoute>} />
          <Route path="/merchant/links" element={<ProtectedRoute roles={['merchant']}><MerchantLinks /></ProtectedRoute>} />
          <Route path="/merchant/payouts" element={<ProtectedRoute roles={['merchant']}><MerchantPayouts /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6"><h1 className="text-9xl font-black italic text-primary mb-4 tracking-tighter opacity-20">404</h1><div className="text-center space-y-2"><p className="text-2xl font-black tracking-tight uppercase">Digital Void</p><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">The page you seek does not exist</p><Button onClick={() => window.location.href='/'} className="mt-8 px-8 py-4 rounded-2xl font-black tracking-widest text-xs shadow-xl shadow-primary/20 uppercase">Return Home</Button></div></div>} />
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
export default App;
