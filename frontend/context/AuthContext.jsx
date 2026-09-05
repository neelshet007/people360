import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredToken,
  login as apiLogin,
  ROLES,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  // Sync state if localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(getStoredToken());
      setUser(getStoredUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;
    const permissions = user.permissions || [];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasAnyRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    employeeId: user?.employeeId || null,
    permissions: user?.permissions || [],
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
