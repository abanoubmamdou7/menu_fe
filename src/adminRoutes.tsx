// src/adminRoutes.tsx
import React from 'react';
import { Route } from 'react-router-dom';

import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminMenuItems from './pages/AdminMenuItems';
import AdminCategories from './pages/AdminCategories';
import AdminLocations from './pages/AdminLocations';
import AdminSocialLinks from './pages/AdminSocialLinks';
import AdminRestaurantInfo from './pages/AdminRestaurantInfo';
import AdminCustomers from './pages/AdminCustomers';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin.tsx';
import AdminTagsPage from './pages/AdminTagsPage.tsx';

export const adminRoutes = (
  <>
    <Route path="/admin/login" element={<AdminLogin />} />

    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminMenuItems />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="locations" element={<AdminLocations />} />
      <Route path="social-links" element={<AdminSocialLinks />} />
      <Route path="restaurant-info" element={<AdminRestaurantInfo />} />
      <Route path="tags" element={<AdminTagsPage/>} />
      <Route path="customers" element={<AdminCustomers />} />
    </Route>
  </>
);
