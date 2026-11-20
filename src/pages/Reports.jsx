import { useState } from 'react';
import { exportPDF, exportExcel } from '../services/export';

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const first = new Date(); first.setDate(1);
  const [start, setStart] = useState(first.toISOString().slice(0, 10));
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState('');

  async function doExport(type) {
    setLoading(type);
    try {
      if (type === 'pdf') await exportPDF(start, end);
      else await exportExcel(start, end);
    } catch (e) { alert('Hata: ' + e.message); }
    setLoading('');
  }

  return (
    <div className="card max-w-md space-y-4">
      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Rapor Al</h3>
      <div>
        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Başlangıç</label>
        <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
      </div>
      <div>
        <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Bitiş</label>
        <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => doExport('pdf')} disabled={!!loading} className="btn-primary flex-1">{loading === 'pdf' ? '...' : '📄 PDF'}</button>
        <button onClick={() => doExport('excel')} disabled={!!loading} className="btn-primary flex-1">{loading === 'excel' ? '...' : '📊 Excel'}</button>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Rapor, seçilen tarih aralığındaki tüm giriş-çıkışları ve izin durumlarını içerir.</p>
    </div>
  );
}