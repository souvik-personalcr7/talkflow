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

export const uploadMessageImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/messages/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.url;
};

export const uploadMessageFile = async (file: File): Promise<{
  url: string;
  publicId: string;
  name: string;
  size: number;
  mimeType: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/messages/upload-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export default api;
