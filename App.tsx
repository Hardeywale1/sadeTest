import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Header } from './src/components/Header';
import { ToastHost } from './src/components/Toast';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { onboardingApi } from './src/api/profileApi';
import { COLORS } from './src/theme/colors';

type TabType = 'dashboard' | 'cycle' | 'journal' | 'community' | 'settings';

const TAB_SUBTITLE: Record<TabType, string> = {
  dashboard: 'HOME',
  cycle: 'TRACK',
  journal: 'JOURNAL',
  community: 'LOUNGE',
  settings: 'ACCOUNT',
};

/**
 * Expo's web template sizes the root element with `height: 100%`, which on mobile
 * browsers is measured against the large viewport — the bottom navigation then sits
 * underneath the browser chrome and reads as "missing". `100dvh` tracks the visible
 * viewport instead, so the nav bar stays on screen on every page.
 */
const useWebViewportFix = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'sade-viewport-fix';
    style.textContent = `
      @supports (height: 100dvh) {
        html, body, #root { height: 100dvh; }
      }
      body { overflow: hidden; }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [onboardingState, setOnboardingState] = useState<'checking' | 'required' | 'complete'>('checking');
  const [careJourneyOpen, setCareJourneyOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [trackerView, setTrackerView] = useState<'today' | 'cycle'>('today');

  useWebViewportFix();

  const navigateFromDashboard = (tab: 'cycle' | 'journal', nextTrackerView?: 'today' | 'cycle') => {
    if (nextTrackerView) setTrackerView(nextTrackerView);
    setCurrentTab(tab);
  };

  // Tapping the nav always leaves whichever sub-screen is open, so the tabs stay usable.
  const selectTab = (tab: TabType) => {
    setCareJourneyOpen(false);
    setGoalsOpen(false);
    setCurrentTab(tab);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setOnboardingState('checking');
      return;
    }
    onboardingApi.getOnboarding()
      .then((response) => setOnboardingState(response.status === 'completed' ? 'complete' : 'required'))
      .catch(() => setOnboardingState('required'));
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text style={styles.loadingText}>Loading Sadé...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (onboardingState === 'checking') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
        <Text style={styles.loadingText}>Preparing your space...</Text>
      </View>
    );
  }

  // First-run onboarding is the only flow that owns the whole screen: there is
  // nothing to navigate to yet. Every other screen keeps the tab bar.
  if (onboardingState === 'required') {
    return <OnboardingScreen onComplete={() => setOnboardingState('complete')} />;
  }

  const renderActiveScreen = () => {
    if (careJourneyOpen) {
      return <OnboardingScreen mode="careJourney" onComplete={() => setCareJourneyOpen(false)} />;
    }
    if (goalsOpen) {
      return <GoalsScreen onClose={() => setGoalsOpen(false)} />;
    }
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={navigateFromDashboard} />;
      case 'cycle':
        return <TrackerScreen key={trackerView} initialView={trackerView} />;
      case 'journal':
        return <JournalScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'settings':
        return <SettingsScreen onEditOnboarding={() => setCareJourneyOpen(true)} onManageGoals={() => setGoalsOpen(true)} />;
      default:
        return <DashboardScreen onNavigate={navigateFromDashboard} />;
    }
  };

  const headerSubtitle = careJourneyOpen ? 'CARE JOURNEY' : goalsOpen ? 'GOALS' : TAB_SUBTITLE[currentTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F8" />
      <View style={styles.webContainer}>
        {/* Header */}
        <Header
          subtitle={headerSubtitle}
          onRightPress={() => selectTab('settings')}
          rightIconName={currentTab === 'settings' ? 'cog-outline' : 'account-circle-outline'}
        />

        {/* Screen Content */}
        <View style={styles.mainCanvas}>{renderActiveScreen()}</View>

        {/* Responsive Bottom Navigation Bar — visible on every authenticated screen */}
        <View style={styles.bottomNav}>
          {([
            ['dashboard', 'home-variant-outline', 'home-variant', 'Home'],
            ['cycle', 'chart-timeline-variant', 'chart-timeline-variant', 'Track'],
            ['journal', 'book-open-page-variant-outline', 'book-open-page-variant', 'Journal'],
            ['community', 'account-group-outline', 'account-group', 'Lounge'],
            ['settings', 'account-circle-outline', 'account-circle', 'Account'],
          ] as const).map(([tab, icon, activeIcon, label]) => {
            const active = currentTab === tab && !careJourneyOpen && !goalsOpen;
            return (
              <TouchableOpacity key={tab} style={styles.navItem} onPress={() => selectTab(tab)} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                <View style={[styles.iconPill, active && styles.iconPillActive]}>
                  <MaterialCommunityIcons name={active ? activeIcon : icon} size={22} color={active ? COLORS.primary : COLORS.onSurfaceVariant} />
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastHost>
        <AppContent />
      </ToastHost>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontFamily: 'serif',
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 12,
  },
  mainCanvas: {
    flex: 1,
    // Without this the canvas grows with its content on web and pushes the nav bar
    // below the fold instead of letting the inner ScrollViews scroll.
    minHeight: 0,
    overflow: 'hidden',
  },
  bottomNav: {
    height: 76,
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  iconPill: {
    width: 56,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.primaryContainer,
    fontWeight: '700',
  },
});
