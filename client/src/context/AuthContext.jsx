import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    role: 'super_admin',
    name: 'Super Admin',
    email: 'admin@support.com',
    password: 'Admin@123',
    badge: 'Admin',
    description: 'Full system control, triage, reports & user management'
  },
  {
    role: 'engineer',
    name: 'Alex Rivera (Hardware)',
    email: 'hw.engineer@support.com',
    password: 'Engineer@123',
    badge: 'PC / Laptop Specialist',
    description: 'Hardware, Laptop, PC Diagnostics & Resolution'
  },
  {
    role: 'engineer',
    name: 'David Chen (Network)',
    email: 'net.engineer@support.com',
    password: 'Engineer@123',
    badge: 'Network Specialist',
    description: 'Wi-Fi, LAN, Subnet & Connectivity Triage'
  },
  {
    role: 'engineer',
    name: 'Elena Rostova (Printers)',
    email: 'print.engineer@support.com',
    password: 'Engineer@123',
    badge: 'Printer Specialist',
    description: 'Print queues, Scanner drivers & Toner hardware'
  },
  {
    role: 'client',
    name: 'John Miller (Operations)',
    email: 'client@company.com',
    password: 'Client@123',
    badge: 'Client / Employee',
    description: 'Raises tickets, monitors status, reopens issues'
  },
  {
    role: 'client',
    name: 'Sarah Jenkins (Finance)',
    email: 'sarah@company.com',
    password: 'Client@123',
    badge: 'Client (Finance Floor 2)',
    description: 'Raises department hardware & network issues'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session verify failed:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'super_admin';
  const isEngineer = user?.role === 'engineer';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isEngineer,
        isClient,
        demoAccounts: DEMO_ACCOUNTS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
