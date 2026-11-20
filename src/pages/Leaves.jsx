import { useState, useEffect } from 'react';
import { db, logAudit } from '../db/database';

export default function Leaves() {
  const [personnel, setPersonnel] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ personnelId: '', startDate: '', endDate: '', type: 'izin', note: '' });

  const load = async () => {
    setPersonnel(await db.personnel.filter(p => !p.archived).toArray());
    setLeaves(await db.leaves.toArray());
  };
  useEffect(() => { load(); }, []);

  async function addLeave(e) {
    e.preventDefault();
    if (!form.personnelId || !form.startDate || !form.endDate) return;
    await db.leaves.add({
      personnelId: Number(form.personnelId), startDate: form.startDate, endDate: form.endDate, type: form.type, note: form.note
    });
    await logAudit('İZİN_EKLE', `${form.personnelId} — ${form.startDate} / ${form.endDate}`);
    setForm({ personnelId: '', startDate: '', endDate: '', type: 'izin', note: '' });
    load();
  }

  async function removeLeave(id) {
    await db.leaves.delete(id);
    load();
  }

  const pMap = Object.fromEntries(personnel.map(p => [p.id, p]));

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>İzin / Rapor Ekle</h3>
        <form onSubmit={addLeave} className="space-y-2">
          <select className="input" value={form.personnelId} onChange={e => setForm({ ...form, personnelId: e.target.value })} required>
            <option value="">Personel seçin</option>
            {personnel.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sicil})</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
          </div>
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="izin">Yıllık İzin</option>
            <option value="rapor">Rapor</option>
            <option value="mazeret">Mazeret</option>
          </select>
          <input className="input" placeholder="Not (opsiyonel)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Ekle</button>
        </form>
      </div>
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Tanımlı İzinler ({leaves.length})</h3>
        <div className="space-y-2">
          {leaves.map(l => (
            <div key={l.id} className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{pMap[l.personnelId]?.name || 'Silinmiş'} — {l.type}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.startDate} → {l.endDate} {l.note && `(${l.note})`}</div>
              </div>
              <button onClick={() => removeLeave(l.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger)', color: '#fff' }}>Sil</button>
            </div>
          ))}
          {!leaves.length && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Kayıt yok</div>}
        </div>
      </div>
    </div>
  );
}