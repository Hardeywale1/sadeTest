import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cycleApi } from '../api/cycleApi';
import { interestsApi, onboardingApi, profileApi } from '../api/profileApi';
import { goalsApi } from '../api/goalsApi';
import { toast } from '../components/Toast';
import { Goal, InterestCategory, OnboardingSection, Questionnaire } from '../types';
import { COLORS } from '../theme/colors';
import { CalendarField } from '../components/CalendarField';

type Props = { onComplete: () => void; mode?: 'onboarding' | 'careJourney' };
type Answers = Record<string, any>;
type Stage = Exclude<OnboardingSection, 'goals' | 'interests'> | 'interests' | 'preset_goals';

const SECTION_COPY: Record<OnboardingSection, { title: string; eyebrow: string; intro: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  demographics: { title: 'A little about you', eyebrow: 'YOUR BASICS', intro: 'This helps Sadé make your experience feel personal and relevant.', icon: 'account-heart-outline' },
  cycle_history: { title: 'Your cycle rhythm', eyebrow: 'CYCLE HISTORY', intro: 'A few dates and averages help us estimate each phase more accurately.', icon: 'calendar-heart' },
  pain_profile: { title: 'How your body feels', eyebrow: 'PAIN PROFILE', intro: 'Tell us what is typical for you. You can always update this later.', icon: 'heart-pulse' },
  health_conditions: { title: 'Your health context', eyebrow: 'HEALTH', intro: 'Select only what you are comfortable sharing.', icon: 'medical-bag' },
  lifestyle: { title: 'Your daily rhythm', eyebrow: 'LIFESTYLE', intro: 'Small details help us shape realistic wellness suggestions.', icon: 'weather-sunset' },
  goals: { title: 'What brings you here?', eyebrow: 'YOUR GOALS', intro: 'Choose the outcomes you would most like Sadé to support.', icon: 'target' },
  interests: { title: 'Build your space', eyebrow: 'INTERESTS', intro: 'Your choices shape your home feed, goals, resources and community.', icon: 'flower-outline' },
};

const FALLBACK_SECTIONS: Stage[] = ['demographics', 'cycle_history', 'pain_profile', 'health_conditions', 'lifestyle', 'interests', 'preset_goals'];

const healthOptions = ['PCOS', 'Endometriosis', 'Fibroids', 'Thyroid condition', 'Diabetes', 'None of these'];
const painOptions = ['Cramps', 'Lower back pain', 'Headaches', 'Breast tenderness', 'Pain during ovulation', 'No regular pain'];

const todayLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.outline} keyboardType={keyboardType} />
  </View>
);

const Choice = ({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: keyof typeof MaterialCommunityIcons.glyphMap }) => (
  <TouchableOpacity style={[styles.choice, selected && styles.choiceSelected]} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
    {icon ? <MaterialCommunityIcons name={icon} size={20} color={selected ? COLORS.primaryContainer : COLORS.onSurfaceVariant} /> : null}
    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    <MaterialCommunityIcons name={selected ? 'check-circle' : 'circle-outline'} size={20} color={selected ? COLORS.primaryContainer : COLORS.outline} />
  </TouchableOpacity>
);

export const OnboardingScreen: React.FC<Props> = ({ onComplete, mode = 'onboarding' }) => {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [catalog, setCatalog] = useState<InterestCategory[]>([]);
  const [presets, setPresets] = useState<Goal[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [existingGoalTitles, setExistingGoalTitles] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const sections = useMemo(() => {
    if (mode === 'onboarding') return ['demographics', 'cycle_history', 'health_conditions', 'preset_goals'] as Stage[];
    const questionnaireSections = questionnaire?.sections?.filter((item): item is Exclude<OnboardingSection, 'goals' | 'interests'> => item in SECTION_COPY && item !== 'goals' && item !== 'interests') || [];
    return questionnaireSections.length ? [...questionnaireSections, 'interests' as const, 'preset_goals' as const] : FALLBACK_SECTIONS;
  }, [questionnaire, mode]);
  const section = sections[step] || 'demographics';
  const copy = section === 'preset_goals'
    ? { title: 'Choose your first goals', eyebrow: 'GOALS', intro: 'Select a few practical presets. You can track progress and add custom goals later.', icon: 'target' as const }
    : SECTION_COPY[section];

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [definition, response, interests, mine, presetResponse, myGoals] = await Promise.all([
        onboardingApi.getQuestionnaire(),
        onboardingApi.getOnboarding(),
        interestsApi.getCatalog(),
        interestsApi.getSelection(),
        goalsApi.listPresets(),
        goalsApi.listMyGoals(),
      ]);
      setQuestionnaire(definition);
      const { goals: _legacyGoals, interests: _legacyInterests, ...questionnaireAnswers } = response.payload || {};
      setAnswers(questionnaireAnswers);
      setCatalog(interests);
      setPresets(presetResponse.goals);
      const legacyInterests = response.payload?.interests;
      setSelectedInterests(mine.length ? mine : (Array.isArray(legacyInterests) ? legacyInterests : legacyInterests?.category_ids || []));
      setExistingGoalTitles(myGoals.goals.map((goal) => goal.title));
      setSelectedPresets(presetResponse.goals.filter((preset) => myGoals.goals.some((goal) => goal.title === preset.title)).map((goal) => goal.id));
    } catch (error) {
      setLoadError('We could not load your questionnaire. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const setSection = (key: string, value: any) => setAnswers((current) => ({
    ...current,
    [section]: { ...(current[section] || {}), [key]: value },
  }));

  const toggle = (key: string, value: string, exclusive?: string) => {
    const selected: string[] = answers[section]?.[key] || [];
    let next: string[];
    if (selected.includes(value)) next = selected.filter((item) => item !== value);
    else if (exclusive && value === exclusive) next = [value];
    else next = [...selected.filter((item) => item !== exclusive), value];
    setSection(key, next);
  };

  const validate = () => {
    const value = answers[section] || {};
    if (section === 'demographics' && !value.date_of_birth) return 'Please add your date of birth.';
    if (section === 'cycle_history' && value.tracks_cycle !== false) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.last_period_start || '')) return 'Enter the first day of your last period as YYYY-MM-DD.';
      const cycleLength = Number(value.avg_cycle_length);
      const periodLength = Number(value.avg_period_length);
      if (cycleLength < 15 || cycleLength > 60) return 'Cycle length should be between 15 and 60 days.';
      if (periodLength < 1 || periodLength > 14 || periodLength >= cycleLength) return 'Period length should be between 1 and 14 days and shorter than your cycle.';
    }
    if (section === 'interests' && !selectedInterests.length) return 'Choose at least one interest to shape your space.';

    return '';
  };

  const skip = async () => {
    setSaving(true);
    try { await onboardingApi.saveOnboarding(true, answers); onComplete(); }
    catch { toast('Could not continue', 'Try again.', 'error'); }
    finally { setSaving(false); }
  };

  const next = async () => {
    const error = validate();
    if (error) return toast('One more detail', error, 'error');
    setSaving(true);
    try {
      if (section === 'interests') await interestsApi.replaceSelection(selectedInterests);
      else if (section !== 'preset_goals') await onboardingApi.saveOnboarding(false, answers);
      if (step < sections.length - 1) setStep((value) => value + 1);
      else await complete();
    } catch (error) {
      toast('Could not save', 'Your answers are still on this screen. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    await interestsApi.replaceSelection(selectedInterests);
    const newPresetIDs = selectedPresets.filter((id) => {
      const preset = presets.find((item) => item.id === id);
      return preset && !existingGoalTitles.includes(preset.title);
    });
    await Promise.all(newPresetIDs.map((id) => goalsApi.assignPreset(id)));
    const cycle = answers.cycle_history;
    if (cycle?.tracks_cycle !== false && cycle?.last_period_start) {
      await cycleApi.updateSettings({
        avg_cycle_length: Number(cycle.avg_cycle_length),
        avg_period_length: Number(cycle.avg_period_length),
        last_period_start: cycle.last_period_start,
      });
    }
    const demographics = answers.demographics || {};
    const health = answers.health_conditions || {};
    const healthConditions = Array.isArray(health) ? health : health.selected || [];
    await profileApi.updateProfile({
      date_of_birth: demographics.date_of_birth,
      gender_identity: demographics.gender_identity,
      health_conditions: healthConditions,
    });
    await onboardingApi.saveOnboarding(true, answers);
    onComplete();
  };

  const renderSection = () => {
    const value = answers[section] || {};
    switch (section) {
      case 'demographics':
        return <>
          <CalendarField label="Date of birth" value={value.date_of_birth || ''} onChange={(date) => setSection('date_of_birth', date)} maximumDate={todayLocal()} />
          <Text style={styles.label}>How do you describe yourself?</Text>
          {['Woman', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say'].map((item) => <Choice key={item} label={item} selected={value.gender_identity === item.toLowerCase()} onPress={() => setSection('gender_identity', item.toLowerCase())} />)}
        </>;
      case 'cycle_history':
        return <>
          <Text style={styles.label}>Would you like to track a menstrual cycle?</Text>
          <View style={styles.twoColumns}>
            <TouchableOpacity style={[styles.segment, value.tracks_cycle !== false && styles.segmentSelected]} onPress={() => setSection('tracks_cycle', true)}><Text style={[styles.segmentText, value.tracks_cycle !== false && styles.segmentTextSelected]}>Yes</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, value.tracks_cycle === false && styles.segmentSelected]} onPress={() => setSection('tracks_cycle', false)}><Text style={[styles.segmentText, value.tracks_cycle === false && styles.segmentTextSelected]}>Not now</Text></TouchableOpacity>
          </View>
          {value.tracks_cycle !== false ? <>
            <CalendarField label="First day of your last period" value={value.last_period_start || ''} onChange={(date) => setSection('last_period_start', date)} maximumDate={todayLocal()} />
            <View style={styles.twoColumns}>
              <View style={styles.flex}><Field label="Usual cycle" value={String(value.avg_cycle_length || '')} onChangeText={(text) => setSection('avg_cycle_length', text.replace(/\D/g, ''))} placeholder="28 days" keyboardType="numeric" /></View>
              <View style={styles.flex}><Field label="Usual period" value={String(value.avg_period_length || '')} onChangeText={(text) => setSection('avg_period_length', text.replace(/\D/g, ''))} placeholder="5 days" keyboardType="numeric" /></View>
            </View>
            <Text style={styles.helper}>Cycle dates are estimates.</Text>
          </> : <View style={styles.softNote}><Text style={styles.softNoteText}>You can add cycle details later.</Text></View>}
        </>;
      case 'pain_profile':
        return <>
          <Text style={styles.label}>Typical pain level: {value.typical_pain_level ?? 0}/10</Text>
          <View style={styles.scaleRow}>{[0, 2, 4, 6, 8, 10].map((level) => <TouchableOpacity key={level} style={[styles.scale, value.typical_pain_level === level && styles.scaleSelected]} onPress={() => setSection('typical_pain_level', level)}><Text style={[styles.scaleText, value.typical_pain_level === level && styles.scaleTextSelected]}>{level}</Text></TouchableOpacity>)}</View>
          <Text style={styles.label}>What do you commonly experience?</Text>
          {painOptions.map((item) => <Choice key={item} label={item} selected={(value.symptoms || []).includes(item)} onPress={() => toggle('symptoms', item, 'No regular pain')} />)}
        </>;
      case 'health_conditions':
        return <>{healthOptions.map((item) => <Choice key={item} label={item} selected={(value.selected || []).includes(item)} onPress={() => toggle('selected', item, 'None of these')} />)}<Text style={styles.privacy}>Select any that apply.</Text></>;
      case 'lifestyle':
        return <>
          <Text style={styles.label}>How active are you most weeks?</Text>
          {['Mostly resting', 'Lightly active', 'Moderately active', 'Very active'].map((item) => <Choice key={item} label={item} selected={value.activity_level === item.toLowerCase()} onPress={() => setSection('activity_level', item.toLowerCase())} />)}
          <Text style={styles.label}>Average sleep</Text>
          <View style={styles.twoColumns}>{['Under 6 hours', '6–8 hours', 'Over 8 hours'].map((item) => <TouchableOpacity key={item} style={[styles.segment, value.sleep === item && styles.segmentSelected]} onPress={() => setSection('sleep', item)}><Text style={[styles.segmentText, value.sleep === item && styles.segmentTextSelected]}>{item}</Text></TouchableOpacity>)}</View>
        </>;
      case 'interests':
        return <>{catalog.map((item) => <Choice key={item.id} label={item.name} selected={selectedInterests.includes(item.id)} onPress={() => setSelectedInterests((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} icon={item.slug.includes('fitness') ? 'run' : item.slug.includes('diet') ? 'food-apple-outline' : item.slug.includes('collagen') ? 'face-woman-shimmer-outline' : 'meditation'} />)}</>;
      case 'preset_goals':
        return <>{presets.filter((goal) => !selectedInterests.length || selectedInterests.includes(goal.interest_id)).map((goal) => <Choice key={goal.id} label={`${goal.title} · ${goal.target_value} ${goal.unit}`} selected={selectedPresets.includes(goal.id) || existingGoalTitles.includes(goal.title)} onPress={() => setSelectedPresets((current) => current.includes(goal.id) ? current.filter((id) => id !== goal.id) : [...current, goal.id])} icon="star-outline" />)}</>;
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primaryContainer} /><Text style={styles.loadingText}>Learning how to care for you...</Text></View>;
  if (loadError) return <View style={styles.center}><MaterialCommunityIcons name="cloud-off-outline" size={42} color={COLORS.primaryContainer} /><Text style={styles.errorTitle}>Let’s try that again</Text><Text style={styles.errorBody}>{loadError}</Text><TouchableOpacity style={styles.primaryButton} onPress={load}><Text style={styles.primaryButtonText}>Retry</Text></TouchableOpacity></View>;

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}><Text style={styles.brand}>{mode === 'careJourney' ? 'Health baseline' : 'Sadé'}</Text><View style={styles.topActions}><Text style={styles.stepText}>{step + 1} of {sections.length}</Text>{mode === 'careJourney' ? <TouchableOpacity style={styles.closeJourney} onPress={onComplete}><MaterialCommunityIcons name="close" size={20} color={COLORS.primary} /></TouchableOpacity> : null}</View></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / sections.length) * 100}%` }]} /></View>
      <View style={styles.heroIcon}><MaterialCommunityIcons name={copy.icon} size={30} color={COLORS.primaryContainer} /></View>
      {mode === 'onboarding' ? <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={skip} style={{minHeight:44,justifyContent:'center',alignSelf:'flex-end'}}><Text style={{color:COLORS.primary,fontWeight:'600'}}>Set up later</Text></TouchableOpacity> : null}
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text><Text style={styles.title}>{copy.title}</Text>
      <View style={styles.form}>{renderSection()}</View>
      <View style={styles.actions}>
        {step > 0 ? <TouchableOpacity style={styles.backButton} onPress={() => setStep((value) => value - 1)}><MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.primary} /><Text style={styles.backText}>Back</Text></TouchableOpacity> : <View />}
        <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={next} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryButtonText}>{step === sections.length - 1 ? (mode === 'careJourney' ? 'Save details' : 'Continue to Sadé') : 'Continue'}</Text><MaterialCommunityIcons name="arrow-right" size={19} color="#FFFFFF" /></>}</TouchableOpacity>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, paddingBottom: 40 }, center: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontFamily: 'serif', fontSize: 27, fontWeight: '700', fontStyle: 'italic', color: COLORS.primary }, stepText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, closeJourney: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh },
  progressTrack: { height: 5, borderRadius: 5, backgroundColor: COLORS.surfaceContainerHighest, marginTop: 16, marginBottom: 30, overflow: 'hidden' }, progressFill: { height: 5, borderRadius: 5, backgroundColor: COLORS.primaryContainer },
  heroIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, eyebrow: { color: COLORS.primaryContainer, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' }, title: { fontFamily: 'serif', color: COLORS.primary, fontSize: 30, fontWeight: '700', marginTop: 4 }, intro: { color: COLORS.onSurfaceVariant, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 24 },
  form: { marginBottom: 18 }, field: { marginBottom: 18 }, label: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 }, input: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.roseBorder, color: COLORS.onSurface, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 14, fontSize: 14 },
  choice: { minHeight: 54, borderWidth: 1, borderColor: COLORS.roseBorder, backgroundColor: COLORS.cardBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }, choiceSelected: { borderColor: COLORS.primaryContainer, backgroundColor: COLORS.surfaceContainerLow }, choiceText: { color: COLORS.onSurfaceVariant, fontSize: 14, flex: 1 }, choiceTextSelected: { color: COLORS.primary, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 9, marginBottom: 17, flexWrap: 'wrap' }, flex: { flex: 1, minWidth: 130 }, segment: { flexGrow: 1, minWidth: 90, borderWidth: 1, borderColor: COLORS.roseBorder, backgroundColor: COLORS.cardBg, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center' }, segmentSelected: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer }, segmentText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600' }, segmentTextSelected: { color: '#FFFFFF' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }, scale: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.roseBorder, alignItems: 'center', justifyContent: 'center' }, scaleSelected: { backgroundColor: COLORS.primaryContainer }, scaleText: { color: COLORS.onSurfaceVariant, fontWeight: '700' }, scaleTextSelected: { color: '#FFFFFF' },
  helper: { fontSize: 12, color: COLORS.outline, lineHeight: 18, marginTop: -8 }, softNote: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16 }, softNoteText: { color: COLORS.onSurfaceVariant, lineHeight: 19, fontSize: 13 }, privacy: { fontSize: 11, lineHeight: 17, color: COLORS.outline, marginTop: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, backButton: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 13, paddingRight: 15 }, backText: { color: COLORS.primary, fontWeight: '700' }, primaryButton: { minHeight: 48, backgroundColor: COLORS.primaryContainer, borderRadius: 24, paddingHorizontal: 21, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, disabled: { opacity: 0.6 },
  loadingText: { marginTop: 14, color: COLORS.primary, fontFamily: 'serif' }, errorTitle: { marginTop: 14, fontFamily: 'serif', color: COLORS.primary, fontSize: 23, fontWeight: '700' }, errorBody: { color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginVertical: 10, marginBottom: 18 },
});
