import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('moviq_user');
    const token = localStorage.getItem('moviq_token');
    // Only trust stored user if a matching token also exists.
    // This clears stale state from earlier mock-only sessions.
    if (stored && token) {
      try { return JSON.parse(stored); } catch (_) { /* fallthrough */ }
    }
    localStorage.removeItem('moviq_user');
    localStorage.removeItem('moviq_token');
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have a token but no user, hydrate. If /auth/me fails, clear everything.
    const token = localStorage.getItem('moviq_token');
    if (token && !user) {
      api.get('/auth/me')
        .then((r) => {
          setUser(r.data);
          localStorage.setItem('moviq_user', JSON.stringify(r.data));
        })
        .catch(() => {
          localStorage.removeItem('moviq_token');
          localStorage.removeItem('moviq_user');
          setUser(null);
        });
    }
     
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('moviq_token', data.token);
      localStorage.setItem('moviq_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moviq_token');
    localStorage.removeItem('moviq_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
