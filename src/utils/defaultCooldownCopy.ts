export function formatDefaultCooldown(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Default cooldown: unset';
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Default cooldown: unset';
  }
  return `Default cooldown: ${trimmed} hours`;
}
