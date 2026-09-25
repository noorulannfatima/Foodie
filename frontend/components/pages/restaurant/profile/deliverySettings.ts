import type { RestaurantStringKey, RestaurantT } from '@/constants/restaurantStrings';

// Mirrors the validators on backend/src/models/restaurant.ts — keep both in sync.
export const DELIVERY_SETTINGS_LIMITS = {
  deliveryRadius: { min: 1, max: 50 },
  minimumOrder: { min: 0, max: 100000 },
  deliveryFee: { min: 0, max: 10000 },
  estimatedDeliveryTime: { min: 10, max: 120 },
} as const;

export type DeliverySettingsKey = keyof typeof DELIVERY_SETTINGS_LIMITS;

export type DeliverySettings = Record<DeliverySettingsKey, number>;

export type DeliverySettingsForm = Record<DeliverySettingsKey, string>;

export type DeliverySettingsErrors = Partial<Record<DeliverySettingsKey, string>>;

export const DELIVERY_SETTINGS_FIELDS: ReadonlyArray<{
  key: DeliverySettingsKey;
  labelKey: RestaurantStringKey;
  prefix?: string;
  suffixKey?: RestaurantStringKey;
  allowDecimal: boolean;
  hintKey: RestaurantStringKey;
}> = [
  {
    key: 'deliveryRadius',
    labelKey: 'profileDeliveryRadius',
    suffixKey: 'profileUnitKm',
    allowDecimal: true,
    hintKey: 'profileDeliveryRadiusHint',
  },
  {
    key: 'minimumOrder',
    labelKey: 'profileMinimumOrder',
    prefix: 'Rs.',
    allowDecimal: false,
    hintKey: 'profileMinimumOrderHint',
  },
  {
    key: 'deliveryFee',
    labelKey: 'profileDeliveryFee',
    prefix: 'Rs.',
    allowDecimal: false,
    hintKey: 'profileDeliveryFeeHint',
  },
  {
    key: 'estimatedDeliveryTime',
    labelKey: 'profileEstimatedTime',
    suffixKey: 'profileUnitMin',
    allowDecimal: false,
    hintKey: 'profileEstimatedTimeHint',
  },
];

export function toDeliverySettingsForm(settings: DeliverySettings): DeliverySettingsForm {
  return {
    deliveryRadius: String(settings.deliveryRadius),
    minimumOrder: String(settings.minimumOrder),
    deliveryFee: String(settings.deliveryFee),
    estimatedDeliveryTime: String(settings.estimatedDeliveryTime),
  };
}

/** Strips anything that is not a digit (and a single decimal point when allowed). */
export function sanitizeNumericInput(value: string, allowDecimal: boolean): string {
  if (!allowDecimal) return value.replace(/[^0-9]/g, '');
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('').slice(0, 1)}` : whole;
}

export function validateDeliverySettings(
  form: DeliverySettingsForm,
  t: RestaurantT,
): {
  values: DeliverySettings | null;
  errors: DeliverySettingsErrors;
} {
  const errors: DeliverySettingsErrors = {};
  const values = {} as DeliverySettings;

  for (const field of DELIVERY_SETTINGS_FIELDS) {
    const raw = form[field.key].trim();
    const { min, max } = DELIVERY_SETTINGS_LIMITS[field.key];
    const num = Number(raw);

    if (raw === '' || raw === '.') {
      errors[field.key] = t('profileFieldRequired', { field: t(field.labelKey) });
    } else if (!Number.isFinite(num)) {
      errors[field.key] = t('profileInvalidNumber');
    } else if (num < min || num > max) {
      errors[field.key] = t('profileOutOfRange', { min, max: max.toLocaleString() });
    } else {
      values[field.key] = num;
    }
  }

  return { values: Object.keys(errors).length ? null : values, errors };
}
