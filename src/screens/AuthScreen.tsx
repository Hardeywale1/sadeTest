import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SubscriptionPlan } from '../types';
import { paymentsApi } from '../api/paymentsApi';

type PortalRole = 'clinician' | 'lab' | 'admin';
const CLINICIAN_PROFESSIONS = ['Medical doctor', 'Gynaecologist', 'Obstetrician-gynaecologist', 'Nurse', 'Midwife', 'Other clinician'];
const WEEK_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export const AuthScreen: React.FC<{ onBack?: () => void; portalRole?: PortalRole }> = ({ onBack, portalRole }) => {
  const { login, signup, logout } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [professionOpen, setProfessionOpen] = useState(false);
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [licenseDocumentURL, setLicenseDocumentURL] = useState('');
  const [identityDocumentURL, setIdentityDocumentURL] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>(WEEK_DAYS.slice(0, 5));
  const [availabilityStart, setAvailabilityStart] = useState('09:00');
  const [availabilityEnd, setAvailabilityEnd] = useState('17:00');
  const [consultationFee, setConsultationFee] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [signupStep, setSignupStep] = useState<'account' | 'plan'>('account');
  const [selectedPlan] = useState<SubscriptionPlan>('basic');

  const patientPlanStep = !isLoginTab && !portalRole && signupStep === 'plan';
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (!isLoginTab && portalRole === 'clinician' && (!professionalTitle || availableDays.length === 0 || Number(consultationFee) <= 0 || availabilityStart >= availabilityEnd)) {
      setErrorMessage('Set your profession, consultation fee and availability.');
      return;
    }
    if (!isLoginTab && !portalRole && signupStep === 'account') {
      setErrorMessage('');
      setSignupStep('plan');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      if (isLoginTab) {
        const signedInUser = await login(email, password);
        if (portalRole && signedInUser.role !== portalRole && signedInUser.role !== 'admin' && !(portalRole === 'lab' && signedInUser.role === 'lab_applicant')) {
          await logout();
          setErrorMessage(`${portalRole === 'lab' ? 'Laboratory' : portalRole === 'admin' ? 'Administrator' : 'Clinician'} access is required for this portal.`);
        }
      } else {
        // Fall back to the email local part rather than a generic label, so the
        // greeting reads as the person's own name from the first session.
        const fallbackName = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        await signup(email, password, displayName.trim() || fallbackName, portalRole === 'lab' ? 'laboratory' : portalRole === 'clinician' ? 'clinician' : 'patient', portalRole === 'clinician' ? {
          professional_title: professionalTitle.trim(), medical_license_number: medicalLicenseNumber.trim(), nin: nin.trim(), bvn: bvn.trim(), license_document_url: licenseDocumentURL.trim(), identity_document_url: identityDocumentURL.trim(),
          clinician_settings: { accepting_patients: true, slot_duration_minutes: 30, consultation_fee_minor: Math.round(Number(consultationFee) * 100), currency: 'NGN', availability: WEEK_DAYS.map((day) => ({ day, start: availabilityStart, end: availabilityEnd, enabled: availableDays.includes(day) })), unavailable_dates: [] },
        } : undefined, !portalRole ? selectedPlan : undefined);
        if (!portalRole) {
          try {
            const checkout = await paymentsApi.initializePaystack();
            await Linking.openURL(checkout.authorization_url);
          } catch (paymentError: any) {
            throw paymentError;
          }
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Check details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {onBack ? (
            <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Back to Sadé home">
              <MaterialCommunityIcons name="arrow-left" size={19} color={COLORS.primary} />
              <Text style={styles.backText}>Home</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.brandTitle}>Sadé</Text>
          <Text style={styles.brandSubtitle}>{portalRole === 'clinician' ? 'Clinician portal' : portalRole === 'lab' ? 'Laboratory portal' : portalRole === 'admin' ? 'Administration' : 'Your health, connected.'}</Text>

          {/* Toggle Bar */}
          {portalRole !== 'admin' ? <View style={styles.toggleBar}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLoginTab && styles.toggleBtnActive]}
              onPress={() => { setIsLoginTab(true); setSignupStep('account'); setErrorMessage(''); }}
            >
              <Text style={[styles.toggleText, isLoginTab && styles.toggleTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLoginTab && styles.toggleBtnActive]}
              onPress={() => { setIsLoginTab(false); setSignupStep('account'); setErrorMessage(''); }}
            >
              <Text style={[styles.toggleText, !isLoginTab && styles.toggleTextActive]}>Create account</Text>
            </TouchableOpacity>
          </View> : null}

          {/* Form */}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {patientPlanStep ? <>
            <Text style={styles.trialTitle}>Try Sadé free for 30 days</Text>
            <Text style={styles.trialSubtitle}>Your Basic membership begins after the free trial.</Text>
            {([
              { id: 'basic' as const, name: 'Basic', price: '₦3,000', features: ['Cycle, bleeding and symptom tracking', 'Period summaries and irregular-cycle insights', 'Journal, health history and personal goals', 'Concern triage using your continuity record', 'Doctor, laboratory and care coordination', 'Sadé community access'] },
            ]).map((plan) => {
              const selected = selectedPlan === plan.id;
              return <View key={plan.id} style={[styles.planCard, selected && styles.planCardSelected]} accessibilityRole="radio" accessibilityState={{ checked: selected }}>
                <View style={styles.planTop}><View><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planPrice}>{plan.price}<Text style={styles.planPeriod}> / month</Text></Text></View><MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={23} color={selected ? COLORS.primary : COLORS.outline} /></View>
                {plan.features.map((feature) => <View key={feature} style={styles.featureRow}><MaterialCommunityIcons name="check" size={16} color={COLORS.primary} /><Text style={styles.featureText}>{feature}</Text></View>)}
              </View>;
            })}
            <View style={styles.securePayment}><MaterialCommunityIcons name="shield-lock-outline" size={21} color={COLORS.primary} /><View style={styles.securePaymentCopy}><Text style={styles.securePaymentTitle}>Secure card setup</Text><Text style={styles.securePaymentText}>Paystack collects your card details. Sadé never receives or stores them.</Text></View></View>
            <View style={styles.trialTerms}><Text style={styles.trialTermsStrong}>30 days free</Text><Text style={styles.trialTermsText}>Your membership starts {trialEnd.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}. Paystack Test Mode charges ₦50 to verify the card before scheduling the subscription. Consultations, tests and medicines are charged separately.</Text></View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Continue to Paystack</Text>}</TouchableOpacity>
            <TouchableOpacity style={styles.editAccount} onPress={() => setSignupStep('account')}><Text style={styles.editAccountText}>Edit account details</Text></TouchableOpacity>
          </> : <>

          {!isLoginTab && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#A08C8C"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          )}

          {!isLoginTab && portalRole === 'clinician' ? <>
            <View style={styles.inputGroup}><Text style={styles.label}>Profession</Text><TouchableOpacity style={styles.select} onPress={() => setProfessionOpen((open) => !open)}><Text style={[styles.selectText, !professionalTitle && styles.selectPlaceholder]}>{professionalTitle || 'Select profession'}</Text><MaterialCommunityIcons name={professionOpen ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} /></TouchableOpacity>{professionOpen ? <View style={styles.selectMenu}>{CLINICIAN_PROFESSIONS.map((profession) => <TouchableOpacity key={profession} style={[styles.selectOption, professionalTitle === profession && styles.selectOptionSelected]} onPress={() => { setProfessionalTitle(profession); setProfessionOpen(false); }}><Text style={styles.selectOptionText}>{profession}</Text></TouchableOpacity>)}</View> : null}</View>
            <View style={styles.inputGroup}><Text style={styles.label}>Medical licence number</Text><TextInput style={styles.input} value={medicalLicenseNumber} onChangeText={setMedicalLicenseNumber} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>NIN</Text><TextInput style={styles.input} value={nin} onChangeText={setNin} secureTextEntry /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>BVN</Text><TextInput style={styles.input} value={bvn} onChangeText={setBvn} secureTextEntry /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Licence document URL</Text><TextInput style={styles.input} autoCapitalize="none" value={licenseDocumentURL} onChangeText={setLicenseDocumentURL} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Identity document URL</Text><TextInput style={styles.input} autoCapitalize="none" value={identityDocumentURL} onChangeText={setIdentityDocumentURL} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Consultation fee</Text><TextInput style={styles.input} keyboardType="number-pad" value={consultationFee} onChangeText={setConsultationFee} /><Text style={styles.hint}>NGN</Text></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Availability</Text><View style={styles.days}>{WEEK_DAYS.map((day) => { const selected=availableDays.includes(day); return <TouchableOpacity key={day} style={[styles.day,selected&&styles.daySelected]} onPress={()=>setAvailableDays((days)=>selected?days.filter((item)=>item!==day):[...days,day])}><Text style={[styles.dayText,selected&&styles.dayTextSelected]}>{day.slice(0,3)}</Text></TouchableOpacity>})}</View><View style={styles.timeRow}><TextInput style={[styles.input,styles.timeInput]} value={availabilityStart} onChangeText={setAvailabilityStart} placeholder="09:00"/><TextInput style={[styles.input,styles.timeInput]} value={availabilityEnd} onChangeText={setAvailabilityEnd} placeholder="17:00"/></View><Text style={styles.hint}>30 minute appointments · Africa/Lagos</Text></View>
          </> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="sade@example.com"
              placeholderTextColor="#A08C8C"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#A08C8C"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isLoginTab ? (portalRole === 'admin' ? 'Open admin' : portalRole ? 'Open workspace' : 'Sign in') : portalRole === 'lab' ? 'Register laboratory' : portalRole === 'clinician' ? 'Create clinician account' : 'Continue'}</Text>
            )}
          </TouchableOpacity>
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  backButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  brandTitle: {
    fontFamily: 'serif',
    fontSize: 34,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.primary,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 99,
    padding: 4,
    marginBottom: 20,
  },
  portalNotice: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  portalNoticeText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 99,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  hint: { color: COLORS.onSurfaceVariant, fontSize: 11 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  day: { minWidth: 42, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceContainerHighest },
  daySelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { color: COLORS.onSurfaceVariant, fontSize: 11, textTransform: 'capitalize' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeInput: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  select: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: COLORS.onSurface, fontSize: 14, fontWeight: '600' },
  selectPlaceholder: { color: '#A08C8C', fontWeight: '400' },
  selectMenu: { marginTop: 6, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surfaceContainerHighest },
  selectOption: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerHigh },
  selectOptionSelected: { backgroundColor: COLORS.surfaceContainerLow },
  selectOptionText: { color: COLORS.onSurface, fontSize: 13, fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  trialTitle: { color: COLORS.onSurface, fontFamily: 'serif', fontSize: 25, fontWeight: '700', textAlign: 'center' },
  trialSubtitle: { color: COLORS.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 5, marginBottom: 16 },
  planCard: { borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, borderRadius: 18, padding: 16, marginBottom: 10, backgroundColor: COLORS.cardBg },
  planCardSelected: { borderWidth: 2, borderColor: COLORS.primary, backgroundColor: COLORS.surfaceContainerLow },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  planName: { color: COLORS.onSurface, fontSize: 16, fontWeight: '800' },
  planPrice: { color: COLORS.primary, fontSize: 20, fontWeight: '800', marginTop: 2 },
  planPeriod: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '500' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  featureText: { flex: 1, color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 17 },
  securePayment: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, marginTop: 8, backgroundColor: COLORS.surfaceContainerLow },
  securePaymentCopy: { flex: 1 },
  securePaymentTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '800' },
  securePaymentText: { color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 16, marginTop: 2 },
  trialTerms: { borderRadius: 14, padding: 13, marginTop: 4, backgroundColor: COLORS.surfaceContainerHigh },
  trialTermsStrong: { color: COLORS.primary, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  trialTermsText: { color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 17 },
  editAccount: { alignItems: 'center', paddingVertical: 12 },
  editAccountText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
});
