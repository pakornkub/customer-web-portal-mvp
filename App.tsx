import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { useStore } from './store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { CreateOrder } from './pages/CreateOrder';
import { OrderDetail } from './pages/OrderDetail';
import { SaleReview } from './pages/SaleReview';
import { CSDashboard } from './pages/CSDashboard';
import { Logs } from './pages/Logs';
import { Admin } from './pages/Admin';
import { MasterData } from './pages/MasterData';
import { ClearData } from './pages/ClearData';
import { Role } from './types';

// Protected Route Component
const Protected = ({
  children,
  roles
}: {
  children: React.ReactNode;
  roles?: Role[];
}) => {
  const { currentUser } = useStore();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role))
    return <Navigate to="/" replace />;

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/orders"
          element={
            <Protected>
              <Orders />
            </Protected>
          }
        />
        <Route
          path="/orders/create"
          element={
            <Protected roles={[Role.MAIN_TRADER, Role.UBE_JAPAN, Role.ADMIN]}>
              <CreateOrder />
            </Protected>
          }
        />
        <Route
          path="/orders/edit/:orderNo"
          element={
            <Protected roles={[Role.MAIN_TRADER, Role.UBE_JAPAN, Role.ADMIN]}>
              <CreateOrder />
            </Protected>
          }
        />
        <Route
          path="/orders/:orderNo"
          element={
            <Protected>
              <OrderDetail />
            </Protected>
          }
        />

        <Route
          path="/review"
          element={
            <Protected roles={[Role.SALE, Role.SALE_MANAGER, Role.ADMIN]}>
              <SaleReview />
            </Protected>
          }
        />
        <Route
          path="/cs"
          element={
            <Protected roles={[Role.CS, Role.ADMIN]}>
              <CSDashboard />
            </Protected>
          }
        />

        <Route
          path="/admin"
          element={
            <Protected roles={[Role.ADMIN]}>
              <Admin />
            </Protected>
          }
        />
        <Route
          path="/master-data"
          element={
            <Protected roles={[Role.ADMIN]}>
              <MasterData />
            </Protected>
          }
        />
        <Route
          path="/logs"
          element={
            <Protected roles={[Role.ADMIN, Role.CS]}>
              <Logs />
            </Protected>
          }
        />
        <Route
          path="/clear-data"
          element={
            <Protected roles={[Role.ADMIN]}>
              <ClearData />
            </Protected>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
