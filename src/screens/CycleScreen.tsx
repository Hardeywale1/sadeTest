import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { cycleApi } from '../api/cycleApi';
import { CycleStatus, PeriodLog, OvulationLog } from '../types';
import { COLORS } from '../theme/colors';
import { CalendarField } from '../components/CalendarField';
import { CycleProgress } from '../components/CycleProgress';
import { toast } from '../components/Toast';

const localISODate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const PHASE_NOTE: Record<string, string> = {
  menstrual: 'Menstrual days are counted from the first day of bleeding.',
  follicular: 'The follicular phase follows your period and continues toward ovulation.',
  ovulation: 'This is your estimated ovulation window, not a medical confirmation.',
  luteal: 'The luteal phase follows ovulation and usually lasts until your next period.',
};

export const CycleScreen: React.FC = () => {
  const [status, setStatus] = useState<CycleStatus | null>(null);
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [ovulations, setOvulations] = useState<OvulationLog[]>([]);
  const [bbt, setBbt] = useState('98.4');
  const [opkResult, setOpkResult] = useState<'Positive (+)' | 'Negative (-)'>('Positive (+)');
  const [periodDate, setPeriodDate] = useState(localISODate());
  const [ovulationDate, setOvulationDate] = useState(localISODate());
  const [flow, setFlow] = useState<'spotting' | 'light' | 'medium' | 'heavy'>('medium');
  const [savingPeriod, setSavingPeriod] = useState(false);

  useEffect(() => {
    loadCycleData();
  }, []);

  const loadCycleData = async () => {
    try {
      const [statusRes, periodRes, ovuRes] = await Promise.allSettled([
        cycleApi.getStatus(),
        cycleApi.listPeriods(6),
        cycleApi.listOvulation(6),
      ]);

      if (statusRes.status === 'fulfilled') setStatus(statusRes.value);
      if (periodRes.status === 'fulfilled') setPeriods(periodRes.value.periods);
      if (ovuRes.status === 'fulfilled') setOvulations(ovuRes.value.ovulation_logs);
    } catch (e) {
      console.warn('Cycle load error:', e);
    }
  };

  const handleSaveOvulationLog = async () => {
    try {
      const temperature = Number(bbt);
      if (!Number.isFinite(temperature) || temperature < 95 || temperature > 105) {
        toast('Check temperature', 'Enter a basal body temperature between 95°F and 105°F.', 'error');
        return;
      }
      await Promise.all([cycleApi.logOvulation({
        date: ovulationDate,
        is_confirmed: opkResult === 'Positive (+)',
        method: 'opk',
      }), cycleApi.logSymptoms({ date: ovulationDate, bbt: temperature })]);
      toast('Saved', 'Fertility & ovulation log recorded.', 'success');
      loadCycleData();
    } catch (err: any) {
      toast('Could not save', err?.response?.data?.error || 'Failed to save ovulation log.', 'error');
    }
  };

  const handleLogPeriod = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodDate)) {
      toast('Check date', 'Use YYYY-MM-DD for the first day of bleeding.', 'error');
      return;
    }
    setSavingPeriod(true);
    try {
      await cycleApi.logPeriod({ start_date: periodDate, flow_days: [{ date: periodDate, intensity: flow }] });
      toast('Period logged', 'Your cycle day and phase have been recalculated.', 'success');
      await loadCycleData();
    } catch (error: any) {
      toast('Could not save', error?.response?.data?.error || 'Please try logging your period again.', 'error');
    } finally {
      setSavingPeriod(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroBadge}>CYCLE &amp; FERTILITY</Text>
        <Text style={styles.heroTitle}>{status?.last_period_start ? status.heading : 'Begin when you are ready'}</Text>
        <Text style={styles.heroSubtitle}>
          {status?.last_period_start ? status.subtitle : 'Add your latest period to begin phase estimates.'}
        </Text>
        {status?.last_period_start ? (
          <>
            <CycleProgress
              cycleDay={status.cycle_day}
              cycleLength={status.avg_cycle_length}
              periodLength={status.avg_period_length}
              nextPeriodInDays={status.next_period_in_days}
              phase={status.phase}
              subtitle={status.subtitle}
            />
            <Text style={styles.phaseNote}>{PHASE_NOTE[status.phase]}</Text>
          </>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Log your period</Text>
      <View style={styles.card}>
        <CalendarField label="First day of bleeding" value={periodDate} onChange={setPeriodDate} maximumDate={localISODate()} />
        <Text style={[styles.cardLabel, { marginTop: 16 }]}>Today’s flow</Text>
        <View style={styles.flowRow}>{(['spotting', 'light', 'medium', 'heavy'] as const).map((item) => <TouchableOpacity key={item} style={[styles.flowChip, flow === item && styles.flowChipActive]} onPress={() => setFlow(item)}><Text style={[styles.flowText, flow === item && styles.flowTextActive]}>{item}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleLogPeriod} disabled={savingPeriod}>{savingPeriod ? <Text style={styles.saveBtnText}>Saving...</Text> : <Text style={styles.saveBtnText}>Save Period</Text>}</TouchableOpacity>
      </View>

      {/* Ovulation Predictor Log */}
      <Text style={styles.sectionTitle}>Ovulation Tracker (OPK)</Text>
      <View style={styles.card}>
        <CalendarField label="Test date" value={ovulationDate} onChange={setOvulationDate} maximumDate={localISODate()} />
        <Text style={styles.cardLabel}>Today's OPK Test Result</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.opkBtn, opkResult === 'Positive (+)' && styles.opkBtnActive]}
            onPress={() => setOpkResult('Positive (+)')}
          >
            <Text style={[styles.opkBtnText, opkResult === 'Positive (+)' && styles.opkBtnTextActive]}>
              Positive (+)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.opkBtn, opkResult === 'Negative (-)' && styles.opkBtnActive]}
            onPress={() => setOpkResult('Negative (-)')}
          >
            <Text style={[styles.opkBtnText, opkResult === 'Negative (-)' && styles.opkBtnTextActive]}>
              Negative (-)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.cardLabel, { marginTop: 16 }]}>Basal Body Temperature (°F)</Text>
        <TextInput style={styles.input} value={bbt} onChangeText={setBbt} keyboardType="numeric" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveOvulationLog}>
          <Text style={styles.saveBtnText}>Save Ovulation Log</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Period History */}
      <Text style={styles.sectionTitle}>Recent Period History</Text>
      {periods.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No period logs recorded yet.</Text>
        </View>
      ) : (
        periods.map((p) => (
          <View key={p.id} style={styles.historyCard}>
            <Text style={styles.historyDate}>Start Date: {p.start_date}</Text>
            <Text style={styles.historyFlow}>Flow Days Logged: {p.flow_days?.length || 0} days</Text>
          </View>
        ))
      )}
      <Text style={styles.sectionTitle}>Ovulation & fertility history</Text>
      {ovulations.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyText}>No ovulation logs recorded yet.</Text></View> : [...ovulations].sort((a, b) => b.date.localeCompare(a.date)).map((item) => <View key={`${item.date}-${item.method}`} style={styles.historyCard}><Text style={styles.historyDate}>{item.date}</Text><Text style={styles.historyFlow}>{item.method?.toUpperCase() || 'Observation'} · {item.is_confirmed ? 'Positive / confirmed' : 'Negative / not confirmed'}</Text></View>)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  heroBanner: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  heroBadge: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.8,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  heroSubtitle: {
    color: '#FFDAD9',
    fontSize: 12,
  },
  phaseNote: { color: 'rgba(255,255,255,0.78)', fontSize: 11, lineHeight: 16, marginTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flowChip: { borderWidth: 1, borderColor: COLORS.roseBorder, backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 },
  flowChipActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  flowText: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  flowTextActive: { color: '#FFFFFF' },
  opkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
  },
  opkBtnActive: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primaryContainer,
  },
  opkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  opkBtnTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  historyFlow: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
});
