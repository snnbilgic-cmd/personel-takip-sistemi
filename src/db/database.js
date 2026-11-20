import Dexie from 'dexie';

export const db = new Dexie('PersonelTakipDB');

db.version(1).stores({
  personnel: '++id, name, sicil, department, cardUID, specialScheduleId, archived',
  records: '++id, personnelId, date, checkIn, checkOut, status, manualCorrected',
  schedules: '++id, name, startTime, endTime, toleranceLate, toleranceEarly',
  leaves: '++id, personnelId, startDate, endDate, type, note',
  holidays: '++id, date, name',
  settings: '&key',
  auditLog: '++id, action, detail, timestamp'
});

export async function setAdminPassword(password) {
  const hash = await sha256(password + 'SALT_2026');
  await db.settings.put({ key: 'adminHash', value: hash });
}

export async function verifyAdminPassword(password) {
  const stored = await db.settings.get('adminHash');
  if (!stored) return false;
  return stored.value === (await sha256(password + 'SALT_2026'));
}

export async function isAdminPasswordSet() {
  return !!(await db.settings.get('adminHash'));
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initDefaults() {
  const existing = await db.settings.get('initialized');
  if (existing) return;

  const scheduleId = await db.schedules.add({
    name: 'Standart Mesai',
    startTime: '09:00',
    endTime: '18:00',
    toleranceLate: 15,
    toleranceEarly: 15
  });

  await db.settings.bulkPut([
    { key: 'defaultScheduleId', value: scheduleId },
    { key: 'theme', value: 'light' },
    { key: 'color', value: 'mint' },
    { key: 'initialized', value: true }
  ]);
}

export async function getTodaySummary() {
  const today = new Date().toISOString().split('T')[0];
  const allPersonnel = await db.personnel.filter(p => !p.archived).toArray();
  const todayRecords = await db.records.where('date').equals(today).toArray();
  const leaves = await db.leaves.toArray();
  const holidays = await db.holidays.where('date').equals(today).toArray();

  const isHoliday = holidays.length > 0;
  const activeLeaves = leaves.filter(l => l.startDate <= today && l.endDate >= today);
  const leaveIds = new Set(activeLeaves.map(l => l.personnelId));
  const checkedInIds = new Set(todayRecords.filter(r => r.checkIn).map(r => r.personnelId));

  const inside = todayRecords.filter(r => r.checkIn && !r.checkOut).length;
  const notArrived = isHoliday ? 0 : allPersonnel.filter(p => !checkedInIds.has(p.id) && !leaveIds.has(p.id)).length;
  const earlyOut = todayRecords.filter(r => r.status === 'early').length;
  const onLeave = allPersonnel.filter(p => leaveIds.has(p.id)).length;

  return { inside, notArrived, earlyOut, onLeave, total: allPersonnel.length, isHoliday };
}

export async function logAudit(action, detail) {
  await db.auditLog.add({ action, detail, timestamp: new Date().toISOString() });
}

export async function archivePersonnel(id) {
  await db.personnel.update(id, { archived: true });
  await logAudit('PERSONEL_ARŞİV', `Personel ID ${id} arşivlendi`);
}