import React, { useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DemoRole } from '../types';
import { COLORS } from '../theme/colors';

type Props = {
  onSelect: (role: DemoRole) => Promise<unknown>;
};

const ACCOUNTS: Array<{ role: DemoRole; title: string; name: string; description: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = [
  { role: 'patient', title: 'Patient', name: 'Akinyemi Opemipo', description: 'Follow a complete menstrual-health and care journey.', icon: 'account-heart-outline' },
  { role: 'clinician', title: 'Doctor', name: 'Dr Faith Oni', description: 'Review the case, clinical support, tests and follow-up.', icon: 'doctor' },
  { role: 'lab', title: 'Laboratory', name: 'Continuity Diagnostics', description: 'Receive the order, manage collection and upload results.', icon: 'flask-outline' },
];

export const DemoAccessScreen: React.FC<Props> = ({ onSelect }) => {
  const [opening, setOpening] = useState<DemoRole | null>(null);
  const [error, setError] = useState('');

  const open = async (role: DemoRole) => {
    setOpening(role);
    setError('');
    try {
      await onSelect(role);
    } catch (value: any) {
      setError(value?.response?.data?.error || 'This demo account could not be opened.');
      setOpening(null);
    }
  };

  return <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.demoLabel}><View style={styles.liveDot}/><Text style={styles.demoLabelText}>INTERACTIVE DEMO</Text></View>
        <Text style={styles.brand}>Sadé</Text>
        <Text style={styles.title}>See continuity of care in action.</Text>
        <Text style={styles.subtitle}>Choose a workspace to explore the same care journey from each participant’s perspective.</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.accounts}>
        {ACCOUNTS.map((account) => <TouchableOpacity key={account.role} style={styles.card} onPress={() => open(account.role)} disabled={opening !== null} accessibilityRole="button" accessibilityLabel={`Continue as ${account.title}`}>
          <View style={styles.icon}><MaterialCommunityIcons name={account.icon} size={27} color={COLORS.primary}/></View>
          <View style={styles.cardCopy}>
            <Text style={styles.role}>{account.title}</Text>
            <Text style={styles.name}>{account.name}</Text>
            <Text style={styles.description}>{account.description}</Text>
          </View>
          {opening === account.role ? <ActivityIndicator color={COLORS.primary}/> : <MaterialCommunityIcons name="arrow-right" size={22} color={COLORS.primary}/>} 
        </TouchableOpacity>)}
      </View>
      <View style={styles.note}><MaterialCommunityIcons name="information-outline" size={18} color={COLORS.emerald}/><Text style={styles.noteText}>This demonstration contains synthetic sample information. No real patient health data is shown.</Text></View>
    </ScrollView>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  page: { flexGrow: 1, width: '100%', maxWidth: 980, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: Platform.OS === 'web' ? 54 : 30 },
  hero: { maxWidth: 680, marginBottom: 30 },
  demoLabel: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.emeraldLight },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.emerald },
  demoLabelText: { color: COLORS.emerald, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  brand: { color: COLORS.primary, fontFamily: 'serif', fontSize: 23, fontWeight: '800', marginTop: 22 },
  title: { maxWidth: 620, color: COLORS.onSurface, fontFamily: 'serif', fontSize: Platform.OS === 'web' ? 46 : 36, lineHeight: Platform.OS === 'web' ? 52 : 42, fontWeight: '700', marginTop: 9 },
  subtitle: { maxWidth: 620, color: COLORS.onSurfaceVariant, fontSize: 15, lineHeight: 24, marginTop: 14 },
  accounts: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 14 },
  card: { flex: 1, minHeight: 190, borderWidth: 1, borderColor: COLORS.roseBorder, borderRadius: 22, backgroundColor: COLORS.cardBg, padding: 20, alignItems: 'flex-start', flexDirection: 'column' },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerLow },
  cardCopy: { flex: 1, marginTop: 17 },
  role: { color: COLORS.primary, fontSize: 11, fontWeight: '900', letterSpacing: .8, textTransform: 'uppercase' },
  name: { color: COLORS.onSurface, fontFamily: 'serif', fontSize: 19, fontWeight: '700', marginTop: 5 },
  description: { color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 12 },
  note: { flexDirection: 'row', gap: 9, alignItems: 'center', maxWidth: 650, alignSelf: 'center', marginTop: 26, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 14, backgroundColor: COLORS.emeraldLight },
  noteText: { flex: 1, color: COLORS.emerald, fontSize: 11, lineHeight: 16 },
  error: { color: COLORS.error, fontSize: 12, marginBottom: 14 },
});
