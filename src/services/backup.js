import { db } from '../db/database';

export async function exportBackup() {
  const dump = {};
  for (const table of db.tables) {
    dump[table.name] = await table.toArray();
  }
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yedek_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  const dump = JSON.parse(text);
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      if (dump[table.name]) {
        await table.clear();
        await table.bulkAdd(dump[table.name]);
      }
    }
  });
  return true;
}