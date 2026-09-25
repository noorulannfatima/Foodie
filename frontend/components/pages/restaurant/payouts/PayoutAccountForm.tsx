import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { restaurantAPI } from '@/services/api/restaurant.api';
import type { PayoutAccount, PayoutMethod } from '@/services/api/payout.types';
import { useRestaurantT } from '@/constants/restaurantStrings';
import { usePayoutsStyles } from './usePayoutsStyles';

// Keep in sync with backend/src/models/restaurant.ts
const IBAN_REGEX = /^PK[0-9A-Z]{22}$/;
const WALLET_MOBILE_REGEX = /^03\d{9}$/;

const METHODS: { id: PayoutMethod; label: string; icon: 'business-outline' | 'phone-portrait-outline' }[] = [
  { id: 'Bank', label: 'Bank', icon: 'business-outline' },
  { id: 'JazzCash', label: 'JazzCash', icon: 'phone-portrait-outline' },
  { id: 'Easypaisa', label: 'Easypaisa', icon: 'phone-portrait-outline' },
];

interface PayoutAccountFormProps {
  current: PayoutAccount | null;
  onClose: () => void;
  onSaved: (account: PayoutAccount) => void;
}

type Errors = Partial<Record<'accountTitle' | 'bankName' | 'iban' | 'mobileNumber' | 'currentPassword', string>>;

export default function PayoutAccountForm({ current, onClose, onSaved }: PayoutAccountFormProps) {
  const { styles, colors } = usePayoutsStyles();
  const t = useRestaurantT();
  const [method, setMethod] = useState<PayoutMethod>(current?.method ?? 'Bank');
  const [accountTitle, setAccountTitle] = useState(current?.accountTitle ?? '');
  const [bankName, setBankName] = useState(current?.bankName ?? '');
  const [iban, setIban] = useState(current?.iban ?? '');
  const [mobileNumber, setMobileNumber] = useState(current?.mobileNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isBank = method === 'Bank';
  const normalizedIban = iban.replace(/\s+/g, '').toUpperCase();
  const normalizedMobile = mobileNumber.replace(/[\s-]/g, '');

  const validate = (): Errors => {
    const next: Errors = {};
    if (!accountTitle.trim()) next.accountTitle = t('payoutsErrAccountTitle');
    if (isBank) {
      if (!bankName.trim()) next.bankName = t('payoutsErrBankName');
      if (!IBAN_REGEX.test(normalizedIban)) next.iban = t('payoutsErrIban');
    } else if (!WALLET_MOBILE_REGEX.test(normalizedMobile)) {
      next.mobileNumber = t('payoutsErrMobile');
    }
    if (!currentPassword) next.currentPassword = t('payoutsErrPassword');
    return next;
  };

  const handleSave = async () => {
    const found = validate();
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const saved = await restaurantAPI.updatePayoutAccount({
        method,
        accountTitle: accountTitle.trim(),
        currentPassword,
        ...(isBank
          ? { bankName: bankName.trim(), iban: normalizedIban }
          : { mobileNumber: normalizedMobile }),
      });
      onSaved(saved);
    } catch (e: any) {
      setServerError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof Errors,
    label: string,
    input: React.ReactNode,
    hint?: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {input}
      {errors[key] ? (
        <Text style={styles.fieldError}>{errors[key]}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );

  const inputStyle = (key: keyof Errors) => [styles.input, errors[key] ? { borderColor: '#DC2626' } : null];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{current ? t('payoutsEditAccount') : t('payoutsAddAccount')}</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.body, { marginBottom: 20 }]}>{t('payoutsFormIntro')}</Text>

        <Text style={styles.label}>{t('payoutsReceiveBy')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {METHODS.map((m) => {
            const active = m.id === method;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMethod(m.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: active ? colors.brand : colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Ionicons name={m.icon} size={20} color={active ? colors.primary : colors.muted} />
                <Text
                  style={{
                    fontFamily: Fonts.brandBold,
                    fontSize: 13,
                    color: active ? colors.primary : colors.text,
                  }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {field(
          'accountTitle',
          t('payoutsAccountTitle'),
          <TextInput
            style={inputStyle('accountTitle')}
            value={accountTitle}
            onChangeText={setAccountTitle}
            placeholder={isBank ? t('payoutsAccountTitlePlaceholderBank') : t('payoutsAccountTitlePlaceholderWallet')}
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />,
          t('payoutsAccountTitleHint'),
        )}

        {isBank ? (
          <>
            {field(
              'bankName',
              t('payoutsBankName'),
              <TextInput
                style={inputStyle('bankName')}
                value={bankName}
                onChangeText={setBankName}
                placeholder={t('payoutsBankNamePlaceholder')}
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />,
            )}
            {field(
              'iban',
              'IBAN',
              <TextInput
                style={inputStyle('iban')}
                value={iban}
                onChangeText={setIban}
                placeholder="PK36 MEZN 0001 2301 0456 7890"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />,
              t('payoutsIbanHint'),
            )}
          </>
        ) : (
          field(
            'mobileNumber',
            t('payoutsMobileNumber', { method }),
            <TextInput
              style={inputStyle('mobileNumber')}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="03001234567"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />,
          )
        )}

        <View style={styles.divider} />

        {field(
          'currentPassword',
          t('payoutsPassword'),
          <TextInput
            style={inputStyle('currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('payoutsPasswordPlaceholder')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
          />,
          t('payoutsPasswordHint'),
        )}

        {serverError ? (
          <View style={[styles.banner, { marginBottom: 16 }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.bannerText}>{serverError}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>{t('payoutsSaveAccount')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
