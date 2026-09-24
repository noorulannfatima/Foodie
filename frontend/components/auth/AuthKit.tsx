import { ReactNode, forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_RED, BRAND_RED_TINT } from '@/constants/theme';

// Shared visual language for every auth screen (customer, restaurant, delivery).
// Derived from the customer login, which is the reference design.
export const AuthColors = {
  bg: '#eef0f8',
  surface: '#ffffff',
  ink: '#0d1b2a',
  text: '#1a1a2e',
  body: '#555a6b',
  muted: '#6b7280',
  placeholder: '#747a8e',
  border: '#e2e5ef',
  hairline: '#d1d5e0',
  primary: BRAND_RED,
  primaryTint: BRAND_RED_TINT,
};

const C = AuthColors;

// ─── Screen shell ─────────────────────────────────────────────────────────────
// Screens can be reached with no history (deep link, inactivity logout, replace),
// where router.back() is a no-op — fall back to the welcome screen.
export function goBackOrWelcome() {
  if (router.canGoBack()) router.back();
  else router.replace('/(auth)');
}

export function AuthScreen({
  children,
  onBack = goBackOrWelcome,
}: {
  children: ReactNode;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            {
              paddingTop: insets.top + 20,
              paddingBottom: Math.max(insets.bottom, 20) + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [s.backButton, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color={C.body} />
            <Text style={s.backText}>Back</Text>
          </Pressable>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.header}>
      <Text style={s.title} accessibilityRole="header">{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function AuthForm({ children }: { children: ReactNode }) {
  return <View style={s.form}>{children}</View>;
}

// ─── Fields ───────────────────────────────────────────────────────────────────
export function Field({
  label,
  action,
  hint,
  children,
}: {
  label: string;
  action?: { label: string; onPress: () => void };
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={s.inputGroup}>
      <View style={s.labelRow}>
        <Text style={s.label}>{label}</Text>
        {action && (
          <Pressable onPress={action.onPress} hitSlop={10}>
            <Text style={s.actionText}>{action.label}</Text>
          </Pressable>
        )}
      </View>
      {children}
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

type AuthInputProps = TextInputProps & {
  /** Renders a show/hide toggle and hides the value by default. */
  password?: boolean;
  /** Short fixed text shown before the value, e.g. a currency. */
  prefix?: string;
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { password, prefix, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View
      style={[
        s.inputShell,
        focused && s.inputShellFocused,
        rest.editable === false && s.inputShellDisabled,
      ]}
    >
      {prefix && <Text style={s.prefix}>{prefix}</Text>}
      <TextInput
        ref={ref}
        style={[s.input, multiline && s.textarea, style]}
        placeholderTextColor={C.placeholder}
        selectionColor={C.primary}
        cursorColor={C.primary}
        secureTextEntry={password ? !visible : rest.secureTextEntry}
        autoCapitalize={password ? 'none' : rest.autoCapitalize}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {password && (
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          style={s.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={C.muted}
          />
        </Pressable>
      )}
    </View>
  );
});

export function Row({ children }: { children: ReactNode }) {
  return <View style={s.row}>{children}</View>;
}

export function Col({ children, width }: { children: ReactNode; width?: number }) {
  return <View style={width ? { width } : s.flex}>{children}</View>;
}

// ─── Sections (longer signup forms) ───────────────────────────────────────────
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle} accessibilityRole="header">{title}</Text>
        {description && <Text style={s.sectionDescription}>{description}</Text>}
      </View>
      <View style={s.form}>{children}</View>
    </View>
  );
}

// ─── Selection controls ───────────────────────────────────────────────────────
export function ChoiceChips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={({ pressed }) => [s.chip, active && s.chipActive, pressed && s.pressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            {active && <Ionicons name="checkmark" size={14} color={C.primary} />}
            <Text style={[s.chipText, active && s.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OptionTiles<T extends string>({
  options,
  value,
  onChange,
  renderIcon,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  renderIcon: (option: T, color: string) => ReactNode;
}) {
  return (
    <View style={s.tileGrid}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [s.tile, active && s.tileActive, pressed && s.pressed]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            {renderIcon(opt, active ? C.primary : C.muted)}
            <Text style={[s.tileText, active && s.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CheckboxRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      style={s.checkRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
      <Text style={s.checkText}>{children}</Text>
    </Pressable>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Text style={s.inlineLink} onPress={onPress}>
      {children}
    </Text>
  );
}

export function FinePrint({ children }: { children: ReactNode }) {
  return <Text style={s.finePrint}>{children}</Text>;
}

// ─── Steps ────────────────────────────────────────────────────────────────────
export function StepProgress({ current, labels }: { current: number; labels: string[] }) {
  return (
    <View style={s.steps}>
      <View style={s.stepBars}>
        {labels.map((_, i) => (
          <View key={i} style={[s.stepBar, i < current && s.stepBarDone]} />
        ))}
      </View>
      <Text style={s.stepText}>
        Step {current} of {labels.length} · {labels[current - 1]}
      </Text>
    </View>
  );
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactive = loading || disabled;
  return (
    <Pressable
      style={({ pressed }) => [
        s.button,
        inactive && s.buttonDisabled,
        pressed && !inactive && s.buttonPressed,
      ]}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={s.buttonText}>{title.toUpperCase()}</Text>
      )}
    </Pressable>
  );
}

export function SocialAuth() {
  return (
    <>
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>OR CONTINUE WITH</Text>
        <View style={s.dividerLine} />
      </View>
      <View style={s.socialRow}>
        <Pressable style={({ pressed }) => [s.socialButton, pressed && s.pressed]}>
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={s.socialText}>Google</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.socialButton, pressed && s.pressed]}>
          <Ionicons name="logo-apple" size={20} color={C.text} />
          <Text style={s.socialText}>Apple</Text>
        </Pressable>
      </View>
    </>
  );
}

export function AuthFooter({
  prompt,
  linkLabel,
  onPress,
}: {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={s.footer}>
      <Text style={s.footerText}>{prompt} </Text>
      <Pressable onPress={onPress} hitSlop={10}>
        <Text style={s.linkText}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  pressed: { opacity: 0.7 },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: { color: C.body, fontSize: 16, fontWeight: '600' },

  header: { marginBottom: 40 },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.muted },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  hint: { color: C.muted, fontSize: 12, lineHeight: 16 },

  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  inputShellFocused: { borderColor: C.primary },
  inputShellDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.text,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  prefix: {
    paddingLeft: 16,
    marginRight: -8,
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 12 },

  row: { flexDirection: 'row', gap: 12 },

  section: {
    marginTop: 36,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  sectionHead: { marginBottom: 20, gap: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  sectionDescription: { fontSize: 14, lineHeight: 20, color: C.muted },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: C.primaryTint, borderColor: C.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: C.body },
  chipTextActive: { color: C.primary },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 16,
  },
  tileActive: { backgroundColor: C.primaryTint, borderColor: C.primary },
  tileText: { fontSize: 14, fontWeight: '600', color: C.body },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.primary,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: C.primary },
  checkText: { flex: 1, fontSize: 14, color: C.muted, lineHeight: 21 },
  inlineLink: { color: C.primary, fontWeight: '600' },
  finePrint: { fontSize: 13, lineHeight: 19, color: C.muted, textAlign: 'center' },

  steps: { gap: 10, marginTop: -16, marginBottom: 32 },
  stepBars: { flexDirection: 'row', gap: 6 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.hairline },
  stepBarDone: { backgroundColor: C.primary },
  stepText: { fontSize: 13, fontWeight: '600', color: C.muted },

  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPressed: { transform: [{ scale: 0.985 }], shadowOpacity: 0.18 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.hairline },
  dividerText: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 13,
  },
  socialText: { color: C.text, fontSize: 14, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  footerText: { color: C.muted, fontSize: 14 },
  linkText: { color: C.primary, fontSize: 14, fontWeight: '700' },
});
