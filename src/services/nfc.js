import { CapacitorNfc } from '@capgo/capacitor-nfc';
import { Capacitor } from '@capacitor/core';

let listener = null;

export async function checkNfc() {
  if (Capacitor.getPlatform() === 'web') {
    return { supported: false, enabled: false, reason: 'Web platformunda NFC çalışmaz' };
  }
  try {
    const { supported } = await CapacitorNfc.isSupported();
    if (!supported) {
      return { supported: false, enabled: false, reason: 'Cihazda NFC donanımı yok' };
    }
    
    const { status } = await CapacitorNfc.getStatus();
    // Eklenti dokümanına göre, durum 'NFC_DISABLED' değilse NFC açıktır.
    const isEnabled = status !== 'NFC_DISABLED';
    
    return { supported: true, enabled: isEnabled, reason: status };
  } catch (error) {
    return { supported: false, enabled: false, reason: error.message || 'NFC kontrolü başarısız' };
  }
}

export async function startNfc(onTag) {
  await CapacitorNfc.startScanning({ invalidateAfterFirstRead: false });
  listener = await CapacitorNfc.addListener('nfcEvent', (event) => {
    if (event.tag?.id) {
      const uid = event.tag.id.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
      onTag(uid);
    }
  });
}

export async function stopNfc() {
  if (listener) { await listener.remove(); listener = null; }
  try { await CapacitorNfc.stopScanning(); } catch (_) {}
}
