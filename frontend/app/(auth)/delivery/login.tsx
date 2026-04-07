import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  red: '#D62828',
  orange: '#F77F00',
  gold: '#FCBF49',
  navy: '#003049',
  navy2: '#022535',
  pageBg: '#F5F7F9',
  cardBg: '#FFFFFF',
  inputBg: '#EBF4F8',
  border: '#D8E6EE',
  text: '#1A2A33',
  muted: '#6B8A99',
  lightRed: '#FCEAEA',
};

export default function DeliveryLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password, 'delivery');
      router.replace('/(delivery)/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Nav bar ── */}
      <View style={s.navbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.navBack}>← Back</Text>
        </Pressable>
        <Text style={s.navTitle}>Delivery Partner</Text>
        <Text style={s.navBrand}>FOODIE</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={[C.navy2, '#004d6e', C.orange]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <View style={s.heroDeco} />
            <View style={s.heroDeco2} />
            <Text style={s.heroBadge}>DELIVERY PARTNER</Text>
            <Text style={s.heroTitle}>Welcome Back</Text>
            <Text style={s.heroSub}>Sign in to start delivering</Text>
          </LinearGradient>

          <View style={s.body}>

            {/* ── Login Card ── */}
            <View style={s.card}>
              {/* Email */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter your email"
                  placeholderTextColor={C.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password */}
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <View style={s.passwordWrap}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Enter your password"
                    placeholderTextColor={C.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    autoComplete="password"
                  />
                  <Pressable style={s.eyeBtn} onPress={() => setShowPw(p => !p)} hitSlop={8}>
                    <Text style={s.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Forgot password */}
              <Pressable style={s.forgotWrap}>
                <Text style={s.forgotText}>Forgot password?</Text>
              </Pressable>
            </View>

            {/* ── Stats strip ── */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statNum}>2,400+</Text>
                <Text style={s.statLabel}>Active Partners</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>4.8★</Text>
                <Text style={s.statLabel}>Avg. Rating</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.statItem}>
                <Text style={s.statNum}>PKR 1.2L</Text>
                <Text style={s.statLabel}>Avg. Earnings</Text>
              </View>
            </View>

            {/* ── CTA ── */}
            <Pressable
              style={[s.ctaBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaBtnText}>Login</Text>}
            </Pressable>

            <View style={s.footer}>
              <Text style={s.footerText}>Want to deliver? </Text>
              <Pressable onPress={() => router.replace('/(auth)/delivery/signup')}>
                <Text style={s.footerLink}>Sign Up</Text>
              </Pressable>
            </View>

            {/* ── Bottom promo card ── */}
            <LinearGradient
              colors={[C.navy, C.navy2]}
              style={s.promoBanner}
            >
              <Text style={s.promoTag}>EARN MORE</Text>
              <Text style={s.promoTitle}>Peak-hour bonuses{'\n'}every weekend 🔥</Text>
              <Text style={s.promoSub}>Log in and check your bonus zone</Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        <Pressable style={s.bbItem}>
          <Text style={s.bbIcon}>💬</Text>
          <Text style={s.bbLabel}>Help</Text>
        </Pressable>
        <Pressable style={s.bbItem} onPress={() => router.replace('/(auth)/delivery/signup')}>
          <Text style={[s.bbIcon, { fontSize: 16 }]}>✍️</Text>
          <Text style={[s.bbLabel, { color: C.red }]}>Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },
  navbar: { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14 },
  navBack: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  navTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  navBrand: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  hero: { height: 180, paddingHorizontal: 18, paddingBottom: 22, justifyContent: 'flex-end', overflow: 'hidden' },
  heroDeco: { position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: C.orange, opacity: 0.15 },
  heroDeco2: { position: 'absolute', left: -20, bottom: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: C.gold, opacity: 0.1 },
  heroBadge: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff', lineHeight: 36 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 5, fontWeight: '500' },
  body: { paddingHorizontal: 14, paddingTop: 16 },
  card: { backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase', color: C.muted },
  input: { backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 10, paddingRight: 12, borderWidth: 1, borderColor: 'transparent' },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 16 },
  forgotWrap: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, fontWeight: '600', color: C.red },
  statsRow: { flexDirection: 'row', backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginTop: 14, paddingVertical: 14, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 14, fontWeight: '800', color: C.navy },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', textAlign: 'center' },
  statDiv: { width: 1, height: 28, backgroundColor: C.border },
  ctaBtn: { backgroundColor: C.red, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  footerText: { fontSize: 13, color: C.muted },
  footerLink: { fontSize: 13, fontWeight: '700', color: C.red },
  promoBanner: { borderRadius: 14, padding: 18, marginTop: 18 },
  promoTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: C.gold, textTransform: 'uppercase', marginBottom: 6 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24, marginBottom: 6 },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  bottomBar: { backgroundColor: C.cardBg, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  bbItem: { alignItems: 'center', gap: 3 },
  bbIcon: { fontSize: 18 },
  bbLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.muted },
});