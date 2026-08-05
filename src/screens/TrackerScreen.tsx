import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarField } from '../components/CalendarField';
import { interestsApi } from '../api/profileApi';
import { logsApi } from '../api/logsApi';
import { cycleApi } from '../api/cycleApi';
import { CycleScreen } from './CycleScreen';
import { InterestCategory, Log, MedicationLog, PainJournal, SymptomLog } from '../types';
import { COLORS } from '../theme/colors';

type ViewMode = 'today' | 'history' | 'cycle';

const localISODate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const METRICS: Record<string, { key: string; label: string; unit: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  'interest-diet': { key: 'water_litres', label: 'Water', unit: 'litres', icon: 'cup-water' },
  'interest-fitness': { key: 'movement_minutes', label: 'Movement', unit: 'minutes', icon: 'run' },
  'interest-mmes': { key: 'mood_score', label: 'Mood score', unit: 'out of 10', icon: 'weather-sunny' },
  'interest-collagen': { key: 'self_care_minutes', label: 'Self-care', unit: 'minutes', icon: 'face-woman-shimmer-outline' },
};

const numericValue = (log: Log) => {
  const value = Object.values(log.payload || {}).find((item) => typeof item === 'number' || !Number.isNaN(Number(item)));
  return value === undefined ? 0 : Number(value);
};

export const TrackerScreen: React.FC<{ initialView?: ViewMode }> = ({ initialView = 'today' }) => {
  const [view, setView] = useState<ViewMode>(initialView);
  const [catalog, setCatalog] = useState<InterestCategory[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [pain, setPain] = useState<PainJournal[]>([]);
  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [interestID, setInterestID] = useState('interest-diet');
  const [date, setDate] = useState(localISODate());
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const metric = METRICS[interestID] || { key: 'value', label: 'Value', unit: '', icon: 'chart-line' as const };
  const chartLogs = useMemo(() => logs.filter((item) => item.interest_id === interestID).slice(0, 7).reverse(), [logs, interestID]);
  const chartMax = Math.max(1, ...chartLogs.map(numericValue));

  const load = async () => {
    setLoading(true);
    const [catalogRes, logRes, symptomRes, painRes, medicationRes] = await Promise.allSettled([
      interestsApi.getCatalog(), logsApi.listLogs(undefined, 100), cycleApi.listSymptomsHistory(50), cycleApi.listPain(50), cycleApi.listMedications(),
    ]);
    if (catalogRes.status === 'fulfilled') {
      setCatalog(catalogRes.value);
      if (catalogRes.value.length && !catalogRes.value.some((item) => item.id === interestID)) setInterestID(catalogRes.value[0].id);
    }
    if (logRes.status === 'fulfilled') setLogs(logRes.value.logs);
    if (symptomRes.status === 'fulfilled') setSymptoms(symptomRes.value.symptoms);
    if (painRes.status === 'fulfilled') setPain(painRes.value.entries);
    if (medicationRes.status === 'fulfilled') setMedications(medicationRes.value.medications);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveLog = async () => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return Alert.alert('Check your entry', `Add a valid ${metric.label.toLowerCase()} value.`);
    setSaving(true);
    try {
      const payload = { [metric.key]: amount };
      const existing = logs.find((item) => item.interest_id === interestID && item.date === date);
      if (existing) await logsApi.updateLog(existing.id, { payload, note });
      else await logsApi.createLog({ interest_id: interestID, date, payload, note });
      setValue('');
      setNote('');
      await load();
      setView('history');
    } catch (error: any) {
      Alert.alert('Could not save', error?.response?.data?.error || 'Your daily log could not be saved. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primaryContainer} /></View>;

  return <View style={styles.container}>
    <View style={styles.top}>
      <Text style={styles.title}>Your Tracker</Text>
      <Text style={styles.subtitle}>Log today, then watch your patterns grow over time.</Text>
      <View style={styles.tabs}>{(['today', 'history', 'cycle'] as const).map((item) => <TouchableOpacity key={item} style={[styles.tab, view === item && styles.tabActive]} onPress={() => setView(item)}><Text style={[styles.tabText, view === item && styles.tabTextActive]}>{item === 'today' ? 'Log today' : item === 'history' ? 'History' : 'Cycle'}</Text></TouchableOpacity>)}</View>
    </View>

    {view === 'cycle' ? <CycleScreen /> : <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {view === 'today' ? <>
        <Text style={styles.sectionTitle}>What are you caring for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestRow}>{catalog.map((item) => <TouchableOpacity key={item.id} style={[styles.interestChip, interestID === item.id && styles.interestChipActive]} onPress={() => setInterestID(item.id)}><Text style={[styles.interestText, interestID === item.id && styles.interestTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
        <View style={styles.card}>
          <CalendarField label="Log date" value={date} onChange={setDate} maximumDate={localISODate()} />
          <View style={styles.metricHeading}><MaterialCommunityIcons name={metric.icon} size={24} color={COLORS.primaryContainer} /><Text style={styles.metricTitle}>{metric.label}</Text></View>
          <TextInput style={styles.input} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Enter ${metric.unit}`} placeholderTextColor={COLORS.outline} />
          <Text style={styles.inputLabel}>Optional note</Text>
          <TextInput style={[styles.input, styles.note]} value={note} onChangeText={setNote} multiline placeholder="How did today feel?" placeholderTextColor={COLORS.outline} />
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveLog} disabled={saving}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save daily log'}</Text></TouchableOpacity>
        </View>
      </> : <>
        <View style={styles.historyHeader}><View><Text style={styles.sectionTitle}>Your progress chart</Text><Text style={styles.historyHint}>Latest seven {catalog.find((item) => item.id === interestID)?.name.toLowerCase() || 'wellness'} logs</Text></View><TouchableOpacity style={styles.addSmall} onPress={() => setView('today')}><MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" /><Text style={styles.addSmallText}>Log</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestRow}>{catalog.map((item) => <TouchableOpacity key={item.id} style={[styles.interestChip, interestID === item.id && styles.interestChipActive]} onPress={() => setInterestID(item.id)}><Text style={[styles.interestText, interestID === item.id && styles.interestTextActive]}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
        <View style={styles.chartCard}>
          {chartLogs.length ? <View style={styles.chart}>{chartLogs.map((item) => <View key={item.id} style={styles.barColumn}><Text style={styles.barValue}>{numericValue(item)}</Text><View style={[styles.bar, { height: Math.max(8, (numericValue(item) / chartMax) * 118) }]} /><Text style={styles.barDate}>{item.date.slice(5)}</Text></View>)}</View> : <Text style={styles.emptyText}>No logs in this category yet.</Text>}
        </View>
        <Text style={styles.sectionTitle}>Daily log history</Text>
        {logs.length ? logs.map((item) => <View key={item.id} style={styles.historyCard}><View style={styles.historyIcon}><MaterialCommunityIcons name={METRICS[item.interest_id]?.icon || 'chart-line'} size={19} color={COLORS.primaryContainer} /></View><View style={styles.historyCopy}><Text style={styles.historyTitle}>{catalog.find((entry) => entry.id === item.interest_id)?.name || 'Wellness log'}</Text><Text style={styles.historyMeta}>{item.date} · {Object.entries(item.payload || {}).map(([key, amount]) => `${key.replace(/_/g, ' ')}: ${amount}`).join(', ')}</Text>{item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}</View></View>) : <Text style={styles.emptyText}>Your saved daily logs will appear here.</Text>}
        <Text style={styles.sectionTitle}>Cycle & symptom history</Text>
        <View style={styles.statRow}><View style={styles.stat}><Text style={styles.statValue}>{symptoms.length}</Text><Text style={styles.statLabel}>Symptom logs</Text></View><View style={styles.stat}><Text style={styles.statValue}>{pain.length}</Text><Text style={styles.statLabel}>Pain entries</Text></View><View style={styles.stat}><Text style={styles.statValue}>{medications.length}</Text><Text style={styles.statLabel}>Medications</Text></View></View>
        {[...pain.map((item) => ({ id: item.id, date: item.date, title: `Pain ${item.pain_level}/10`, detail: item.location?.join(', ') })), ...symptoms.map((item) => ({ id: `symptom-${item.date}`, date: item.date, title: item.mood ? `Mood: ${item.mood}` : 'Symptom check-in', detail: [...(item.pms || []), ...(item.ailments || [])].join(', ') }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((item) => <View key={item.id} style={styles.compactHistory}><Text style={styles.compactDate}>{item.date}</Text><View style={styles.historyCopy}><Text style={styles.historyTitle}>{item.title}</Text>{item.detail ? <Text style={styles.historyMeta}>{item.detail}</Text> : null}</View></View>)}
      </>}
    </ScrollView>}
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  top: { paddingHorizontal: 20, paddingTop: 18, maxWidth: 500, width: '100%', alignSelf: 'center' }, title: { fontFamily: 'serif', color: COLORS.primary, fontSize: 27, fontWeight: '700' }, subtitle: { color: COLORS.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerHigh, padding: 4, borderRadius: 99, marginTop: 15, marginBottom: 5 }, tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 99 }, tabActive: { backgroundColor: COLORS.primaryContainer }, tabText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '700' }, tabTextActive: { color: '#FFFFFF' },
  content: { padding: 20, paddingTop: 14, paddingBottom: 40, maxWidth: 500, width: '100%', alignSelf: 'center' }, sectionTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 8, marginBottom: 10 },
  interestRow: { gap: 8, paddingBottom: 16 }, interestChip: { borderWidth: 1, borderColor: COLORS.roseBorder, backgroundColor: COLORS.cardBg, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9 }, interestChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, interestText: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '700' }, interestTextActive: { color: '#FFFFFF' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest }, metricHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 }, metricTitle: { fontFamily: 'serif', color: COLORS.primary, fontSize: 19, fontWeight: '700' }, inputLabel: { color: COLORS.onSurface, fontSize: 12, fontWeight: '700', marginTop: 15, marginBottom: 7 }, input: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.onSurface, fontSize: 14 }, note: { minHeight: 82, textAlignVertical: 'top' }, saveButton: { backgroundColor: COLORS.primaryContainer, paddingVertical: 14, borderRadius: 99, alignItems: 'center', marginTop: 16 }, saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, disabled: { opacity: 0.55 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, historyHint: { color: COLORS.outline, fontSize: 11, marginTop: -7, marginBottom: 10 }, addSmall: { flexDirection: 'row', gap: 3, alignItems: 'center', backgroundColor: COLORS.primaryContainer, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 }, addSmallText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 }, chartCard: { minHeight: 180, backgroundColor: COLORS.cardBg, borderRadius: 21, padding: 16, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, justifyContent: 'center', marginBottom: 18 }, chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 7 }, barColumn: { flex: 1, height: 150, alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: '65%', maxWidth: 34, backgroundColor: COLORS.primaryContainer, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, barValue: { color: COLORS.primary, fontSize: 9, fontWeight: '800', marginBottom: 3 }, barDate: { color: COLORS.outline, fontSize: 8, marginTop: 4 },
  historyCard: { flexDirection: 'row', gap: 11, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, marginBottom: 8 }, historyIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }, historyCopy: { flex: 1 }, historyTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '700' }, historyMeta: { color: COLORS.onSurfaceVariant, fontSize: 10, lineHeight: 15, marginTop: 2 }, historyNote: { color: COLORS.outline, fontFamily: 'serif', fontSize: 11, fontStyle: 'italic', marginTop: 4 }, emptyText: { color: COLORS.onSurfaceVariant, fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 13 }, stat: { flex: 1, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 16, padding: 12, alignItems: 'center' }, statValue: { fontFamily: 'serif', color: COLORS.primary, fontSize: 22, fontWeight: '700' }, statLabel: { color: COLORS.onSurfaceVariant, fontSize: 9, textAlign: 'center' }, compactHistory: { flexDirection: 'row', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHighest }, compactDate: { color: COLORS.primaryContainer, fontSize: 10, fontWeight: '800', width: 70 },
});
