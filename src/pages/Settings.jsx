import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { db, logAudit } from '../db/database';
import { exportBackup, importBackup } from '../services/backup';

const COLORS = [
  { id: 'mint', label: 'Mint Yeşili', hex: '#a8d5ba' },
  { id: 'lavanta', label: 'Lavanta', hex: '#c3b1e1' },
  { id: 'seftali', label: 'Şeftali', hex: '#ffcba4' },
  { id: 'gokmavisi', label: 'Gök Mavisi', hex: '#a4c8e1' },
  { id: 'pudra', label: 'Pudra Pembesi', hex: '#e8b4b8' }
];

export default function Settings() {
  const { dark, setDark, color, setColor } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newSched, setNewSched] = useState({ name: '', startTime: '09:00', endTime: '18:00', toleranceLate: 15, toleranceEarly: 15 });
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const load = async () => {
    setSchedules(await db.schedules.toArray());
    setHolidays(await db.holidays.toArray());
  };
  useEffect(() => { load(); }, []);

  async function addSchedule(e) {
    e.preventDefault();
    await db.schedules.add({ ...newSched, toleranceLate: Number(newSched.toleranceLate), toleranceEarly: Number(newSched.toleranceEarly) });
    await logAudit('MESAİ_EKLE', newSched.name);
    setNewSched({ name: '', startTime: '09:00', endTime: '18:00', toleranceLate: 15, toleranceEarly: 15 });
    load();
  }

  async function addHoliday(e) {
    e.preventDefault();
    if (!newHoliday.date) return;
    await db.holidays.add({ ...newHoliday });
    setNewHoliday({ date: '', name: '' });
    load();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Tema</h3>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setDark(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: !dark ? 'var(--accent)' : 'var(--bg-primary)', color: !dark ? 'var(--accent-text)' : 'var(--text-secondary)' }}>☀️ Light</button>
          <button onClick={() => setDark(true)} className="px-4 py-2 rounded-lg text-sm" style={{ background: dark ? 'var(--accent)' : 'var(--bg-primary)', color: dark ? 'var(--accent-text)' : 'var(--text-secondary)' }}>🌙 Dark</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c.id} onClick={() => setColor(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border-2" style={{ background: c.hex, color: '#1a1a1a', borderColor: color === c.id ? '#1a1a1a' : 'transparent' }}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Mesai Kuralları</h3>
        <div className="space-y-2 mb-3">
          {schedules.map(s => (
            <div key={s.id} className="p-2 rounded text-sm" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <b>{s.name}</b> — {s.startTime} → {s.endTime} (Geç: {s.toleranceLate}dk, Erken: {s.toleranceEarly}dk)
            </div>
          ))}
        </div>
        <form onSubmit={addSchedule} className="space-y-2">
          <input className="input" placeholder="Kural Adı" value={newSched.name} onChange={e => setNewSched({ ...newSched, name: e.target.value })} required />
          <div className="flex gap-2">
            <input type="time" className="input" value={newSched.startTime} onChange={e => setNewSched({ ...newSched, startTime: e.target.value })} />
            <input type="time" className="input" value={newSched.endTime} onChange={e => setNewSched({ ...newSched, endTime: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <input type="number" className="input" placeholder="Geç tolerans (dk)" value={newSched.toleranceLate} onChange={e => setNewSched({ ...newSched, toleranceLate: e.target.value })} />
            <input type="number" className="input" placeholder="Erken tolerans (dk)" value={newSched.toleranceEarly} onChange={e => setNewSched({ ...newSched, toleranceEarly: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full">Mesai Kuralı Ekle</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Resmi Tatil / Hafta Sonu</h3>
        <div className="space-y-1 mb-3">
          {holidays.map(h => (
            <div key={h.id} className="flex justify-between text-sm p-1" style={{ color: 'var(--text-primary)' }}><span>{h.date}</span><span>{h.name}</span></div>
          ))}
        </div>
        <form onSubmit={addHoliday} className="flex gap-2">
          <input type="date" className="input" value={newHoliday.date} onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })} required />
          <input className="input" placeholder="Tatil adı" value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} />
          <button type="submit" className="btn-primary whitespace-nowrap">Ekle</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Yedekleme</h3>
        <div className="flex gap-2">
          <button onClick={exportBackup} className="btn-primary flex-1">📤 Yedek İndir</button>
          <label className="btn-primary flex-1 text-center cursor-pointer">
            📥 Yedek Yükle
            <input type="file" accept=".json" className="hidden" onChange={async (e) => {
              if (e.target.files[0] && confirm('Mevcut veriler silinip yedek yüklenecek. Emin misiniz?')) {
                await importBackup(e.target.files[0]);
                alert('Yedek yüklendi. Uygulama yeniden başlatılıyor...');
                window.location.reload();
              }
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}