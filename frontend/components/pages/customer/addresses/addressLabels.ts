import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { CustomerStringKey } from '@/constants/customerStrings';

/**
 * Preset labels are stored in English and translated for display; anything
 * else is the customer's own name for the place and shown as typed.
 */
export const PRESET_LABELS = ['Home', 'Work', 'Other'] as const;
export type PresetLabel = (typeof PRESET_LABELS)[number];

const LABEL_KEYS: Record<PresetLabel, CustomerStringKey> = {
  Home: 'labelHome',
  Work: 'labelWork',
  Other: 'labelOther',
};

type T = (key: CustomerStringKey, params?: Record<string, string | number>) => string;

export function displayLabel(label: string, t: T): string {
  return label in LABEL_KEYS ? t(LABEL_KEYS[label as PresetLabel]) : label;
}

/** Which chip a stored label selects: a custom name counts as "Other". */
export function presetFor(label: string): PresetLabel {
  return label === 'Home' || label === 'Work' ? label : 'Other';
}

export function labelIcon(label: string): ComponentProps<typeof Ionicons>['name'] {
  if (label === 'Home') return 'home-outline';
  if (label === 'Work') return 'briefcase-outline';
  return 'location-outline';
}
