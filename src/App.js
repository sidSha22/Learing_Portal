import React, { useState } from 'react';
import { getSession, clearSession } from './utils/storage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import { ToastContainer } from './components/ToastContainer';
import { useToast } from './hooks/useToast';

export default function App() {
  const [user, setUser] = useState(() => getSession());
  const { toasts, toast } = useToast();

  const handleLogin = (u) => setUser(u);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    toast.info('Signed out successfully.');
  };

  return (
    <>
      {!user && <LoginPage onLogin={handleLogin} />}
      {user && user.role === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} toast={toast} />}
      {user && user.role !== 'admin' && <UserDashboard user={user} onLogout={handleLogout} toast={toast} />}
      <ToastContainer toasts={toasts} />
    </>
  );
}
