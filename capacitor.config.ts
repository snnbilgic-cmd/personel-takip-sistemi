import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sirket.personeltakip',
  appName: 'Personel Takip',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;