export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': token ? `Bearer ${token}` : ''
}); 