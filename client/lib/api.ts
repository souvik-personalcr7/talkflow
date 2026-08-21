import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 Unauthorized, automatically redirect to login
    // unless the request was made to the auth endpoints directly.
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url?.includes('/auth/login') &&
      !error.config.url?.includes('/auth/register')
    ) {
      if (typeof window !== 'undefined') {
        // We dispatch a custom event to notify our auth hooks to clear state securely
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
