import type { Subscription } from '../services/subscriptionService';

export function monthlyCost(sub: Subscription): number {
  const days = sub.frequencyDays > 0 ? sub.frequencyDays : 30;
  return (sub.amount * 30) / days;
}

export function formatSubscriptionSummary(subs: Subscription[]): string {
  const lines = ['Jarvis subscriptions'];
  for (const sub of subs) {
    lines.push(`${sub.merchant}  ₹${sub.amount} / ${sub.frequencyDays}d  next ${sub.nextDueDate}`);
  }
  const total = subs.reduce((sum, sub) => sum + monthlyCost(sub), 0);
  lines.push(`Est. monthly: ₹${Math.round(total)}`);
  return lines.join('\n');
}
