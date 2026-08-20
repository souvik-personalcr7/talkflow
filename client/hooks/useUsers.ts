import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { User } from '../types';

export const useUsers = (searchQuery: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (searchQuery.trim().length > 0) {
        res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        res = await api.get('/users');
      }
      
      if (res.data.success) {
        setUsers(res.data.data.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, fetchUsers };
};
