import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cycleApi } from '../api/cycleApi';
import { logsApi } from '../api/logsApi';
import { goalsApi } from '../api/goalsApi';
import { CycleProgress } from '../components/CycleProgress';
import { CycleStatus, Goal, LogSummary } from '../types';
import { COLORS } from '../theme/colors';

const PHASE_GUIDANCE: Record<string, string> = {
  menstrual: 'Your body may need more rest, warmth and gentle nourishment today.',
  follicular: 'Energy often begins to rise as your body prepares for ovulation.',
  ovulation: 'You are around your estimated fertile window. Log an OPK or temperature for more context.',
  luteal: 'Energy can soften in this phase. Notice sleep, mood, cravings and PMS patterns.',
};

export const DashboardScreen: React.FC<{ onNavigate?: (tab: 'cycle' | 'journal', trackerView?: 'today' | 'cycle') => void }> = ({ onNavigate }) => {
  const { greetingName } = useAuth();
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [journeyGoals, setJourneyGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statusData, goalsData, summaryData] = await Promise.allSettled([
        cycleApi.getStatus(),
        goalsApi.listMyGoals(),
        logsApi.getSummary('interest-diet', 30),
      ]);

      if (statusData.status === 'fulfilled') setCycleStatus(statusData.value);
      if (goalsData.status === 'fulfilled') {
        setGoals(goalsData.value.goals);
        setJourneyGoals(goalsData.value.goals.filter((goal) => !goal.is_archived).map((goal) => goal.title));
      }
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
    } catch (e) {
      console.warn('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <Text style={styles.greetingTitle}>Hello, {greetingName}</Text>
        <Text style={styles.greetingSubtitle}>Welcome back to your Sadé space.</Text>
      </View>

      {/* Cycle Phase Widget */}
      <TouchableOpacity
        style={styles.cycleCard}
        activeOpacity={0.9}
        onPress={() => onNavigate?.('cycle', 'cycle')}
        accessibilityRole="button"
        accessibilityLabel="Open cycle tracking"
      >
        <View style={styles.cycleBadgeRow}>
          <Text style={styles.cycleBadge}>
            {cycleStatus?.last_period_start ? cycleStatus.phase_label.toUpperCase() : 'YOUR CYCLE'}
          </Text>
          <Text style={styles.cycleDay}>
            {cycleStatus?.last_period_start ? `Day ${cycleStatus.cycle_day} of ${cycleStatus.avg_cycle_length}` : 'Add cycle details'}
          </Text>
        </View>
        <Text style={styles.cycleHeading}>{cycleStatus?.last_period_start ? cycleStatus.heading : 'Your cycle, at your pace'}</Text>
        <Text style={styles.cycleDesc}>
          {cycleStatus?.last_period_start ? PHASE_GUIDANCE[cycleStatus.phase] : 'Log a period when you are ready to receive phase-aware estimates.'}
        </Text>
        {cycleStatus?.last_period_start ? (
          <CycleProgress
            cycleDay={cycleStatus.cycle_day}
            cycleLength={cycleStatus.avg_cycle_length}
            periodLength={cycleStatus.avg_period_length}
            nextPeriodInDays={cycleStatus.next_period_in_days}
            phase={cycleStatus.phase}
            subtitle={cycleStatus.subtitle}
          />
        ) : (
          <Text style={styles.cycleCta}>Tap to log your last period →</Text>
        )}
      </TouchableOpacity>

      {journeyGoals.length ? <>
        <Text style={styles.sectionHeader}>Your Care Focus</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusRow}>
          {journeyGoals.map((goal) => <View key={goal} style={styles.focusChip}><Text style={styles.focusText}>{goal}</Text></View>)}
        </ScrollView>
      </> : null}

      {/* Daily Quick Actions */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.quickActionRow}>
        <TouchableOpacity style={styles.actionChip} onPress={() => onNavigate?.('cycle', 'cycle')}>
          <Text style={styles.actionChipIcon}>🩸</Text>
          <Text style={styles.actionChipText}>Log Period</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => onNavigate?.('cycle', 'today')}>
          <Text style={styles.actionChipIcon}>😊</Text>
          <Text style={styles.actionChipText}>Mood Check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionChip} onPress={() => onNavigate?.('journal')}>
          <Text style={styles.actionChipIcon}>📖</Text>
          <Text style={styles.actionChipText}>Journal</Text>
        </TouchableOpacity>
      </View>

      {/* Active Goals Section */}
      <Text style={styles.sectionHeader}>Active Goals ({goals.length})</Text>
      {goals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active goals set. Start a daily goal!</Text>
        </View>
      ) : (
        goals.slice(0, 3).map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalStreak}>🔥 {goal.streak}d streak</Text>
            </View>
            <Text style={styles.goalTarget}>
              {goal.current_value} / {goal.target_value} {goal.unit}
            </Text>
          </View>
        ))
      )}

      {/* 30-Day Logging Summary */}
      <Text style={styles.sectionHeader}>30-Day Activity Summary</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Logs Recorded</Text>
        <Text style={styles.summaryValue}>{summary?.log_count || 0} Entries</Text>
        <Text style={styles.summarySubtitle}>Consistency builds hormonal harmony.</Text>
      </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  greetingHeader: {
    marginBottom: 20,
  },
  greetingTitle: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  cycleCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  cycleBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cycleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  cycleDay: {
    color: '#FFB3B4',
    fontSize: 12,
    fontWeight: '600',
  },
  cycleHeading: {
    fontFamily: 'serif',
    fontSize: 22,
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cycleDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  cycleCta: {
    fontSize: 12,
    color: '#FFB3B4',
    fontWeight: '700',
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  focusRow: { gap: 8, paddingBottom: 20 },
  focusChip: { backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  focusText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  actionChip: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  actionChipIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  goalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  goalStreak: {
    fontSize: 12,
    color: COLORS.primaryContainer,
    fontWeight: '700',
  },
  goalTarget: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  summaryValue: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginVertical: 4,
  },
  summarySubtitle: {
    fontSize: 11,
    color: COLORS.outline,
  },
});
