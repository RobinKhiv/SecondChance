import axios from 'axios';

// Create axios instance with default config
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor with console logs
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for debugging
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log('Full error:', error);
      console.log('Response headers:', error.response?.headers);
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a function to get a fresh instance
export const getAxiosInstance = () => createAxiosInstance();

// Export a default instance
export default createAxiosInstance(); 