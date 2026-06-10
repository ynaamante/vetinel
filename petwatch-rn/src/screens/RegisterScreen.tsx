import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, radius } from '../theme/colors';

export default function RegisterScreen({ navigation }: any) {
  const { login } = useAuth();
  const { colors: tc, isDark } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const s = styles(tc, isDark);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { Toast.show({ type: 'error', text1: 'Please fill all required fields' }); return; }
    if (form.password !== form.confirmPassword) { Toast.show({ type: 'error', text1: 'Passwords do not match' }); return; }
    setLoading(true);
    setTimeout(async () => { await login(form.email, form.name); Toast.show({ type: 'success', text1: 'Account created!' }); navigation.replace('ClinicSelection'); setLoading(false); }, 1000);
  };

  const Field = ({ label, field, icon, placeholder, keyboard = 'default', secure = false }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <Ionicons name={icon} size={18} color={tc.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={[s.input, { flex: 1 }]} placeholder={placeholder} placeholderTextColor={tc.textMuted} value={(form as any)[field]} onChangeText={v => set(field, v)} keyboardType={keyboard} autoCapitalize="none" secureTextEntry={secure} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.logo}><Ionicons name="heart" size={36} color="#fff" /></View>
            <Text style={s.appName}>PetWatch</Text>
            <Text style={s.tagline}>Start monitoring your pet's health today</Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.sub}>Join thousands of pet owners protecting their pets</Text>
            <Field label="Full Name *" field="name" icon="person-outline" placeholder="John Doe" />
            <Field label="Email *" field="email" icon="mail-outline" placeholder="your@email.com" keyboard="email-address" />
            <Field label="Phone *" field="phone" icon="call-outline" placeholder="+1 (555) 123-4567" keyboard="phone-pad" />
            <Field label="Location" field="location" icon="location-outline" placeholder="San Francisco, CA" />
            <Field label="Password *" field="password" icon="lock-closed-outline" placeholder="••••••••" secure />
            <Field label="Confirm Password *" field="confirmPassword" icon="lock-closed-outline" placeholder="••••••••" secure />
            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <><Text style={s.btnText}>Create Account</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
            </TouchableOpacity>
            <View style={s.row}>
              <Text style={s.muted}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={s.link}>Sign in</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (tc: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDark ? colors.dark.background : '#EFF6FF' },
  container: { flexGrow: 1, padding: spacing.md, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '700', color: tc.text, marginBottom: 4 },
  tagline: { fontSize: 14, color: tc.textSecondary },
  card: { backgroundColor: tc.surface, borderRadius: radius.lg, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 20, fontWeight: '700', color: tc.text, marginBottom: 4 },
  sub: { fontSize: 13, color: tc.textSecondary, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: tc.text, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: tc.border, borderRadius: radius.md, backgroundColor: tc.inputBg, paddingHorizontal: 12 },
  input: { height: 44, fontSize: 15, color: tc.text },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  muted: { fontSize: 14, color: tc.textSecondary },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
