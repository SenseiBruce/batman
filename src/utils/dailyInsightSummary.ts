import type { DailyInsight } from '../services/insightService';

export function formatDailyInsight(insight: DailyInsight): string {
  const kind = insight.type === 'tip' ? 'Tip' : insight.type;
  return [`Jarvis insight (${kind})`, insight.title, insight.message].join('\n');
}
