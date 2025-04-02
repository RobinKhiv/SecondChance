import axios from 'axios';

// Create axios instance with default config
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to handle auth
  instance.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      console.log('Request config:', {
        url: config.url,
        method: config.method,
        hasToken: !!token
      });
      
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for errors
  instance.interceptors.response.use(
    response => response,
    error => {
      console.error('Response error:', error);
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a function to get a fresh instance
export const getAxiosInstance = () => createAxiosInstance();

// Export a default instance
export default createAxiosInstance(); 