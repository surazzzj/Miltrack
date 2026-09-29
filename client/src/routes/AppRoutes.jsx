import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PurchasesPage } from '../pages/PurchasesPage';
import { TransfersPage } from '../pages/TransfersPage';
import { AssignmentsPage } from '../pages/AssignmentsPage';
import { EquipmentPage } from '../pages/EquipmentPage';
import { BasesPage } from '../pages/BasesPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { UsersPage } from '../pages/UsersPage';
import { SettingsPage } from '../pages/SettingsPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="bases" element={<BasesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />

        {/* Admin-only route */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="settings" element={<SettingsPage />} />
        <Route path="forbidden" element={<ForbiddenPage />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
