import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ItemList from './pages/ItemList';
import SellItem from './pages/SellItem';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ItemList />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/sell" element={<SellItem />} />
    </Routes>
  );
};

export default AppRoutes; 