import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useAppThemeColors, type AppColors } from '@/constants/theme';

const STATUS = { error: '#EF4444', success: '#10B981' } as const;

interface FieldProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'words' | 'sentences';
    editable?: boolean;
    hint?: string;
    error?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    autoCapitalize = 'words',
    editable = true,
    hint,
    error,
    iconName,
}: FieldProps) {
    const c = useAppThemeColors();
    const fieldStyles = useMemo(() => createFieldStyles(c), [c]);
    const [focused, setFocused] = useState(false);

    return (
        <View style={fieldStyles.wrapper}>
            <Text style={fieldStyles.label}>{label}</Text>
            <View
                style={[
                    fieldStyles.inputRow,
                    focused && fieldStyles.inputRowFocused,
                    !!error && fieldStyles.inputRowError,
                    !editable && fieldStyles.inputRowDisabled,
                ]}
            >
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={focused ? c.primary : c.customerTextMuted}
                        style={fieldStyles.inputIcon}
                    />
                )}
                <TextInput
                    style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={c.customerTextMuted}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
            {!!hint && !error && <Text style={fieldStyles.hint}>{hint}</Text>}
            {!!error && (
                <View style={fieldStyles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={STATUS.error} />
                    <Text style={fieldStyles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

function createFieldStyles(c: AppColors) {
    return StyleSheet.create({
        wrapper: { gap: 6 },
        label: { fontSize: 13, fontWeight: '600', color: c.customerTextSecondary, letterSpacing: 0.3 },
        inputRow: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: c.customerSurface,
            borderRadius: 12, borderWidth: 1.5, borderColor: c.customerBorder,
            paddingHorizontal: 14,
        },
        inputRowFocused: {
            borderColor: c.primary, shadowColor: c.primary,
            shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        inputRowError: { borderColor: STATUS.error },
        inputRowDisabled: { backgroundColor: c.isDark ? c.card : '#F8FAFC' },
        inputIcon: { marginRight: 10 },
        input: {
            flex: 1, fontSize: 15, color: c.customerTextPrimary,
            paddingVertical: 14, fontWeight: '500',
        },
        inputDisabled: { color: c.customerTextMuted },
        hint: { fontSize: 12, color: c.customerTextMuted, marginTop: -2 },
        errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        errorText: { fontSize: 12, color: STATUS.error },
    });
}

function VerificationRow({
    label,
    verified,
    icon,
    action,
    onAction,
}: {
    label: string;
    verified: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    action?: string;
    onAction?: () => void;
}) {
    const c = useAppThemeColors();
    const vStyles = useMemo(() => createVerificationStyles(c), [c]);
    return (
        <View style={vStyles.row}>
            <View style={vStyles.left}>
                <Ionicons name={icon} size={18} color={c.customerTextSecondary} />
                <Text style={vStyles.label}>{label}</Text>
            </View>
            <View style={vStyles.right}>
                {verified ? (
                    <View style={vStyles.verifiedChip}>
                        <Ionicons name="checkmark-circle" size={14} color={STATUS.success} />
                        <Text style={vStyles.verifiedText}>Verified</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={vStyles.unverifiedChip} onPress={onAction}>
                        <Text style={vStyles.unverifiedText}>{action ?? 'Unverified'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

function createVerificationStyles(c: AppColors) {
    return StyleSheet.create({
        row: {
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16,
        },
        left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        label: { fontSize: 14, fontWeight: '500', color: c.customerTextPrimary },
        right: {},
        verifiedChip: {
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: c.isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5',
            borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 4,
        },
        verifiedText: { fontSize: 12, fontWeight: '600', color: STATUS.success },
        unverifiedChip: {
            backgroundColor: c.isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
            borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
            borderColor: '#FCA5A5',
        },
        unverifiedText: { fontSize: 12, fontWeight: '600', color: STATUS.error },
    });
}

export default function PersonalInformation() {
    const c = useAppThemeColors();
    const styles = useMemo(() => createMainStyles(c), [c]);
    const { user } = useAuthStore();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
    const [saved, setSaved] = useState(false);

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim() || name.trim().length < 2)
            e.name = 'Name must be at least 2 characters';
        if (phone.trim() && !/^[\d\s\+\-\(\)]+$/.test(phone.trim()))
            e.phone = 'Enter a valid phone number';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 900));
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        Alert.alert('Saved', 'Your profile has been updated.');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={c.customerNeutral} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
                <View style={{ width: 22 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollInner}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarBig}>
                            <Text style={styles.avatarBigInitials}>
                                {name.trim()
                                    ? name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                                    : 'U'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.7}>
                            <MaterialIcons name="photo-camera" size={15} color={c.primary} />
                            <Text style={styles.changePhotoText}>Change Photo</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
                        <View style={styles.fieldGroup}>
                            <Field
                                label="Full Name"
                                value={name}
                                onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: undefined })); }}
                                placeholder="Your full name"
                                iconName="person-outline"
                                error={errors.name}
                            />
                            <Field
                                label="Email Address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                iconName="mail-outline"
                                editable={false}
                                hint="Email cannot be changed"
                            />
                            <Field
                                label="Phone Number"
                                value={phone}
                                onChangeText={v => { setPhone(v); setErrors(e => ({ ...e, phone: undefined })); }}
                                placeholder="+92 3XX XXXXXXX"
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                iconName="call-outline"
                                error={errors.phone}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>VERIFICATION STATUS</Text>
                        <View style={styles.verificationCard}>
                            <VerificationRow
                                label="Email Verified"
                                verified={true}
                                icon="mail-outline"
                            />
                            <View style={styles.vDivider} />
                            <VerificationRow
                                label="Phone Verified"
                                verified={false}
                                icon="call-outline"
                                action="Verify Now"
                                onAction={() => { }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, (isSaving || saved) && styles.saveBtnAlt]}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.85}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : saved ? (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>Saved!</Text>
                            </>
                        ) : (
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function createMainStyles(c: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: c.customerNeutral },
        flex: { flex: 1 },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
        },
        headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
        scroll: { flex: 1, backgroundColor: c.customerBodyBg },
        scrollInner: { padding: 16, paddingBottom: 40 },

        avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
        avatarBig: {
            width: 96, height: 96, borderRadius: 48, backgroundColor: c.customerNeutral,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: c.customerNeutral, shadowOpacity: 0.3,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        },
        avatarBigInitials: { fontSize: 34, fontWeight: '800', color: '#fff' },
        changePhotoBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 16, paddingVertical: 8,
            backgroundColor: c.customerSurface, borderRadius: 20,
            borderWidth: 1.5, borderColor: c.primary,
        },
        changePhotoText: { fontSize: 13, fontWeight: '600', color: c.primary },

        section: { marginBottom: 20 },
        sectionTitle: {
            fontSize: 11, fontWeight: '700', color: c.primary,
            letterSpacing: 1.4, marginBottom: 10, marginLeft: 4,
        },
        fieldGroup: { gap: 14 },
        verificationCard: {
            backgroundColor: c.customerSurface, borderRadius: 16, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: c.isDark ? 0.2 : 0.05, shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 }, elevation: 2,
            borderWidth: c.isDark ? 1 : 0,
            borderColor: c.customerBorder,
        },
        vDivider: { height: 1, backgroundColor: c.customerBorder, marginHorizontal: 16 },

        saveBtn: {
            backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
            gap: 8, marginTop: 8, shadowColor: c.primary,
            shadowOpacity: 0.4, shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 }, elevation: 6,
        },
        saveBtnAlt: { backgroundColor: STATUS.success },
        saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    });
}
