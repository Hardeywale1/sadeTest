import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

type Tone = 'onDark' | 'onLight';

interface CycleProgressProps {
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  nextPeriodInDays: number;
  phase: string;
  /** Backend copy, used verbatim for edge cases such as a late period. */
  subtitle?: string;
  tone?: Tone;
}

type Segment = { key: string; label: string; days: number };

/**
 * Splits the cycle into the same four windows the backend uses in `phaseFor`,
 * so the bar always agrees with the phase name shown next to it.
 */
const buildSegments = (cycleLength: number, periodLength: number): Segment[] => {
  const ovulationDay = cycleLength - 14;
  const menstrual = Math.max(1, Math.min(periodLength, cycleLength));
  const follicular = Math.max(0, ovulationDay - 2 - menstrual);
  const ovulation = Math.max(0, Math.min(3, cycleLength - menstrual - follicular));
  const luteal = Math.max(0, cycleLength - menstrual - follicular - ovulation);
  return [
    { key: 'menstrual', label: 'Period', days: menstrual },
    { key: 'follicular', label: 'Follicular', days: follicular },
    { key: 'ovulation', label: 'Fertile', days: ovulation },
    { key: 'luteal', label: 'Luteal', days: luteal },
  ].filter((segment) => segment.days > 0);
};

const countdownLabel = (nextPeriodInDays: number) => {
  if (nextPeriodInDays <= 0) return 'Your period may start today';
  if (nextPeriodInDays === 1) return 'Your period is expected tomorrow';
  return `${nextPeriodInDays} days until your next period`;
};

export const CycleProgress: React.FC<CycleProgressProps> = ({
  cycleDay,
  cycleLength,
  periodLength,
  nextPeriodInDays,
  phase,
  subtitle,
  tone = 'onDark',
}) => {
  const safeLength = cycleLength > 0 ? cycleLength : 28;
  const safeDay = Math.min(Math.max(cycleDay, 1), safeLength);
  const segments = buildSegments(safeLength, periodLength > 0 ? periodLength : 5);
  const percent = (safeDay / safeLength) * 100;
  const palette = tone === 'onDark' ? darkTone : lightTone;

  // A late period is the one case where the backend's own wording is more accurate
  // than a countdown, so prefer it when there is nothing to count down to.
  const headline = nextPeriodInDays <= 0 && subtitle ? subtitle : countdownLabel(nextPeriodInDays);

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <Text style={[styles.countdown, palette.countdown]}>{headline}</Text>
        <Text style={[styles.dayCount, palette.dayCount]}>
          Day {safeDay} of {safeLength}
        </Text>
      </View>

      <View style={styles.trackWrapper}>
        <View style={[styles.track, palette.track]}>
          {segments.map((segment) => (
            <View
              key={segment.key}
              style={[
                styles.segment,
                { flexGrow: segment.days },
                palette.segment,
                segment.key === phase && palette.segmentActive,
              ]}
            />
          ))}
        </View>
        <View
          style={[styles.marker, palette.marker, { left: `${percent}%` }]}
          accessibilityLabel={`Cycle day ${safeDay} of ${safeLength}`}
        />
      </View>

      <View style={styles.labelRow}>
        {segments.map((segment) => (
          <Text
            key={segment.key}
            style={[
              styles.segmentLabel,
              { flexGrow: segment.days, flexShrink: 1, flexBasis: 0 },
              palette.segmentLabel,
              segment.key === phase && palette.segmentLabelActive,
            ]}
            numberOfLines={1}
          >
            {segment.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  countdown: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  dayCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  trackWrapper: {
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    gap: 2,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  segment: {
    flexBasis: 0,
    flexShrink: 1,
    height: 10,
  },
  marker: {
    position: 'absolute',
    top: -3,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 3,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 7,
  },
  segmentLabel: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});

const darkTone = StyleSheet.create({
  countdown: { color: '#FFFFFF' },
  dayCount: { color: '#FFB3B4' },
  track: { backgroundColor: 'rgba(255,255,255,0.16)' },
  segment: { backgroundColor: 'rgba(255,255,255,0.32)' },
  segmentActive: { backgroundColor: '#FFFFFF' },
  marker: { backgroundColor: '#FFFFFF', borderColor: COLORS.primary },
  segmentLabel: { color: 'rgba(255,255,255,0.6)' },
  segmentLabelActive: { color: '#FFFFFF' },
});

const lightTone = StyleSheet.create({
  countdown: { color: COLORS.primary },
  dayCount: { color: COLORS.onSurfaceVariant },
  track: { backgroundColor: COLORS.surfaceContainerHighest },
  segment: { backgroundColor: COLORS.surfaceContainerHigh },
  segmentActive: { backgroundColor: COLORS.primaryContainer },
  marker: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.cardBg },
  segmentLabel: { color: COLORS.outline },
  segmentLabelActive: { color: COLORS.primaryContainer },
});
