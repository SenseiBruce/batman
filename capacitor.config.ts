import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarvis.expensetracker',
  appName: 'Jarvis Expenses',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Permissions would go here if using native plugins later
  }
};

export default config;