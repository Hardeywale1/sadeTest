import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/profileApi';
import { authApi } from '../api/authApi';
import { Profile, Session } from '../types';
import { COLORS } from '../theme/colors';

export const SettingsScreen: React.FC<{ onEditOnboarding?: () => void; onManageGoals?: () => void }> = ({ onEditOnboarding, onManageGoals }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const [profRes, sessRes] = await Promise.allSettled([
        profileApi.getProfile(),
        authApi.listSessions(),
      ]);

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value);
        setDisplayName(profRes.value.display_name || user?.display_name || '');
      }
      if (sessRes.status === 'fulfilled') {
        setSessions(sessRes.value.sessions);
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await profileApi.updateProfile({ display_name: displayName });
      Alert.alert('Success', 'Profile updated!');
      loadSettingsData();
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg('Please fill in current & new password.');
      return;
    }
    setPasswordMsg('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Could not change password.';
      setPasswordMsg(msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account &amp; Security</Text>
      <Text style={styles.subtitle}>Manage your profile, active sessions &amp; sanctuary security.</Text>

      {/* Profile Section */}
      <Text style={styles.sectionHeader}>Profile Information</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email Address</Text>
        <Text style={styles.readOnlyText}>{user?.email}</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}>
          <Text style={styles.saveBtnText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Personalization</Text>
      <TouchableOpacity style={styles.personalizationCard} onPress={onEditOnboarding}>
        <View style={styles.personalizationCopy}>
          <Text style={styles.personalizationTitle}>My care journey</Text>
          <Text style={styles.personalizationText}>Review your cycle details, health context, goals and interests.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.personalizationCard} onPress={onManageGoals}>
        <View style={styles.personalizationCopy}>
          <Text style={styles.personalizationTitle}>Goals &amp; progress</Text>
          <Text style={styles.personalizationText}>Choose preset goals and update the progress you have made.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Change Password Section */}
      <Text style={styles.sectionHeader}>Security &amp; Password</Text>
      <View style={styles.card}>
        {passwordMsg ? <Text style={styles.errorText}>{passwordMsg}</Text> : null}

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
          <Text style={styles.saveBtnText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Active Sessions Section */}
      <Text style={styles.sectionHeader}>Active Sessions ({sessions.length})</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No other active sessions detected.</Text>
        </View>
      ) : (
        sessions.map((s) => (
          <View key={s.id} style={styles.sessionCard}>
            <View>
              <Text style={styles.sessionTitle}>Session {s.id.slice(0, 8)}...</Text>
              <Text style={styles.sessionMeta}>Expires: {new Date(s.expires_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.sessionBadge}>ACTIVE</Text>
          </View>
        ))
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Logout of Sanctuary</Text>
      </TouchableOpacity>
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
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  readOnlyText: {
    fontSize: 14,
    color: COLORS.outline,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 10,
    borderRadius: 12,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 99,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  sessionMeta: {
    fontSize: 11,
    color: COLORS.outline,
  },
  sessionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  emptyBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  logoutBtn: {
    backgroundColor: '#FFDAD6',
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  logoutBtnText: {
    color: '#93000A',
    fontSize: 13,
    fontWeight: '700',
  },
  personalizationCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.surfaceContainerHighest, flexDirection: 'row', alignItems: 'center' },
  personalizationCopy: { flex: 1 },
  personalizationTitle: { fontFamily: 'serif', color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  personalizationText: { color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 17, marginTop: 3 },
  chevron: { color: COLORS.primaryContainer, fontSize: 28, marginLeft: 10 },
});
