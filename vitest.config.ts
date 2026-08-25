import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/services/budgetService.ts',
        'src/services/syncService.ts',
        'src/services/geminiCategorizationService.ts',
        'src/services/geminiService.ts',
        'src/services/splitService.ts',
        'src/utils/logger.ts',
        'src/utils/parser.ts',
        'src/utils/budgetAnalysisSummary.ts',
        'src/utils/localBackupExport.ts',
        'src/utils/subscriptionSummary.ts',
        'src/utils/goalsSummary.ts',
        'src/utils/topMerchantsSummary.ts',
        'src/utils/predictionsSummary.ts',
        'src/utils/dailyInsightSummary.ts',
        'src/utils/accountsSummary.ts',
        'src/contexts/JarvisContext.tsx',
        'src/components/settings/**/*.{ts,tsx}',
      ],
      exclude: ['src/**/*.test.*', 'src/test/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 60,
        branches: 50,
      },
    },
  },
});
