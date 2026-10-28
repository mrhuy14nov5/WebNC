import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    setError('');
  }, []);

  useEffect(() => {
    api.get('/auth/csrf')
      .then(() => api.get('/auth/me'))
      .then(({ data }) => setUser(data.user))
      .catch((requestError) => {
        if (requestError.response?.status !== 401) {
          setError('Không thể kết nối máy chủ. Hãy kiểm tra backend và cấu hình cơ sở dữ liệu.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    setUser: updateUser,
    logout: async () => {
      await api.post('/auth/logout');
      updateUser(null);
    },
  }), [user, loading, error, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return context;
}
