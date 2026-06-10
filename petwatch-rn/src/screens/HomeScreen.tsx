import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { differenceInDays, parseISO } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { colors, spacing, radius } from '../theme/colors';
import { mockPets, mockAlerts, mockVaccinations } from '../data/mockData';

const DOG_IMG = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80';
const CAT_IMG = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80';

export default function HomeScreen({ navigation }: any) {
  const { colors: tc, isDark } = useTheme();
  const s = styles(tc, isDark);
  const unread = mockAlerts.filter(a => !a.read).length;
  const highAlerts = mockAlerts.filter(a => a.severity === 'high' && !a.read);
  const upcomingVacs = mockVaccinations.filter(v => { const d = differenceInDays(parseISO(v.nextDue), new Date()); return d >= 0 && d <= 30; });
  const upcomingDeworm = mockPets.filter(p => { if (!p.nextDewormingDate) return false; const d = differenceInDays(parseISO(p.nextDewormingDate), new Date()); return d >= 0 && d <= 30; });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.header}>
          <View><Text style={s.title}>My Pets</Text><Text style={s.subtitle}>Manage your pets' health and wellness</Text></View>
          <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Alerts')}>
            <Ionicons name="notifications-outline" size={22} color={tc.text} />
            {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread}</Text></View>}
          </TouchableOpacity>
        </View>

        {highAlerts.length > 0 && (
          <TouchableOpacity style={s.alertBanner} onPress={() => navigation.navigate('Alerts')}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.alertTitle}>{highAlerts[0].title}</Text>
              <Text style={s.alertMsg} numberOfLines={2}>{highAlerts[0].message}</Text>
            </View>
          </TouchableOpacity>
        )}

        {(upcomingVacs.length > 0 || upcomingDeworm.length > 0) && (
          <View style={s.reminderCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="medical" size={18} color="#C2410C" />
              <Text style={s.reminderTitle}>Upcoming Reminders</Text>
            </View>
            {upcomingVacs.slice(0, 2).map(v => <Text key={v.id} style={s.reminderItem}>• Vaccination: {mockPets.find(p => p.id === v.petId)?.name} — {v.vaccine}</Text>)}
            {upcomingDeworm.slice(0, 2).map(p => <Text key={p.id} style={s.reminderItem}>• Deworming due for {p.name}</Text>)}
          </View>
        )}

        <View style={s.quickGrid}>
          {[{ icon: 'add-circle-outline', label: 'Add Pet', color: colors.primary, route: 'AddPet' },
            { icon: 'alert-circle-outline', label: 'Alerts', color: colors.warning, route: 'Alerts', badge: unread },
            { icon: 'calendar-outline', label: 'Appointments', color: colors.success, route: 'Appointments' }].map(item => (
            <TouchableOpacity key={item.label} style={s.quickCard} onPress={() => navigation.navigate(item.route)} activeOpacity={0.7}>
              {item.badge ? <View style={s.qBadge}><Text style={s.qBadgeText}>{item.badge}</Text></View> : null}
              <Ionicons name={item.icon as any} size={30} color={item.color} />
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.linkGrid}>
          {[{ icon: 'bulb-outline', label: 'Health Tips', sub: 'Expert advice', color: colors.secondary, bg: '#F3E8FF', route: 'HealthTips' },
            { icon: 'location-outline', label: 'Find Clinics', sub: 'Nearby vets', color: colors.primary, bg: '#EFF6FF', route: 'NearbyClinics' }].map(item => (
            <TouchableOpacity key={item.label} style={s.linkCard} onPress={() => navigation.navigate(item.route)} activeOpacity={0.7}>
              <View style={[s.linkIcon, { backgroundColor: item.bg }]}><Ionicons name={item.icon as any} size={20} color={item.color} /></View>
              <View style={{ flex: 1 }}><Text style={s.linkTitle}>{item.label}</Text><Text style={s.linkSub}>{item.sub}</Text></View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Your Pets</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddPet')}>
            <Ionicons name="add" size={16} color={colors.primary} /><Text style={s.addBtnText}>Add Pet</Text>
          </TouchableOpacity>
        </View>

        {mockPets.map(pet => (
          <TouchableOpacity key={pet.id} style={s.petCard} onPress={() => navigation.navigate('PetDetails', { petId: pet.id })} activeOpacity={0.8}>
            <Image source={{ uri: pet.species === 'dog' ? DOG_IMG : CAT_IMG }} style={s.petImg} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.petName}>{pet.name}</Text>
              <Text style={s.petInfo}>{pet.breed} • {pet.age} yrs</Text>
              <View style={s.speciesBadge}><Text style={s.speciesText}>{pet.species}</Text></View>
            </View>
            <View style={s.petActions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('ReportSymptoms', { petId: pet.id })}>
                <Ionicons name="alert-circle-outline" size={14} color={tc.textSecondary} /><Text style={s.actionBtnText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('HealthReport', { petId: pet.id })}>
                <Ionicons name="document-text-outline" size={14} color={tc.textSecondary} /><Text style={s.actionBtnText}>Health</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (tc: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.background },
  container: { padding: spacing.md, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: tc.text },
  subtitle: { fontSize: 14, color: tc.textSecondary, marginTop: 2 },
  notifBtn: { padding: 4, position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  alertBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: radius.md, padding: 14, marginBottom: 12 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#991B1B', marginBottom: 2 },
  alertMsg: { fontSize: 13, color: '#B91C1C' },
  reminderCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: radius.md, padding: 14, marginBottom: 12 },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: '#9A3412' },
  reminderItem: { fontSize: 13, color: '#C2410C', marginBottom: 2 },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  quickCard: { flex: 1, backgroundColor: tc.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: tc.border, position: 'relative' },
  qBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  qBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  quickLabel: { fontSize: 12, color: tc.text, marginTop: 6, textAlign: 'center' },
  linkGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  linkCard: { flex: 1, backgroundColor: tc.surface, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: tc.border },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 14, fontWeight: '600', color: tc.text },
  linkSub: { fontSize: 12, color: tc.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: tc.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: tc.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  petCard: { backgroundColor: tc.surface, borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: tc.border },
  petImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: tc.border },
  petName: { fontSize: 16, fontWeight: '700', color: tc.text, marginBottom: 2 },
  petInfo: { fontSize: 13, color: tc.textSecondary, marginBottom: 6 },
  speciesBadge: { backgroundColor: tc.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  speciesText: { fontSize: 11, color: tc.textSecondary, textTransform: 'capitalize' },
  petActions: { gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: tc.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 5 },
  actionBtnText: { fontSize: 12, color: tc.textSecondary },
});
