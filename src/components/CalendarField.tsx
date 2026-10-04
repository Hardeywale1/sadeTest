import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISO = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const CalendarField = ({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  yearSelection = false,
}: {
  label: string;
  value?: string;
  onChange: (date: string) => void;
  minimumDate?: string;
  maximumDate?: string;
  yearSelection?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  const [selectingYear, setSelectingYear] = useState(false);
  const [month, setMonth] = useState(() => {
    const selected = parseISO(value);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const first = month.getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  const open = () => {
    const selected = parseISO(value);
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setSelectingYear(yearSelection && !value);
    setVisible(true);
  };

  const moveMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const max = maximumDate ? parseISO(maximumDate) : undefined;
  const min = minimumDate ? parseISO(minimumDate) : undefined;
  const maximumYear = max?.getFullYear() ?? new Date().getFullYear() + 100;
  const minimumYear = min?.getFullYear() ?? maximumYear - 120;
  const years = Array.from({ length: maximumYear - minimumYear + 1 }, (_, index) => maximumYear - index);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.trigger} onPress={open} accessibilityRole="button">
        <MaterialCommunityIcons name="calendar-month-outline" size={21} color={COLORS.primaryContainer} />
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Choose a date'}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.onSurfaceVariant} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.calendar}>
            <View style={styles.monthRow}>
              {!selectingYear ? <TouchableOpacity style={styles.iconButton} onPress={() => moveMonth(-1)}><MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.primary} /></TouchableOpacity> : <View style={styles.iconButton} />}
              <TouchableOpacity disabled={!yearSelection} onPress={() => setSelectingYear((current) => !current)} accessibilityRole={yearSelection ? 'button' : undefined}>
                <Text style={styles.monthTitle}>{selectingYear ? 'Select year' : `${MONTHS[month.getMonth()]} ${month.getFullYear()}`}</Text>
              </TouchableOpacity>
              {!selectingYear ? <TouchableOpacity style={styles.iconButton} onPress={() => moveMonth(1)}><MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} /></TouchableOpacity> : <View style={styles.iconButton} />}
            </View>
            {selectingYear ? <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
              {years.map((year) => <TouchableOpacity key={year} style={[styles.yearCell, year === month.getFullYear() && styles.selectedYear]} onPress={() => { setMonth((current) => new Date(year, current.getMonth(), 1)); setSelectingYear(false); }}>
                <Text style={[styles.yearText, year === month.getFullYear() && styles.selectedYearText]}>{year}</Text>
              </TouchableOpacity>)}
            </ScrollView> : <View style={styles.grid}>
              {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
              {cells.map((day, index) => {
                if (!day) return <View key={`blank-${index}`} style={styles.dayCell} />;
                const candidate = new Date(month.getFullYear(), month.getMonth(), day);
                const iso = toISO(candidate);
                const disabled = (!!max && candidate.getTime() > max.getTime()) || (!!min && candidate.getTime() < min.getTime());
                const selected = value === iso;
                return <TouchableOpacity key={iso} style={[styles.dayCell, selected && styles.selectedDay]} disabled={disabled} onPress={() => { onChange(iso); setVisible(false); }}>
                  <Text style={[styles.dayText, selected && styles.selectedDayText, disabled && styles.disabledDay]}>{day}</Text>
                </TouchableOpacity>;
              })}
            </View>}
            <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  trigger: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: COLORS.roseBorder, backgroundColor: COLORS.cardBg, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, color: COLORS.onSurface, fontSize: 14, fontWeight: '600' },
  placeholder: { color: COLORS.outline, fontWeight: '400' },
  overlay: { flex: 1, backgroundColor: 'rgba(42, 20, 27, 0.48)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  calendar: { width: '100%', maxWidth: 380, backgroundColor: COLORS.cardBg, borderRadius: 26, padding: 18 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthTitle: { fontFamily: 'serif', color: COLORS.primary, fontSize: 19, fontWeight: '700' },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  yearScroll: { maxHeight: 310 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  yearCell: { width: '33.3333%', paddingVertical: 13, alignItems: 'center', borderRadius: 12 },
  yearText: { color: COLORS.onSurface, fontSize: 14, fontWeight: '700' },
  selectedYear: { backgroundColor: COLORS.primaryContainer },
  selectedYearText: { color: '#FFFFFF' },
  weekday: { width: '14.2857%', textAlign: 'center', color: COLORS.outline, fontSize: 11, fontWeight: '800', paddingVertical: 7 },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  dayText: { color: COLORS.onSurface, fontSize: 13, fontWeight: '600' },
  selectedDay: { backgroundColor: COLORS.primaryContainer },
  selectedDayText: { color: '#FFFFFF' },
  disabledDay: { color: COLORS.surfaceContainerHighest },
  closeButton: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10, marginTop: 10 },
  closeText: { color: COLORS.primaryContainer, fontWeight: '800' },
});
