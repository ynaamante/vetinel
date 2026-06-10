import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, radius } from '../theme/colors';
import { mockClinics } from '../data/mockData';

export default function ClinicSelectionScreen({ navigation }: any) {
  const { colors: tc, isDark } = useTheme();
  const [selectedId, setSelectedId] = useState('');
  const s = styles(tc, isDark);

  const confirm = () => {
    if (!selectedId) { Toast.show({ type: 'error', text1: 'Please select a clinic' }); return; }
    Toast.show({ type: 'success', text1: 'Clinic selected!' });
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <View style={s.logo}><Ionicons name="medical" size={28} color="#fff" /></View>
          <Text style={s.title}>Choose Your Clinic</Text>
          <Text style={s.sub}>Select your primary veterinary clinic</Text>
        </View>
        {mockClinics.map(clinic => (
          <TouchableOpacity key={clinic.id} style={[s.card, selectedId === clinic.id && s.cardActive]} onPress={() => setSelectedId(clinic.id)} activeOpacity={0.7}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.clinicName}>{clinic.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={s.rating}>{clinic.rating}</Text>
                  <Text style={s.dist}>• {clinic.distance} mi</Text>
                </View>
              </View>
              {selectedId === clinic.id && <Ionicons name="checkmark-circle" size={26} color={colors.primary} />}
            </View>
            <View style={s.infoRow}><Ionicons name="location-outline" size={13} color={tc.textSecondary} /><Text style={s.infoText}>{clinic.address}</Text></View>
            <View style={s.infoRow}><Ionicons name="time-outline" size={13} color={tc.textSecondary} /><Text style={s.infoText}>{clinic.hours}</Text></View>
            {clinic.emergencyService && <View style={s.emBadge}><Ionicons name="alert-circle" size={12} color={colors.danger} /><Text style={s.emText}>Emergency Available</Text></View>}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.btn} onPress={confirm}><Text style={s.btnText}>Confirm Selection</Text></TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 12 }} onPress={() => navigation.replace('Main')}><Text style={s.skip}>Skip for now</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (tc: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.background },
  container: { padding: spacing.md, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: tc.text, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: tc.textSecondary, textAlign: 'center' },
  card: { backgroundColor: tc.surface, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: tc.border },
  cardActive: { borderColor: colors.primary, backgroundColor: isDark ? '#1e3a5f' : '#EFF6FF' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  clinicName: { fontSize: 15, fontWeight: '600', color: tc.text },
  rating: { fontSize: 13, fontWeight: '600', color: tc.text },
  dist: { fontSize: 13, color: tc.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: tc.textSecondary, flex: 1 },
  emBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#FEF2F2', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  emText: { fontSize: 12, color: colors.danger, fontWeight: '500' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skip: { fontSize: 14, color: tc.textSecondary },
});
