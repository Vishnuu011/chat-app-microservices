import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.chatapp',
  appName: 'ChatApp',
  webDir: 'dist',
  server: {
    // While developing you can point the native shell straight at your
    // deployed backend/socket server. Remove "url" (and androidScheme) once
    // you're shipping the built `dist` folder inside the app bundle.
    androidScheme: 'https',
  },
};

export default config;
