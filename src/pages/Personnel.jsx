import { useState, useEffect } from 'react';
import { db, archivePersonnel, logAudit } from '../db/database';
import { startNfc, stopNfc, checkNfc } from '../services/nfc';

export default function Personnel() {
  const [list, setList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({ name: '', sicil: '', department: '', cardUID: '', specialScheduleId: '' });
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setList(await db.personnel.filter(p => !p.archived).toArray());
    setSchedules(await db.schedules.toArray());
  };

  useEffect(() => { load(); }, []);

  async function addPerson(e) {
    e.preventDefault();
    if (!form.name || !form.sicil) return setMsg('Ad ve sicil zorunlu');
    if (form.cardUID) {
      const exists = await db.personnel.where('cardUID').equals(form.cardUID).first();
      if (exists) return setMsg('Bu kart başka personele atanmış!');
    }
    await db.personnel.add({
      name: form.name, sicil: form.sicil, department: form.department, cardUID: form.cardUID || null,
      specialScheduleId: form.specialScheduleId ? Number(form.specialScheduleId) : null, archived: false
    });
    await logAudit('PERSONEL_EKLE', form.name);
    setForm({ name: '', sicil: '', department: '', cardUID: '', specialScheduleId: '' });
    setMsg('Personel eklendi');
    load();
  }

  async function scanCard() {
    const s = await checkNfc();
    if (!s.supported || !s.enabled) return setMsg('NFC kullanılamıyor: ' + s.reason);
    setScanning(true);
    setMsg('Kartı okutun...');
    await startNfc(async (uid) => {
      setForm(f => ({ ...f, cardUID: uid }));
      setMsg(`Kart okundu: ${uid}`);
      setScanning(false);
      await stopNfc();
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Yeni Personel</h3>
        {msg && <div className="text-sm mb-2 p-2 rounded" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>{msg}</div>}
        <form onSubmit={addPerson} className="space-y-2">
          <input className="input" placeholder="Ad Soyad" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Sicil No" value={form.sicil} onChange={e => setForm({ ...form, sicil: e.target.value })} required />
          <input className="input" placeholder="Departman" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Kart UID" value={form.cardUID} onChange={e => setForm({ ...form, cardUID: e.target.value })} readOnly />
            <button type="button" onClick={scanCard} disabled={scanning} className="btn-primary whitespace-nowrap">{scanning ? 'Okutun...' : '📡 Kart Oku'}</button>
          </div>
          <select className="input" value={form.specialScheduleId} onChange={e => setForm({ ...form, specialScheduleId: e.target.value })}>
            <option value="">Varsayılan Mesai</option>
            {schedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>)}
          </select>
          <button type="submit" className="btn-primary w-full">Personel Ekle</button>
        </form>
      </div>
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Personel Listesi ({list.length})</h3>
        <div className="space-y-2">
          {list.map(p => (
            <div key={p.id} className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name} <span className="text-xs opacity-60">#{p.sicil}</span></div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.department || '—'} • Kart: {p.cardUID || 'atanmadı'}</div>
              </div>
              <button onClick={async () => { await archivePersonnel(p.id); load(); }} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger)', color: '#fff' }}>Arşivle</button>
            </div>
          ))}
          {!list.length && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Henüz personel yok</div>}
        </div>
      </div>
    </div>
  );
}