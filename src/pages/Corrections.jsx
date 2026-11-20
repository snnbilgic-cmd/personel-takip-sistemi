import { useState, useEffect } from 'react';
import { db, logAudit } from '../db/database';

export default function Corrections() {
  const [openRecords, setOpenRecords] = useState([]);
  const [personnel, setPersonnel] = useState([]);

  const load = async () => {
    const recs = await db.records.filter(r => r.status === 'open').toArray();
    setOpenRecords(recs);
    setPersonnel(await db.personnel.toArray());
  };
  useEffect(() => { load(); }, []);

  async function closeRecord(id, time) {
    if (!time) return;
    await db.records.update(id, { checkOut: time, status: 'closed', manualCorrected: true });
    await logAudit('MANUEL_DÜZELTME', `Kayıt ${id} → Çıkış: ${time}`);
    load();
  }

  async function cancelRecord(id) {
    await db.records.update(id, { status: 'cancelled', manualCorrected: true });
    await logAudit('KAYIT_İPTAL', `Kayıt ${id} iptal edildi`);
    load();
  }

  const pMap = Object.fromEntries(personnel.map(p => [p.id, p]));

  return (
    <div className="card max-w-2xl">
      <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Açık Girişler (Çıkış Unutulan)</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Çıkış okutulmamış kayıtlar. Manuel çıkış saati girebilir veya kaydı iptal edebilirsiniz.</p>
      <div className="space-y-2">
        {openRecords.map(r => (
          <div key={r.id} className="p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{pMap[r.personnelId]?.name || '—'}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.date} — Giriş: {r.checkIn}</div>
              </div>
              <div className="flex gap-2 items-center">
                <input type="time" id={`t-${r.id}`} className="input w-28" style={{ padding: '4px 8px' }} />
                <button onClick={() => closeRecord(r.id, document.getElementById(`t-${r.id}`).value)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>Çıkış Gir</button>
                <button onClick={() => cancelRecord(r.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger)', color: '#fff' }}>İptal</button>
              </div>
            </div>
          </div>
        ))}
        {!openRecords.length && <div className="text-sm p-4 text-center" style={{ color: 'var(--text-secondary)' }}>✅ Açık giriş yok</div>}
      </div>
    </div>
  );
}