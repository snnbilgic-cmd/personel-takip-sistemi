import { useState, useEffect, useCallback } from 'react';
import { checkNfc, startNfc, stopNfc } from '../services/nfc';
import { playBip } from '../services/audio';
import { db, getTodaySummary, logAudit } from '../db/database';

export default function Kiosk() {
  const [now, setNow] = useState(new Date());
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState({ inside: 0, notArrived: 0, earlyOut: 0, onLeave: 0, total: 0 });
  const [nfcState, setNfcState] = useState({ supported: false, enabled: false, reason: '' });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getTodaySummary().then(setSummary);
    const t = setInterval(() => getTodaySummary().then(setSummary), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await checkNfc();
      setNfcState(s);
      if (s.supported && s.enabled) {
        await startNfc(handleTag);
      }
    })();
    return () => { stopNfc(); };
  }, []);

  const handleTag = useCallback(async (uid) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5);

    const person = await db.personnel.where('cardUID').equals(uid).first();
    if (!person) {
      playBip('error');
      setFeedback({ type: 'error', msg: 'Tanımsız Kart', detail: uid });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const leaves = await db.leaves.toArray();
    const onLeave = leaves.some(l => l.personnelId === person.id && l.startDate <= today && l.endDate >= today);
    if (onLeave) {
      playBip('warning');
      setFeedback({ type: 'warning', msg: 'İzinli Personel', detail: person.name });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const holiday = await db.holidays.where('date').equals(today).first();
    let rec = await db.records.where({ personnelId: person.id, date: today }).first();

    if (!rec) {
      const schedId = await db.settings.get('defaultScheduleId');
      const sched = schedId ? await db.schedules.get(schedId.value) : null;
      let status = 'closed';

      if (sched && !holiday) {
        const [sh, sm] = sched.startTime.split(':').map(Number);
        const [ch, cm] = time.split(':').map(Number);
        const diff = (ch * 60 + cm) - (sh * 60 + sm);
        if (diff > (sched.toleranceLate || 15)) status = 'late';
      }

      await db.records.add({
        personnelId: person.id, date: today, checkIn: time, checkOut: null,
        status: 'open', lateFlag: status === 'late', manualCorrected: false
      });

      playBip(status === 'late' ? 'warning' : 'success');
      setFeedback({ type: status === 'late' ? 'warning' : 'success', msg: status === 'late' ? 'Geç Giriş' : 'Giriş Kaydedildi', detail: person.name, time });
    } else if (!rec.checkOut) {
      await db.records.update(rec.id, { checkOut: time, status: 'closed' });
      playBip('success');
      setFeedback({ type: 'success', msg: 'Çıkış Kaydedildi', detail: person.name, time });
    } else {
      playBip('warning');
      setFeedback({ type: 'warning', msg: 'Kayıt Tamamlanmış', detail: person.name, time });
    }

    await logAudit('NFC_OKUTMA', `${person.name} — ${uid} — ${time}`);
    getTodaySummary().then(setSummary);
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  const bg = feedback?.type === 'success' ? 'bg-green-600' : feedback?.type === 'warning' ? 'bg-yellow-600' : feedback?.type === 'error' ? 'bg-red-600' : '';

  return (
    <div className={`min-h-[80vh] flex flex-col rounded-xl transition-colors duration-300 ${bg}`} style={!bg ? { background: 'var(--bg-secondary)' } : {}}>
      <div className="flex flex-wrap justify-around gap-2 p-3 text-sm rounded-t-xl" style={{ background: 'rgba(0,0,0,0.15)', color: feedback ? '#fff' : 'var(--text-primary)' }}>
        <span>İçeride: <b>{summary.inside}</b></span>
        <span>Gelmedi: <b>{summary.notArrived}</b></span>
        <span>Erken Çıktı: <b>{summary.earlyOut}</b></span>
        <span>İzinli: <b>{summary.onLeave}</b></span>
        <span>Toplam: <b>{summary.total}</b></span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-6xl font-mono font-bold" style={{ color: feedback ? '#fff' : 'var(--text-primary)' }}>{now.toLocaleTimeString('tr-TR')}</div>
        <div className="text-xl mt-2" style={{ color: feedback ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
          {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {feedback && (
          <div className="mt-8 text-center text-white">
            <div className="text-3xl font-bold">{feedback.msg}</div>
            {feedback.detail && <div className="text-xl mt-1">{feedback.detail}</div>}
            {feedback.time && <div className="text-lg mt-1 opacity-80">{feedback.time}</div>}
          </div>
        )}
        {!feedback && nfcState.supported && !nfcState.enabled && (
          <div className="mt-6 text-yellow-500 text-center text-lg">⚠️ NFC kapalı. Lütfen telefon ayarlarından NFC'yi açın.</div>
        )}
        {!nfcState.supported && (
          <div className="mt-6 text-red-400 text-center">Bu cihazda NFC desteklenmiyor veya web modundasınız.</div>
        )}
      </div>
      <div className="p-4 text-center text-sm" style={{ color: feedback ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)' }}>Kartınızı telefonun arka üst kısmına yaklaştırın</div>
    </div>
  );
}