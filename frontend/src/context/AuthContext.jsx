import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

/**
 * Decodes a JWT and checks if it is expired.
 * Returns true if expired or malformed, false if still valid.
 */
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // payload.exp is in seconds; Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Treat malformed tokens as expired
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('moviq_user');
    const token = localStorage.getItem('moviq_token');
    // Only restore session if token exists AND is not expired
    if (stored && token && !isTokenExpired(token)) {
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
