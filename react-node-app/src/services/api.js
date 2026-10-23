import axios from 'axios';

/** Axios client configured for the NestJS API and httpOnly-cookie authentication. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;
