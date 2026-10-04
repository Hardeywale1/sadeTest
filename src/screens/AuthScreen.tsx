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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type PortalRole = 'clinician' | 'lab';

export const AuthScreen: React.FC<{ onBack?: () => void; portalRole?: PortalRole }> = ({ onBack, portalRole }) => {
  const { login, signup, logout } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const [licenseDocumentURL, setLicenseDocumentURL] = useState('');
  const [identityDocumentURL, setIdentityDocumentURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      if (isLoginTab) {
        const signedInUser = await login(email, password);
        if (portalRole && signedInUser.role !== portalRole && signedInUser.role !== 'admin' && !(portalRole === 'lab' && signedInUser.role === 'lab_applicant')) {
          await logout();
          setErrorMessage(`${portalRole === 'lab' ? 'Laboratory' : 'Clinician'} access is required for this portal.`);
        }
      } else {
        // Fall back to the email local part rather than a generic label, so the
        // greeting reads as the person's own name from the first session.
        const fallbackName = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        await signup(email, password, displayName.trim() || fallbackName, portalRole === 'lab' ? 'laboratory' : portalRole === 'clinician' ? 'clinician' : 'patient', portalRole === 'clinician' ? {
          professional_title: professionalTitle.trim(), medical_license_number: medicalLicenseNumber.trim(), nin: nin.trim(), bvn: bvn.trim(), license_document_url: licenseDocumentURL.trim(), identity_document_url: identityDocumentURL.trim(),
        } : undefined);
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
          <Text style={styles.brandSubtitle}>{portalRole === 'clinician' ? 'Clinician portal' : portalRole === 'lab' ? 'Laboratory portal' : 'Your health, connected.'}</Text>

          {/* Toggle Bar */}
          <View style={styles.toggleBar}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLoginTab && styles.toggleBtnActive]}
              onPress={() => setIsLoginTab(true)}
            >
              <Text style={[styles.toggleText, isLoginTab && styles.toggleTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLoginTab && styles.toggleBtnActive]}
              onPress={() => setIsLoginTab(false)}
            >
              <Text style={[styles.toggleText, !isLoginTab && styles.toggleTextActive]}>Create account</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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
            <View style={styles.inputGroup}><Text style={styles.label}>Professional title</Text><TextInput style={styles.input} placeholder="Doctor, gynaecologist, nurse" value={professionalTitle} onChangeText={setProfessionalTitle} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Medical licence number</Text><TextInput style={styles.input} value={medicalLicenseNumber} onChangeText={setMedicalLicenseNumber} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>NIN</Text><TextInput style={styles.input} value={nin} onChangeText={setNin} secureTextEntry /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>BVN</Text><TextInput style={styles.input} value={bvn} onChangeText={setBvn} secureTextEntry /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Licence document URL</Text><TextInput style={styles.input} autoCapitalize="none" value={licenseDocumentURL} onChangeText={setLicenseDocumentURL} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Identity document URL</Text><TextInput style={styles.input} autoCapitalize="none" value={identityDocumentURL} onChangeText={setIdentityDocumentURL} /></View>
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
              <Text style={styles.submitBtnText}>{isLoginTab ? (portalRole ? 'Open workspace' : 'Welcome Back') : portalRole === 'lab' ? 'Register laboratory' : portalRole === 'clinician' ? 'Create clinician account' : 'Join Sadé'}</Text>
            )}
          </TouchableOpacity>
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
});
