export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
export const AUTH_API = `${API_BASE}/auth`;

export const getAuthConfig = () => ({
  headers: { Authorization: localStorage.getItem('token') },
});
