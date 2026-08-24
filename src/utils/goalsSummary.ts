import { Goal } from '../types';

export function formatGoalsSummary(goals: Goal[], formatAmount: (n: number) => string): string {
  if (goals.length === 0) {
    return 'Savings goals: none set';
  }

  const completed = goals.filter((g) => g.isCompleted).length;
  const lines = [
    `Savings goals: ${goals.length} (${completed} completed)`,
    ...goals.map((goal) => {
      const pct =
        goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
      const status = goal.isCompleted ? 'completed' : 'in progress';
      return `- ${goal.name}: ${formatAmount(goal.savedAmount)} / ${formatAmount(goal.targetAmount)} (${pct}%, ${status})`;
    }),
  ];
  return lines.join('\n');
}
