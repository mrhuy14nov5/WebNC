import axios from 'axios';

/** Axios client for the Express API and cookie-based authentication. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    const csrf = document.cookie.split('; ').find((part) => part.startsWith('unimanage_csrf='))?.split('=').slice(1).join('=');
    if (csrf) config.headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }
  return config;
});

export default api;
