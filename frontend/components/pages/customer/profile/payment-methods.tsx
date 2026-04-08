import React, { useState } from 'react';
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
    Pressable,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const Colors = {
    primary: '#D62828',
    secondary: '#F77F00',
    tertiary: '#FCBF49',
    neutral: '#003049',
    background: '#EEF2F7',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#003049',
    textSecondary: '#5A7184',
    textMuted: '#94A3B8',
    error: '#EF4444',
    success: '#10B981',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Payment card icons ────────────────────────────────────────────────────────
function PaymentIcon({ type, size = 24 }: { type: PaymentType; size?: number }) {
    if (type === 'cash')
        return <MaterialIcons name="payments" size={size} color={Colors.success} />;
    if (type === 'wallet')
        return <MaterialCommunityIcons name="wallet" size={size} color={Colors.secondary} />;
    return <MaterialIcons name="credit-card" size={size} color={Colors.neutral} />;
}

const TYPE_BG: Record<PaymentType, string> = {
    cash: '#ECFDF5',
    wallet: '#FFF7ED',
    card: '#EEF2F7',
};

// ─── Single method card ────────────────────────────────────────────────────────
function MethodCard({
    method,
    onSetDefault,
    onDelete,
}: {
    method: PaymentMethod;
    onSetDefault: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <View style={[cardStyles.card, method.isDefault && cardStyles.cardDefault]}>
            <View style={[cardStyles.iconBox, { backgroundColor: TYPE_BG[method.type] }]}>
                <PaymentIcon type={method.type} size={22} />
            </View>
            <View style={cardStyles.info}>
                <Text style={cardStyles.label}>{method.label}</Text>
                <Text style={cardStyles.detail}>{method.detail}</Text>
                {method.isDefault && (
                    <View style={cardStyles.defaultBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
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
                        <Ionicons name="star-outline" size={18} color={Colors.textSecondary} />
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
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const cardStyles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    cardDefault: { backgroundColor: '#FFFBF5' },
    iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 3 },
    label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    detail: { fontSize: 13, color: Colors.textSecondary },
    defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    defaultText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 4 },
});

// ─── Add Card Modal ────────────────────────────────────────────────────────────
function AddCardModal({
    visible,
    onClose,
    onAdd,
}: {
    visible: boolean;
    onClose: () => void;
    onAdd: (m: PaymentMethod) => void;
}) {
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
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={modalStyles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Preview */}
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
                            <ModalField label="Card Number">
                                <TextInput
                                    style={modalStyles.input}
                                    value={cardNumber}
                                    onChangeText={v => setCardNumber(formatCardNumber(v))}
                                    placeholder="1234 5678 9012 3456"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={19}
                                />
                            </ModalField>

                            <ModalField label="Card Holder Name">
                                <TextInput
                                    style={modalStyles.input}
                                    value={holder}
                                    onChangeText={setHolder}
                                    placeholder="As shown on card"
                                    placeholderTextColor={Colors.textMuted}
                                    autoCapitalize="characters"
                                />
                            </ModalField>

                            <View style={modalStyles.row}>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Expiry Date">
                                        <TextInput
                                            style={modalStyles.input}
                                            value={expiry}
                                            onChangeText={v => setExpiry(formatExpiry(v))}
                                            placeholder="MM/YY"
                                            placeholderTextColor={Colors.textMuted}
                                            keyboardType="number-pad"
                                            maxLength={5}
                                        />
                                    </ModalField>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="CVV">
                                        <TextInput
                                            style={modalStyles.input}
                                            value={cvv}
                                            onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                                            placeholder="•••"
                                            placeholderTextColor={Colors.textMuted}
                                            keyboardType="number-pad"
                                            secureTextEntry
                                            maxLength={4}
                                        />
                                    </ModalField>
                                </View>
                            </View>

                            <View style={modalStyles.secureRow}>
                                <Ionicons name="lock-closed" size={14} color={Colors.success} />
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

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ gap: 6 }}>
            <Text style={modalStyles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

const modalStyles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.surface },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.border
    },
    title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    body: { padding: 20, gap: 20, paddingBottom: 40 },

    cardPreview: {
        backgroundColor: Colors.neutral, borderRadius: 20, padding: 24, gap: 16,
        shadowColor: Colors.neutral, shadowOpacity: 0.35,
        shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8
    },
    cardPreviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardPreviewLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },
    cardPreviewNumber: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 3 },
    cardPreviewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    cardPreviewSmall: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 2 },
    cardPreviewMed: { fontSize: 14, fontWeight: '600', color: '#fff' },

    fields: { gap: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    input: {
        backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5,
        borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 15, color: Colors.textPrimary, fontWeight: '500'
    },
    row: { flexDirection: 'row', gap: 12 },
    secureRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10
    },
    secureText: { fontSize: 12, color: Colors.success, fontWeight: '500', flex: 1 },
    addBtn: {
        backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', shadowColor: Colors.primary,
        shadowOpacity: 0.4, shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }, elevation: 5
    },
    addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentMethods() {
    const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);
    const [modalVisible, setModalVisible] = useState(false);

    const setDefault = (id: string) => {
        setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const deleteMethod = (id: string) => {
        setMethods(prev => {
            const filtered = prev.filter(m => m.id !== id);
            // if deleted was default, set first as default
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
            <StatusBar barStyle="light-content" backgroundColor={Colors.neutral} />

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
                {/* Saved methods */}
                <Text style={styles.sectionLabel}>SAVED METHODS</Text>
                <View style={styles.listCard}>
                    {methods.map((m, i) => (
                        <React.Fragment key={m.id}>
                            <MethodCard method={m} onSetDefault={setDefault} onDelete={deleteMethod} />
                            {i < methods.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Add new card */}
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ADD NEW</Text>
                <TouchableOpacity
                    style={styles.addCardBtn}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.addCardIconBox}>
                        <Ionicons name="add" size={22} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.addCardLabel}>Add Credit / Debit Card</Text>
                        <Text style={styles.addCardSub}>Visa, Mastercard, and more</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={Colors.neutral} />
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

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.neutral },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14
    },
    headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
    scroll: { flex: 1, backgroundColor: Colors.background },
    scrollInner: { padding: 16, paddingBottom: 40 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', color: Colors.primary,
        letterSpacing: 1.4, marginBottom: 10, marginLeft: 4
    },
    listCard: {
        backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 }, elevation: 3
    },
    divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

    addCardBtn: {
        backgroundColor: Colors.surface, borderRadius: 16, flexDirection: 'row',
        alignItems: 'center', padding: 16, gap: 14,
        borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 }, elevation: 1
    },
    addCardIconBox: {
        width: 46, height: 46, borderRadius: 14, backgroundColor: '#FEF2F2',
        alignItems: 'center', justifyContent: 'center'
    },
    addCardLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    addCardSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    infoCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
        marginTop: 20, borderLeftWidth: 3, borderLeftColor: Colors.neutral
    },
    infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});