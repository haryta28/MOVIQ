import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('moviq_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // hydrate if token exists but user doesn't
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
