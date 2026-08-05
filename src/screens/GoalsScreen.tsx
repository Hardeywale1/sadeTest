import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { goalsApi } from '../api/goalsApi';
import { interestsApi } from '../api/profileApi';
import { Goal, InterestCategory } from '../types';
import { COLORS } from '../theme/colors';

export const GoalsScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [presets, setPresets] = useState<Goal[]>([]);
  const [catalog, setCatalog] = useState<InterestCategory[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyID, setBusyID] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [mine, presetResponse, categories] = await Promise.all([goalsApi.listMyGoals(), goalsApi.listPresets(), interestsApi.getCatalog()]);
      setGoals(mine.goals);
      setPresets(presetResponse.goals);
      setCatalog(categories);
      setValues(Object.fromEntries(mine.goals.map((goal) => [goal.id, String(goal.current_value)])));
    } catch (error: any) {
      Alert.alert('Could not load goals', error?.response?.data?.error || 'Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const assign = async (preset: Goal) => {
    setBusyID(preset.id);
    try { await goalsApi.assignPreset(preset.id); await load(); }
    catch (error: any) { Alert.alert('Could not add goal', error?.response?.data?.error || 'Please try again.'); }
    finally { setBusyID(''); }
  };

  const update = async (goal: Goal) => {
    const amount = Number(values[goal.id]);
    if (!Number.isFinite(amount) || amount < 0) return Alert.alert('Check progress', 'Enter a valid progress value.');
    setBusyID(goal.id);
    try { await goalsApi.updateProgress(goal.id, amount); await load(); }
    catch (error: any) { Alert.alert('Could not update goal', error?.response?.data?.error || 'Please try again.'); }
    finally { setBusyID(''); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primaryContainer} /></View>;
  const activeGoals = goals.filter((goal) => !goal.is_archived);

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><TouchableOpacity style={styles.close} onPress={onClose}><MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} /></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.title}>Goals & Progress</Text><Text style={styles.subtitle}>Small promises, gently tracked.</Text></View></View>
    <Text style={styles.section}>Your active goals</Text>
    {activeGoals.length ? activeGoals.map((goal) => {
      const percent = goal.target_value ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
      return <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalTop}><View style={styles.goalCopy}><Text style={styles.goalTitle}>{goal.title}</Text><Text style={styles.goalMeta}>{catalog.find((item) => item.id === goal.interest_id)?.name} · target {goal.target_value} {goal.unit}</Text></View>{goal.is_completed ? <MaterialCommunityIcons name="check-decagram" size={24} color={COLORS.primaryContainer} /> : null}</View>
        <View style={styles.progressTrack}><View style={[styles.progress, { width: `${percent}%` }]} /></View>
        <View style={styles.updateRow}><TextInput style={styles.valueInput} keyboardType="decimal-pad" value={values[goal.id] ?? String(goal.current_value)} onChangeText={(value: string) => setValues((current) => ({ ...current, [goal.id]: value }))} /><Text style={styles.unit}>{goal.unit}</Text><TouchableOpacity style={styles.updateButton} onPress={() => update(goal)} disabled={busyID === goal.id}><Text style={styles.updateText}>{busyID === goal.id ? 'Saving…' : 'Update'}</Text></TouchableOpacity></View>
      </View>;
    }) : <View style={styles.empty}><Text style={styles.emptyText}>Choose a preset below to begin your first goal.</Text></View>}

    <Text style={styles.section}>Preset goals</Text>
    {presets.map((preset) => {
      const added = goals.some((goal) => goal.title === preset.title && !goal.is_archived);
      return <View key={preset.id} style={styles.presetCard}><View style={styles.presetIcon}><MaterialCommunityIcons name="star-four-points-outline" size={19} color={COLORS.primaryContainer} /></View><View style={styles.goalCopy}><Text style={styles.goalTitle}>{preset.title}</Text><Text style={styles.goalMeta}>{preset.description}</Text></View><TouchableOpacity style={[styles.addButton, added && styles.addedButton]} disabled={added || busyID === preset.id} onPress={() => assign(preset)}><Text style={[styles.addText, added && styles.addedText]}>{added ? 'Added' : busyID === preset.id ? '…' : 'Add'}</Text></TouchableOpacity></View>;
    })}
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, content: { padding: 20, paddingBottom: 45, maxWidth: 500, width: '100%', alignSelf: 'center' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }, close: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, title: { fontFamily: 'serif', color: COLORS.primary, fontSize: 26, fontWeight: '700' }, subtitle: { color: COLORS.onSurfaceVariant, fontSize: 12 }, section: { color: COLORS.onSurface, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 7, marginBottom: 10 },
  goalCard: { backgroundColor: COLORS.cardBg, borderRadius: 19, padding: 16, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, marginBottom: 10 }, goalTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, goalCopy: { flex: 1 }, goalTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '700' }, goalMeta: { color: COLORS.onSurfaceVariant, fontSize: 10, lineHeight: 15, marginTop: 2 }, progressTrack: { height: 7, borderRadius: 7, backgroundColor: COLORS.surfaceContainerHighest, overflow: 'hidden', marginVertical: 12 }, progress: { height: 7, backgroundColor: COLORS.primaryContainer, borderRadius: 7 }, updateRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, valueInput: { width: 72, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.primary, fontWeight: '800' }, unit: { flex: 1, color: COLORS.outline, fontSize: 11 }, updateButton: { backgroundColor: COLORS.primary, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 }, updateText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  presetCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, marginBottom: 8 }, presetIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }, addButton: { backgroundColor: COLORS.primaryContainer, borderRadius: 99, minWidth: 54, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 }, addedButton: { backgroundColor: COLORS.surfaceContainerHigh }, addText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' }, addedText: { color: COLORS.primary }, empty: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16, marginBottom: 14 }, emptyText: { color: COLORS.onSurfaceVariant, fontSize: 12, textAlign: 'center' },
});
