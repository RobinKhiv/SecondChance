import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Group all items-related API calls into a single object
export const itemsApi = {
  getItems: async (params) => {
    const response = await api.get('/api/items', { params });
    return response.data;
  },
  
  getItem: async (id) => {
    const response = await api.get(`/api/items/${id}`);
    return response.data;
  },
  
  createItem: async (itemData) => {
    const response = await api.post('/api/items', itemData);
    return response.data;
  },
  
  updateItem: async (id, itemData) => {
    const response = await api.put(`/api/items/${id}`, itemData);
    return response.data;
  },
  
  deleteItem: async (id) => {
    const response = await api.delete(`/api/items/${id}`);
    return response.data;
  },
  
  updateProfile: async (updates) => {
    const response = await api.put('/api/users/profile', updates);
    return response.data;
  }
};

// eslint-disable-next-line no-unused-vars
export const avatarOptions = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=2',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=1',
  'https://robohash.org/avatar1',
  'https://robohash.org/avatar2',
  'https://source.boringavatars.com/beam/120/1',
  'https://source.boringavatars.com/beam/120/2'
];

export default api; 