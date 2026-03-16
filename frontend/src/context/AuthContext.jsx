import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      // Re-hydrate profile if token exists but user state is lost
      api.get('/auth/profile')
        .then(res => {
          const userData = { ...res.data, token };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res; // Returns { success, message, data: { requires_otp, email, type } }
  };

  const verifyOtp = async (data) => {
    const res = await api.post('/auth/login/verify', data);
    const { token, user: userData } = res.data;
    const fullUser = { ...userData, token };
    setUser(fullUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(fullUser));
    return res;
  };

  const verifyRegistration = async (data) => {
    const res = await api.post('/auth/register/verify', data);
    const { token, user: userData } = res.data;
    const fullUser = { ...userData, token };
    setUser(fullUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(fullUser));
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, verifyRegistration, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
