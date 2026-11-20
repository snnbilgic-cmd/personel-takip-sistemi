import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Kiosk from './pages/Kiosk';
import Personnel from './pages/Personnel';
import Leaves from './pages/Leaves';
import Corrections from './pages/Corrections';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useEffect, useState } from 'react';
import { initDefaults, isAdminPasswordSet } from './db/database';

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    (async () => {
      await initDefaults();
      setHasAuth(await isAdminPasswordSet());
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Yükleniyor...</div>;
  }

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={hasAuth ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/kiosk" />} />
            <Route path="kiosk" element={<Kiosk />} />
            <Route path="personnel" element={<Personnel />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="corrections" element={<Corrections />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}