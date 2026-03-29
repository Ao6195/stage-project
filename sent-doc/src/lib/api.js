export const API_BASE = 'http://localhost:5000/api';
export const AUTH_API = `${API_BASE}/auth`;

export const getAuthConfig = () => ({
  headers: { Authorization: localStorage.getItem('token') },
});
