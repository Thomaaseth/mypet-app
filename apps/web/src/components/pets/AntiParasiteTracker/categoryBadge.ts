import type { AntiParasiteCategory } from '@/lib/validations/anti-parasite-treatment';

// Category → outline tag classes (app theme colors, not food's status tints).
// Shared by the history table and the sub-card's nested detail card.
export const CATEGORY_BADGE_CLASS: Record<AntiParasiteCategory, string> = {
  fleas_ticks: 'border-accent text-accent',
  worms: 'border-secondary text-secondary',
  heartworm: 'border-primary text-primary',
};