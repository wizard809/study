import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusdeck.app',
  appName: 'Focus Deck',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
