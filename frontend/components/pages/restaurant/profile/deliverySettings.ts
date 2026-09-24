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
  label: string;
  prefix?: string;
  suffix?: string;
  allowDecimal: boolean;
  hint: string;
}> = [
  {
    key: 'deliveryRadius',
    label: 'Delivery Radius',
    suffix: 'km',
    allowDecimal: true,
    hint: 'How far from your restaurant you deliver',
  },
  {
    key: 'minimumOrder',
    label: 'Minimum Order',
    prefix: 'Rs.',
    allowDecimal: false,
    hint: 'Smallest subtotal a customer can check out with',
  },
  {
    key: 'deliveryFee',
    label: 'Delivery Fee',
    prefix: 'Rs.',
    allowDecimal: false,
    hint: 'Set to 0 to offer free delivery',
  },
  {
    key: 'estimatedDeliveryTime',
    label: 'Estimated Time',
    suffix: 'min',
    allowDecimal: false,
    hint: 'Average time from order to doorstep',
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

export function validateDeliverySettings(form: DeliverySettingsForm): {
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
      errors[field.key] = `${field.label} is required`;
    } else if (!Number.isFinite(num)) {
      errors[field.key] = 'Enter a valid number';
    } else if (num < min || num > max) {
      errors[field.key] = `Must be between ${min} and ${max.toLocaleString()}`;
    } else {
      values[field.key] = num;
    }
  }

  return { values: Object.keys(errors).length ? null : values, errors };
}
