/**
 * Auth Helpers — Centralized Authentication & RBAC Support
 * Owner: Shared Application Foundation
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Login via real backend API.
 * Stores token and user info on success.
 */
export const login = async (email, password) => {
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Login failed');
  }

  const { token, user } = data.data;
  setStoredToken(token);
  setStoredUser(user);
  return { token, user };
};

export const logout = () => {
  clearStoredToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/** Permission checking helpers */
export const hasPermission = (permission, user = getStoredUser()) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  const permissions = user.permissions || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
};

export const hasAnyRole = (roles = [], user = getStoredUser()) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return roles.includes(user.role);
};

export const isHRRole = (user = getStoredUser()) => {
  if (!user) return false;
  return [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER].includes(user.role);
};

export const isPayrollRole = (user = getStoredUser()) => {
  if (!user) return false;
  return [ROLES.ADMIN, ROLES.HR_PAYROLL_USER, ROLES.HR_PAYROLL_MANAGER].includes(user.role);
};
