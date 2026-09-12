import { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Login from './pages/Login';
import ParentHome from './pages/ParentHome';
import Review from './pages/Review';
import SessionDetail from './pages/SessionDetail';
import Sessions from './pages/Sessions';
import StudentDetail from './pages/StudentDetail';
import StudentNew from './pages/StudentNew';
import Students from './pages/Students';
import { useCurrentUser } from './store/useStore';
import { Role } from './types';

function Guard(props: { children: ReactNode; roles?: Role[] }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (props.roles && !props.roles.includes(user.role)) {
    return <Navigate to={user.role === 'parent' ? '/parent' : '/'} replace />;
  }
  return <Layout>{props.children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard roles={['coach', 'frontdesk', 'manager']}><Dashboard /></Guard>} />
        <Route path="/students" element={<Guard roles={['coach', 'frontdesk', 'manager']}><Students /></Guard>} />
        <Route path="/students/new" element={<Guard roles={['coach']}><StudentNew /></Guard>} />
        <Route path="/students/:id" element={<Guard roles={['coach', 'frontdesk', 'manager']}><StudentDetail /></Guard>} />
        <Route path="/sessions" element={<Guard roles={['coach', 'frontdesk', 'manager']}><Sessions /></Guard>} />
        <Route path="/sessions/:id" element={<Guard roles={['coach', 'frontdesk', 'manager']}><SessionDetail /></Guard>} />
        <Route path="/incidents" element={<Guard roles={['coach', 'frontdesk', 'manager']}><Incidents /></Guard>} />
        <Route path="/review" element={<Guard roles={['manager']}><Review /></Guard>} />
        <Route path="/parent" element={<Guard roles={['parent']}><ParentHome /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
