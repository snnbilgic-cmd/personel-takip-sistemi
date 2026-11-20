import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { dark, setDark } = useTheme();
  const nav = useNavigate();

  const links = [
    { to: '/kiosk', label: 'Kiosk' },
    { to: '/personnel', label: 'Personel' },
    { to: '/leaves', label: 'İzinler' },
    { to: '/corrections', label: 'Düzeltme' },
    { to: '/reports', label: 'Raporlar' },
    { to: '/settings', label: 'Ayarlar' }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <header className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Personel Takip</h1>
        <div className="flex gap-2">
          <button onClick={() => setDark(!dark)} className="px-3 py-1 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => nav('/login')} className="px-3 py-1 rounded-lg text-sm"
            style={{ background: 'var(--danger)', color: '#fff' }}>Çıkış</button>
        </div>
      </header>

      <nav className="flex overflow-x-auto gap-1 p-2 border-b" style={{ borderColor: 'var(--border)' }}>
        {links.map(l => (
          <NavLink key={l.to} to={l.to}
            className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)'
            })}>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}