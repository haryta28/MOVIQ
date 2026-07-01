import React, { createContext, useContext, useEffect, useState } from 'react';
import { currentUsers } from '../mock/mock';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gogig_user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('gogig_user', JSON.stringify(user));
    else localStorage.removeItem('gogig_user');
  }, [user]);

  const login = (role) => {
    const u = currentUsers[role];
    if (u) setUser(u);
    return u;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
