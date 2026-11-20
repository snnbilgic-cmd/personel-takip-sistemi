import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAdminPasswordSet, setAdminPassword, verifyAdminPassword } from '../db/database';

export default function Login() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSetup, setIsSetup] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => { isAdminPasswordSet().then(setup => setIsSetup(!setup)); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (password.length < 4) return setError('Parola en az 4 karakter olmalı');
      if (password !== confirm) return setError('Parolalar eşleşmiyor');
      await setAdminPassword(password);
      window.location.reload();
    } else {
      const ok = await verifyAdminPassword(password);
      if (!ok) return setError('Hatalı parola');
      nav('/kiosk');
    }
  }

  if (isSetup === null) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>
          {isSetup ? 'Yönetici Parolası Belirle' : 'Yönetici Girişi'}
        </h2>
        {error && <div className="text-sm p-2 rounded" style={{ background: '#fecaca', color: '#991b1b' }}>{error}</div>}
        <input type="password" placeholder="Parola" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
        {isSetup && <input type="password" placeholder="Parola (tekrar)" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" required />}
        <button type="submit" className="btn-primary w-full">{isSetup ? 'Parolayı Kaydet' : 'Giriş Yap'}</button>
      </form>
    </div>
  );
}