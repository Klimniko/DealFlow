import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { AppLayout } from '../components/ui/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { OrganizationsList } from '../pages/Organizations/OrganizationsList';
import { OrganizationDetail } from '../pages/Organizations/OrganizationDetail';
import { RfxList } from '../pages/Rfx/RfxList';
import { RfxDetail } from '../pages/Rfx/RfxDetail';
import { ForbiddenPage } from '../pages/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          {
            path: 'organizations',
            element: <ProtectedRoute requiredPermission="rfx.view_own" />,
            children: [
              { index: true, element: <OrganizationsList /> },
              { path: ':organizationId', element: <OrganizationDetail /> },
            ],
          },
          {
            path: 'rfx',
            element: <ProtectedRoute requiredPermission="rfx.view_own" />,
            children: [
              { index: true, element: <RfxList /> },
              { path: ':rfxId', element: <RfxDetail /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
