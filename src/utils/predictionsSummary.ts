import type {
  BudgetForecast,
  PredictiveInsight,
  SpendingAnomaly,
  SpendingPrediction,
} from '../services/predictionService';

export function formatPredictionsSummary(input: {
  month: string;
  insights: PredictiveInsight[];
  forecasts: BudgetForecast[];
  anomalies: SpendingAnomaly[];
  predictions: SpendingPrediction[];
}): string {
  const overBudget = input.forecasts.filter((f) => f.willExceed).length;
  const lines = [
    `AI predictions (${input.month})`,
    `Insights: ${input.insights.length}`,
    ...input.insights.slice(0, 3).map((i) => `- [${i.priority}] ${i.title}`),
    `Forecasts over budget: ${overBudget}`,
    `Anomalies: ${input.anomalies.length}`,
    `Category forecasts: ${input.predictions.length}`,
  ];
  return lines.join('\n');
}
