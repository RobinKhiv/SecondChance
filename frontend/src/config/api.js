export const API_URL = 'http://localhost:5001/api';

export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': token ? `Bearer ${token}` : ''
}); 