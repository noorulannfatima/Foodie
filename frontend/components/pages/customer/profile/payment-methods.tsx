import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppThemeColors, type AppColors } from '@/constants/theme';

const STATUS = { error: '#EF4444', success: '#10B981' } as const;

type PaymentType = 'cash' | 'card' | 'wallet';

interface PaymentMethod {
    id: string;
    type: PaymentType;
    label: string;
    detail: string;
    isDefault: boolean;
}

const INITIAL_METHODS: PaymentMethod[] = [
    { id: '1', type: 'cash', label: 'Cash on Delivery', detail: 'Pay when you receive', isDefault: true },
    { id: '2', type: 'wallet', label: 'Foodie Wallet', detail: 'Balance: PKR 0.00', isDefault: false },
];

function typeIconBg(type: PaymentType, c: AppColors): string {
    if (type === 'cash') return c.isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5';
    if (type === 'wallet') return c.isDark ? 'rgba(247,127,12,0.18)' : '#FFF7ED';
    return c.isDark ? c.card : '#EEF2F7';
}

function PaymentIcon({ type, size = 24, c }: { type: PaymentType; size?: number; c: AppColors }) {
    if (type === 'cash')
        return <MaterialIcons name="payments" size={size} color={STATUS.success} />;
    if (type === 'wallet')
        return <MaterialCommunityIcons name="wallet" size={size} color={c.customerSecondary} />;
    return <MaterialIcons name="credit-card" size={size} color={c.customerNeutral} />;
}

function MethodCard({
    method,
    onSetDefault,
    onDelete,
}: {
    method: PaymentMethod;
    onSetDefault: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const c = useAppThemeColors();
    const cardStyles = useMemo(() => createCardStyles(c), [c]);
    const defaultHighlight = c.isDark ? 'rgba(250,25,25,0.08)' : '#FFFBF5';

    return (
        <View style={[cardStyles.card, method.isDefault && { backgroundColor: defaultHighlight }]}>
            <View style={[cardStyles.iconBox, { backgroundColor: typeIconBg(method.type, c) }]}>
                <PaymentIcon type={method.type} size={22} c={c} />
            </View>
            <View style={cardStyles.info}>
                <Text style={cardStyles.label}>{method.label}</Text>
                <Text style={cardStyles.detail}>{method.detail}</Text>
                {method.isDefault && (
                    <View style={cardStyles.defaultBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={c.primary} />
                        <Text style={cardStyles.defaultText}>Default</Text>
                    </View>
                )}
            </View>
            <View style={cardStyles.actions}>
                {!method.isDefault && (
                    <TouchableOpacity
                        style={cardStyles.actionBtn}
                        onPress={() => onSetDefault(method.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Ionicons name="star-outline" size={18} color={c.customerTextSecondary} />
                    </TouchableOpacity>
                )}
                {method.type !== 'cash' && method.type !== 'wallet' && (
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { marginLeft: 6 }]}
                        onPress={() =>
                            Alert.alert('Remove', `Remove ${method.label}?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: () => onDelete(method.id) },
                            ])
                        }
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Ionicons name="trash-outline" size={18} color={STATUS.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

function createCardStyles(c: AppColors) {
    return StyleSheet.create({
        card: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
        iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
        info: { flex: 1, gap: 3 },
        label: { fontSize: 15, fontWeight: '600', color: c.customerTextPrimary },
        detail: { fontSize: 13, color: c.customerTextSecondary },
        defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
        defaultText: { fontSize: 11, fontWeight: '700', color: c.primary, letterSpacing: 0.5 },
        actions: { flexDirection: 'row', alignItems: 'center' },
        actionBtn: { padding: 4 },
    });
}

function AddCardModal({
    visible,
    onClose,
    onAdd,
}: {
    visible: boolean;
    onClose: () => void;
    onAdd: (m: PaymentMethod) => void;
}) {
    const c = useAppThemeColors();
    const modalStyles = useMemo(() => createModalStyles(c), [c]);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [holder, setHolder] = useState('');

    const formatCardNumber = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const handleAdd = () => {
        const raw = cardNumber.replace(/\s/g, '');
        if (raw.length < 13) { Alert.alert('Error', 'Enter a valid card number'); return; }
        if (expiry.length < 5) { Alert.alert('Error', 'Enter expiry MM/YY'); return; }
        if (cvv.length < 3) { Alert.alert('Error', 'Enter valid CVV'); return; }
        if (!holder.trim()) { Alert.alert('Error', 'Enter card holder name'); return; }

        onAdd({
            id: Date.now().toString(),
            type: 'card',
            label: `•••• ${raw.slice(-4)}`,
            detail: `${holder.trim()} · Expires ${expiry}`,
            isDefault: false,
        });
        setCardNumber(''); setExpiry(''); setCvv(''); setHolder('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={modalStyles.safe}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Add New Card</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={24} color={c.customerTextPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={modalStyles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={modalStyles.cardPreview}>
                            <View style={modalStyles.cardPreviewTop}>
                                <Text style={modalStyles.cardPreviewLabel}>FOODIE CARD</Text>
                                <MaterialIcons name="credit-card" size={28} color="rgba(255,255,255,0.7)" />
                            </View>
                            <Text style={modalStyles.cardPreviewNumber}>
                                {cardNumber || '•••• •••• •••• ••••'}
                            </Text>
                            <View style={modalStyles.cardPreviewBottom}>
                                <View>
                                    <Text style={modalStyles.cardPreviewSmall}>CARD HOLDER</Text>
                                    <Text style={modalStyles.cardPreviewMed}>{holder.trim().toUpperCase() || '—'}</Text>
                                </View>
                                <View>
                                    <Text style={modalStyles.cardPreviewSmall}>EXPIRES</Text>
                                    <Text style={modalStyles.cardPreviewMed}>{expiry || 'MM/YY'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={modalStyles.fields}>
                            <ModalField label="Card Number" modalStyles={modalStyles}>
                                <TextInput
                                    style={modalStyles.input}
                                    value={cardNumber}
                                    onChangeText={v => setCardNumber(formatCardNumber(v))}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor={c.customerTextMuted}
                                    keyboardType="number-pad"
                                    maxLength={19}
                                />
                            </ModalField>

                            <ModalField label="Card Holder Name" modalStyles={modalStyles}>
                                <TextInput
                                    style={modalStyles.input}
                                    value={holder}
                                    onChangeText={setHolder}
                                    placeholder="As shown on card"
                                    placeholderTextColor={c.customerTextMuted}
                                    autoCapitalize="characters"
                                />
                            </ModalField>

                            <View style={modalStyles.row}>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Expiry Date" modalStyles={modalStyles}>
                                        <TextInput
                                            style={modalStyles.input}
                                            value={expiry}
                                            onChangeText={v => setExpiry(formatExpiry(v))}
                                            placeholder="MM/YY"
                                            placeholderTextColor={c.customerTextMuted}
                                            keyboardType="number-pad"
                                            maxLength={5}
                                        />
                                    </ModalField>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="CVV" modalStyles={modalStyles}>
                                        <TextInput
                                            style={modalStyles.input}
                                            value={cvv}
                                            onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="•••"
                                            placeholderTextColor={c.customerTextMuted}
                                            keyboardType="number-pad"
                                            secureTextEntry
                                            maxLength={4}
                                        />
                                    </ModalField>
                                </View>
                            </View>

                            <View style={modalStyles.secureRow}>
                                <Ionicons name="lock-closed" size={14} color={STATUS.success} />
                                <Text style={modalStyles.secureText}>Your card details are encrypted and secure</Text>
                            </View>

                            <TouchableOpacity style={modalStyles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
                                <Text style={modalStyles.addBtnText}>Add Card</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

function ModalField({
    label,
    children,
    modalStyles,
}: {
    label: string;
    children: React.ReactNode;
    modalStyles: ReturnType<typeof createModalStyles>;
}) {
    return (
        <View style={{ gap: 6 }}>
            <Text style={modalStyles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

function createModalStyles(c: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: c.customerSurface },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: c.customerBorder,
        },
        title: { fontSize: 18, fontWeight: '700', color: c.customerTextPrimary },
        body: { padding: 20, gap: 20, paddingBottom: 40 },

        cardPreview: {
            backgroundColor: c.customerNeutral, borderRadius: 20, padding: 24, gap: 16,
            shadowColor: c.customerNeutral, shadowOpacity: 0.35,
            shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
        },
        cardPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        cardPreviewLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },
        cardPreviewNumber: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 3 },
        cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
        cardPreviewSmall: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 2 },
        cardPreviewMed: { fontSize: 14, fontWeight: '600', color: '#fff' },

        fields: { gap: 16 },
        fieldLabel: { fontSize: 13, fontWeight: '600', color: c.customerTextSecondary },
        input: {
            backgroundColor: c.customerBodyBg, borderRadius: 12, borderWidth: 1.5,
            borderColor: c.customerBorder, paddingHorizontal: 14, paddingVertical: 13,
            fontSize: 15, color: c.customerTextPrimary, fontWeight: '500',
        },
        row: { flexDirection: 'row', gap: 12 },
        secureRow: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: c.isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
            borderRadius: 10, padding: 10,
        },
        secureText: { fontSize: 12, color: STATUS.success, fontWeight: '500', flex: 1 },
        addBtn: {
            backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', shadowColor: c.primary,
            shadowOpacity: 0.4, shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 }, elevation: 5,
        },
        addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    });
}

export default function PaymentMethods() {
    const c = useAppThemeColors();
    const styles = useMemo(() => createMainStyles(c), [c]);
    const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);
    const [modalVisible, setModalVisible] = useState(false);

    const setDefault = (id: string) => {
        setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const deleteMethod = (id: string) => {
        setMethods(prev => {
            const filtered = prev.filter(m => m.id !== id);
            if (prev.find(m => m.id === id)?.isDefault && filtered.length > 0)
                filtered[0].isDefault = true;
            return filtered;
        });
    };

    const addMethod = (m: PaymentMethod) => {
        setMethods(prev => [...prev, m]);
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
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionLabel}>SAVED METHODS</Text>
                <View style={styles.listCard}>
                    {methods.map((m, i) => (
                        <React.Fragment key={m.id}>
                            <MethodCard method={m} onSetDefault={setDefault} onDelete={deleteMethod} />
                            {i < methods.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ADD NEW</Text>
                <TouchableOpacity
                    style={styles.addCardBtn}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.addCardIconBox}>
                        <Ionicons name="add" size={22} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.addCardLabel}>Add Credit / Debit Card</Text>
                        <Text style={styles.addCardSub}>Visa, Mastercard, and more</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.customerTextMuted} />
                </TouchableOpacity>

                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={c.customerNeutral} />
                    <Text style={styles.infoText}>
                        Your payment info is protected with industry-standard encryption. We never store
                        your full card number.
                    </Text>
                </View>
            </ScrollView>

            <AddCardModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onAdd={addMethod}
            />
        </SafeAreaView>
    );
}

function createMainStyles(c: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: c.customerNeutral },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
        },
        headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
        scroll: { flex: 1, backgroundColor: c.customerBodyBg },
        scrollInner: { padding: 16, paddingBottom: 40 },

        sectionLabel: {
            fontSize: 11, fontWeight: '700', color: c.primary,
            letterSpacing: 1.4, marginBottom: 10, marginLeft: 4,
        },
        listCard: {
            backgroundColor: c.customerSurface, borderRadius: 16, overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: c.isDark ? 0.2 : 0.06, shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }, elevation: 3,
            borderWidth: c.isDark ? 1 : 0,
            borderColor: c.customerBorder,
        },
        divider: { height: 1, backgroundColor: c.customerBorder, marginHorizontal: 16 },

        addCardBtn: {
            backgroundColor: c.customerSurface, borderRadius: 16, flexDirection: 'row',
            alignItems: 'center', padding: 16, gap: 14,
            borderWidth: 1.5, borderColor: c.customerBorder, borderStyle: 'dashed',
            shadowColor: '#000', shadowOpacity: c.isDark ? 0.15 : 0.04, shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 }, elevation: 1,
        },
        addCardIconBox: {
            width: 46, height: 46, borderRadius: 14, backgroundColor: c.primaryLight,
            alignItems: 'center', justifyContent: 'center',
        },
        addCardLabel: { fontSize: 15, fontWeight: '600', color: c.customerTextPrimary },
        addCardSub: { fontSize: 13, color: c.customerTextSecondary, marginTop: 2 },

        infoCard: {
            flexDirection: 'row', alignItems: 'flex-start', gap: 12,
            backgroundColor: c.customerSurface, borderRadius: 14, padding: 16,
            marginTop: 20, borderLeftWidth: 3, borderLeftColor: c.customerNeutral,
        },
        infoText: { flex: 1, fontSize: 13, color: c.customerTextSecondary, lineHeight: 19 },
    });
}
