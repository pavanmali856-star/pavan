import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { MoviesPage } from '../pages/MoviesPage';
import { MovieDetailsPage } from '../pages/MovieDetailsPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminMoviesPage } from '../pages/admin/AdminMoviesPage';
import { AdminTheatersPage } from '../pages/admin/AdminTheatersPage';
import { useAuth } from '../state/auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <MoviesPage /> },
      { path: '/movies/:id', element: <MovieDetailsPage /> },
      {
        path: '/showtimes/:id/seats',
        element: (
          <RequireAuth>
            <SeatSelectionPage />
          </RequireAuth>
        ),
      },
      {
        path: '/checkout',
        element: (
          <RequireAuth>
            <CheckoutPage />
          </RequireAuth>
        ),
      },
      {
        path: '/me',
        element: (
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        ),
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        path: '/admin',
        element: (
          <RequireAuth>
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          </RequireAuth>
        ),
      },
      {
        path: '/admin/movies',
        element: (
          <RequireAuth>
            <RequireAdmin>
              <AdminMoviesPage />
            </RequireAdmin>
          </RequireAuth>
        ),
      },
      {
        path: '/admin/theaters',
        element: (
          <RequireAuth>
            <RequireAdmin>
              <AdminTheatersPage />
            </RequireAdmin>
          </RequireAuth>
        ),
      },
    ],
  },
]);

