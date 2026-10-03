import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

type Props = {
  onStart: () => void;
  onSignIn: () => void;
  onClinician: () => void;
  onLab: () => void;
};

const CARE_PATHS = [
  ['water-outline', 'Period pain', 'Pain, cramps and symptoms that interrupt daily life.'],
  ['water-plus-outline', 'Heavy bleeding', 'Changes in flow, duration or bleeding between periods.'],
  ['calendar-sync-outline', 'Irregular cycles', 'Late, missed or unpredictable periods.'],
  ['head-heart-outline', 'Vaginal health', 'Discharge, irritation, infections and recurring symptoms.'],
  ['flower-outline', 'PCOS & endometriosis', 'Ongoing symptom tracking and specialist-led support.'],
  ['human-pregnant', 'Fertility care', 'Preconception questions, testing and guided next steps.'],
] as const;

const HEADLINES = [
  {
    eyebrow: 'Cycle and period tracking',
    title: 'Know your rhythm.',
    body: 'Track periods, symptoms and daily wellbeing. See patterns that make every health conversation clearer.',
  },
  {
    eyebrow: 'Continuous women’s care',
    title: 'Care that keeps moving.',
    body: 'From concern to test, result, clinician and follow-up—Sadé keeps every next step connected.',
  },
  {
    eyebrow: 'Community that cares',
    title: 'You’re not figuring it out alone.',
    body: 'Share, learn and feel understood in a community built around real experiences and better health.',
  },
] as const;

const PILLARS = [
  ['calendar-heart', 'Track', 'Periods, symptoms and everyday wellbeing become one useful health timeline.'],
  ['medical-bag', 'Care', 'Raise a concern and move through the right tests, providers and follow-up.'],
  ['account-group-outline', 'Community', 'Find shared experience, practical support and conversations that care.'],
] as const;

const JOURNEY = [
  ['01', 'Tell us what changed', 'Your concern is considered with your cycle and health history.'],
  ['02', 'Receive a care route', 'Sadé shows the appropriate next step, provider and expected cost.'],
  ['03', 'Stay connected', 'Tests, results, clinician review and follow-up remain in one care case.'],
] as const;

const ROUTE = [
  ['check-circle', 'Care confirmed', 'Complete'],
  ['flask-outline', 'Laboratory test', 'Next'],
  ['file-check-outline', 'Results review', 'Pending'],
  ['doctor', 'Clinician follow-up', 'Pending'],
] as const;

export const LandingScreen: React.FC<Props> = ({ onStart, onSignIn, onClinician, onLab }) => {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const scrollView = useRef<any>(null);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const headline = HEADLINES[headlineIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(heroOpacity, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => {
        setHeadlineIndex((current) => (current + 1) % HEADLINES.length);
        Animated.timing(heroOpacity, { toValue: 1, duration: 320, useNativeDriver: false }).start();
      });
    }, 4800);
    return () => clearInterval(timer);
  }, [heroOpacity]);

  const scrollToCare = () => {
    scrollView.current?.scrollTo({ y: desktop ? 710 : 1020, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollView} style={styles.page} contentContainerStyle={styles.pageContent}>
        <View style={styles.heroShell}>
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />

          <View style={styles.nav}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
              <Text style={styles.brand}>Sadé</Text>
            </View>
            <View style={styles.navActions}>
              {desktop ? <TouchableOpacity onPress={scrollToCare}><Text style={styles.navLink}>Explore</Text></TouchableOpacity> : null}
              {desktop ? <TouchableOpacity onPress={onClinician}><Text style={styles.navLink}>Clinician portal</Text></TouchableOpacity> : null}
              {desktop ? <TouchableOpacity onPress={onLab}><Text style={styles.navLink}>Lab portal</Text></TouchableOpacity> : null}
              <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
                <Text style={styles.signInText}>Patient sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.hero, desktop && styles.heroDesktop]}>
            <View style={[styles.heroCopy, desktop && styles.heroCopyDesktop]}>
              <Animated.View style={{ opacity: heroOpacity }}>
                <View style={styles.eyebrowPill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.eyebrow}>{headline.eyebrow}</Text>
                </View>
                <Text style={[styles.heroTitle, desktop && styles.heroTitleDesktop]}>{headline.title}</Text>
                <Text style={[styles.heroBody, desktop && styles.heroBodyDesktop]}>{headline.body}</Text>
              </Animated.View>
              <View style={styles.heroDots}>
                {HEADLINES.map((item, index) => (
                  <TouchableOpacity
                    key={item.eyebrow}
                    accessibilityLabel={`Show ${item.eyebrow}`}
                    onPress={() => setHeadlineIndex(index)}
                    style={[styles.heroDot, index === headlineIndex && styles.heroDotActive]}
                  />
                ))}
              </View>
              <View style={[styles.heroActions, desktop && styles.heroActionsDesktop]}>
                <TouchableOpacity style={styles.primaryButton} onPress={onStart}>
                  <Text style={styles.primaryButtonText}>Join Sadé</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={scrollToCare}>
                  <Text style={styles.secondaryButtonText}>Explore Sadé</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.trustRow}>
                <MaterialCommunityIcons name="shield-check-outline" size={19} color={COLORS.emerald} />
                <Text style={styles.trustText}>Private tracking · Coordinated care · A community that understands</Text>
              </View>
            </View>

            <View style={[styles.routeWrap, desktop && styles.routeWrapDesktop]}>
              <Animated.View style={{ opacity: heroOpacity }}>
              {headlineIndex === 0 ? (
                <View style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View>
                      <Text style={styles.routeEyebrow}>Your cycle</Text>
                      <Text style={styles.routeTitle}>Day 18</Text>
                    </View>
                    <View style={styles.secureIcon}>
                      <MaterialCommunityIcons name="calendar-heart" size={19} color={COLORS.primary} />
                    </View>
                  </View>
                  <View style={styles.cycleOverview}>
                    <View style={styles.cycleNumber}>
                      <Text style={styles.cycleDay}>18</Text>
                      <Text style={styles.cycleDayLabel}>cycle day</Text>
                    </View>
                    <View style={styles.cycleSummary}>
                      <Text style={styles.cyclePhase}>Luteal phase</Text>
                      <Text style={styles.cycleEstimate}>Period expected in 10 days</Text>
                      <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
                    </View>
                  </View>
                  <Text style={styles.cardSectionLabel}>Today</Text>
                  <View style={styles.todayGrid}>
                    {[['water-outline', 'Flow', 'None'], ['flash-outline', 'Energy', 'Steady'], ['emoticon-happy-outline', 'Mood', 'Good']].map(([icon, label, value]) => (
                      <View key={label} style={styles.todayItem}>
                        <MaterialCommunityIcons name={icon as any} size={19} color={COLORS.primary} />
                        <Text style={styles.todayLabel}>{label}</Text>
                        <Text style={styles.todayValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.nextStep}>
                    <View style={styles.nextStepIcon}><MaterialCommunityIcons name="chart-timeline-variant" size={22} color={COLORS.primary} /></View>
                    <View style={styles.nextStepCopy}>
                      <Text style={styles.nextStepLabel}>Pattern</Text>
                      <Text style={styles.nextStepTitle}>Pain often rises before your period</Text>
                    </View>
                  </View>
                </View>
              ) : headlineIndex === 1 ? (
              <View style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View>
                    <Text style={styles.routeEyebrow}>Your care route</Text>
                    <Text style={styles.routeTitle}>Pelvic pain support</Text>
                  </View>
                  <View style={styles.secureIcon}>
                    <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.primary} />
                  </View>
                </View>
                <View style={styles.routeList}>
                  {ROUTE.map(([icon, label, status], index) => (
                    <View key={label} style={styles.routeItem}>
                      <View style={styles.routeRail}>
                        <View style={[styles.routeIcon, index === 1 && styles.routeIconActive]}>
                          <MaterialCommunityIcons
                            name={icon}
                            size={19}
                            color={index === 1 ? '#FFFFFF' : index === 0 ? COLORS.emerald : COLORS.outline}
                          />
                        </View>
                        {index < ROUTE.length - 1 ? <View style={styles.routeLine} /> : null}
                      </View>
                      <View style={styles.routeTextWrap}>
                        <Text style={[styles.routeLabel, index > 1 && styles.routeLabelMuted]}>{label}</Text>
                        <Text style={[styles.routeStatus, index === 1 && styles.routeStatusActive]}>{status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.nextStep}>
                  <View style={styles.nextStepIcon}>
                    <MaterialCommunityIcons name="flask-outline" size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.nextStepCopy}>
                    <Text style={styles.nextStepLabel}>Next step</Text>
                    <Text style={styles.nextStepTitle}>Complete your laboratory test</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary} />
                </View>
              </View>
              ) : (
                <View style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View>
                      <Text style={styles.routeEyebrow}>Sadé Community</Text>
                      <Text style={styles.routeTitle}>A space that gets it</Text>
                    </View>
                    <View style={styles.secureIcon}>
                      <MaterialCommunityIcons name="account-group-outline" size={20} color={COLORS.primary} />
                    </View>
                  </View>
                  <View style={styles.communityTopics}>
                    {[
                      ['weather-night', 'Living with period pain', 'Support circle'],
                      ['calendar-question', 'Understanding cycle changes', 'Ask & learn'],
                      ['heart-outline', 'Small wins this week', 'Community check-in'],
                    ].map(([icon, title, label]) => (
                      <View key={title} style={styles.communityTopic}>
                        <View style={styles.communityIcon}><MaterialCommunityIcons name={icon as any} size={20} color={COLORS.primary} /></View>
                        <View style={styles.communityCopy}>
                          <Text style={styles.communityTitle}>{title}</Text>
                          <Text style={styles.communityLabel}>{label}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.outline} />
                      </View>
                    ))}
                  </View>
                  <View style={styles.communityPrivacy}>
                    <MaterialCommunityIcons name="shield-account-outline" size={20} color={COLORS.emerald} />
                    <Text style={styles.communityPrivacyText}>Choose your name, privacy and how you participate.</Text>
                  </View>
                </View>
              )}
              </Animated.View>
              {headlineIndex === 1 ? <View style={styles.floatingResult}>
                <View style={styles.resultIcon}>
                  <MaterialCommunityIcons name="file-check-outline" size={19} color={COLORS.emerald} />
                </View>
                <View>
                  <Text style={styles.resultTitle}>Results received</Text>
                  <Text style={styles.resultText}>Clinician notified</Text>
                </View>
              </View> : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>One Sadé</Text>
          <View style={[styles.sectionHeadingRow, desktop && styles.sectionHeadingRowDesktop]}>
            <Text style={[styles.sectionTitle, desktop && styles.sectionTitleDesktop]}>Your health has more than one side.</Text>
            <Text style={[styles.sectionIntro, desktop && styles.sectionIntroDesktop]}>
              Track what is happening, find care when you need it and stay close to people who understand.
            </Text>
          </View>
          <View style={styles.pillarGrid}>
            {PILLARS.map(([icon, title, body], index) => (
              <View key={title} style={[styles.pillarCard, desktop && styles.pillarCardDesktop, index === 1 && styles.pillarCardPrimary]}>
                <View style={[styles.pillarIcon, index === 1 && styles.pillarIconPrimary]}>
                  <MaterialCommunityIcons name={icon} size={25} color={index === 1 ? '#FFFFFF' : COLORS.primary} />
                </View>
                <Text style={[styles.pillarTitle, index === 1 && styles.pillarTextPrimary]}>{title}</Text>
                <Text style={[styles.pillarBody, index === 1 && styles.pillarBodyPrimary]}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.careSection]}>
          <Text style={styles.sectionEyebrow}>Dedicated care</Text>
          <View style={[styles.sectionHeadingRow, desktop && styles.sectionHeadingRowDesktop]}>
            <Text style={[styles.sectionTitle, desktop && styles.sectionTitleDesktop]}>Start with what you’re experiencing.</Text>
            <Text style={[styles.sectionIntro, desktop && styles.sectionIntroDesktop]}>
              Sadé connects each concern to a focused pathway and the providers needed to complete it.
            </Text>
          </View>
          <View style={styles.careGrid}>
            {CARE_PATHS.map(([icon, title, body]) => (
              <View key={title} style={[styles.careCard, desktop && styles.careCardDesktop]}>
                <View style={styles.careIcon}>
                  <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.careTitle}>{title}</Text>
                <Text style={styles.careBody}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.journeySection, desktop && styles.journeySectionDesktop]}>
          <View style={[styles.journeyLead, desktop && styles.journeyLeadDesktop]}>
            <Text style={styles.sectionEyebrowLight}>One continuous case</Text>
            <Text style={[styles.journeyTitle, desktop && styles.journeyTitleDesktop]}>No lost handoffs.</Text>
            <Text style={styles.journeyBody}>Every provider sees the right next step. You always know what happens next.</Text>
            <View style={styles.networkRow}>
              {['Patient', 'Lab', 'Clinician'].map((label, index) => (
                <React.Fragment key={label}>
                  <View style={styles.networkPill}><Text style={styles.networkText}>{label}</Text></View>
                  {index < 2 ? <MaterialCommunityIcons name="arrow-right" size={16} color="#DDB8C2" /> : null}
                </React.Fragment>
              ))}
            </View>
          </View>
          <View style={[styles.journeySteps, desktop && styles.journeyStepsDesktop]}>
            {JOURNEY.map(([number, title, body]) => (
              <View key={number} style={styles.journeyStep}>
                <Text style={styles.stepNumber}>{number}</Text>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={styles.stepBody}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.aiSection, desktop && styles.aiSectionDesktop]}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="creation" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.aiCopy}>
            <Text style={styles.sectionEyebrow}>Sadé AI</Text>
            <Text style={styles.aiTitle}>A clearer handoff for every clinician.</Text>
            <Text style={styles.aiBody}>Sadé AI organizes the patient-reported timeline into a reviewable brief. Clinicians remain responsible for care decisions.</Text>
          </View>
          <View style={styles.aiFacts}>
            {['Concern and severity', 'Cycle and symptom history', 'Medication history', 'Missing information'].map((fact) => (
              <View key={fact} style={styles.factRow}>
                <MaterialCommunityIcons name="check" size={16} color={COLORS.emerald} />
                <Text style={styles.factText}>{fact}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.finalCta}>
          <Text style={styles.finalTitle}>Your next step should never be unclear.</Text>
          <Text style={styles.finalBody}>Start a private care journey with Sadé.</Text>
          <TouchableOpacity style={styles.finalButton} onPress={onStart}>
            <Text style={styles.finalButtonText}>Get started</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.brandRow}>
            <View style={styles.brandMarkSmall}><Text style={styles.brandMarkSmallText}>S</Text></View>
            <Text style={styles.footerBrand}>Sadé</Text>
          </View>
          <Text style={styles.footerText}>Connected care for every next step.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8F8' },
  page: { flex: 1, backgroundColor: '#FFF8F8' },
  pageContent: { alignItems: 'center' },
  heroShell: { width: '100%', minHeight: 720, backgroundColor: '#FFF2F3', overflow: 'hidden', position: 'relative' },
  orbLarge: { position: 'absolute', width: 480, height: 480, borderRadius: 240, backgroundColor: '#F4DDE2', right: -180, top: 60, opacity: 0.7 },
  orbSmall: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#E8EFEA', left: -100, bottom: -70, opacity: 0.8 },
  nav: { width: '100%', maxWidth: 1180, alignSelf: 'center', minHeight: 78, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  brandMarkText: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 23, fontWeight: '700', fontStyle: 'italic' },
  brand: { color: COLORS.primary, fontFamily: 'serif', fontSize: 28, fontWeight: '700', fontStyle: 'italic' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink: { color: COLORS.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
  signInButton: { minHeight: 42, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8BFC4', borderRadius: 24, backgroundColor: '#FFFFFF99' },
  signInText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  hero: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 88, gap: 52 },
  heroDesktop: { minHeight: 620, flexDirection: 'row', alignItems: 'center', paddingTop: 34 },
  heroCopy: { flex: 1, alignItems: 'flex-start' },
  heroCopyDesktop: { paddingRight: 54 },
  eyebrowPill: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#FFFFFFB8', borderWidth: 1, borderColor: '#ECD7DB' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.emerald },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { marginTop: 23, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 52, lineHeight: 56, letterSpacing: -1.5, maxWidth: 600 },
  heroTitleDesktop: { fontSize: 72, lineHeight: 74, letterSpacing: -2.5 },
  heroBody: { marginTop: 20, color: COLORS.onSurfaceVariant, fontSize: 17, lineHeight: 27, maxWidth: 570 },
  heroBodyDesktop: { fontSize: 19, lineHeight: 30 },
  heroDots: { marginTop: 22, flexDirection: 'row', gap: 7 },
  heroDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D6BEC4' },
  heroDotActive: { width: 24, backgroundColor: COLORS.primaryContainer },
  heroActions: { width: '100%', marginTop: 24, gap: 12 },
  heroActionsDesktop: { width: 'auto', flexDirection: 'row' },
  primaryButton: { minHeight: 54, paddingHorizontal: 23, borderRadius: 28, backgroundColor: COLORS.primaryContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 54, paddingHorizontal: 23, borderRadius: 28, borderWidth: 1, borderColor: '#D8BFC4', backgroundColor: '#FFFFFF80', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  trustRow: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 530 },
  trustText: { color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 18, flex: 1 },
  routeWrap: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', position: 'relative', paddingBottom: 18 },
  routeWrapDesktop: { maxWidth: 480 },
  routeCard: { borderRadius: 28, padding: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8D5D9', shadowColor: '#5E001B', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.12, shadowRadius: 40, elevation: 8 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: '#F0E4E6' },
  routeEyebrow: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  routeTitle: { marginTop: 5, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 24 },
  secureIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  routeList: { paddingTop: 21 },
  routeItem: { minHeight: 61, flexDirection: 'row' },
  routeRail: { width: 42, alignItems: 'center' },
  routeIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#DED0D3', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  routeIconActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  routeLine: { width: 1, flex: 1, backgroundColor: '#DED0D3' },
  routeTextWrap: { flex: 1, paddingLeft: 10, paddingTop: 2, flexDirection: 'row', justifyContent: 'space-between' },
  routeLabel: { color: COLORS.onSurface, fontSize: 14, fontWeight: '600' },
  routeLabelMuted: { color: COLORS.outline },
  routeStatus: { color: COLORS.onSurfaceVariant, fontSize: 11 },
  routeStatusActive: { color: COLORS.primary, fontWeight: '800' },
  nextStep: { marginTop: 5, borderRadius: 16, padding: 14, backgroundColor: COLORS.surfaceContainerLow, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextStepIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nextStepCopy: { flex: 1 },
  nextStepLabel: { color: COLORS.primary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800' },
  nextStepTitle: { marginTop: 3, color: COLORS.onSurface, fontSize: 13, fontWeight: '600' },
  floatingResult: { position: 'absolute', right: -10, bottom: 0, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D8E4DC', shadowColor: '#173B2A', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 6 },
  resultIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.emeraldLight, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { color: COLORS.onSurface, fontSize: 12, fontWeight: '700' },
  resultText: { color: COLORS.onSurfaceVariant, fontSize: 10, marginTop: 2 },
  cycleOverview: { paddingVertical: 24, flexDirection: 'row', alignItems: 'center', gap: 18 },
  cycleNumber: { width: 92, height: 92, borderRadius: 46, borderWidth: 8, borderColor: '#ECD7DC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F8' },
  cycleDay: { color: COLORS.primary, fontFamily: 'serif', fontSize: 30, lineHeight: 32 },
  cycleDayLabel: { color: COLORS.onSurfaceVariant, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.7 },
  cycleSummary: { flex: 1 },
  cyclePhase: { color: COLORS.onSurface, fontSize: 15, fontWeight: '700' },
  cycleEstimate: { marginTop: 5, color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 18 },
  progressTrack: { marginTop: 13, height: 6, borderRadius: 3, backgroundColor: '#EFDFE2', overflow: 'hidden' },
  progressFill: { width: '64%', height: 6, borderRadius: 3, backgroundColor: COLORS.primaryContainer },
  cardSectionLabel: { color: COLORS.onSurfaceVariant, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  todayGrid: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  todayItem: { flex: 1, minHeight: 82, borderRadius: 13, padding: 10, backgroundColor: COLORS.surfaceContainerLow },
  todayLabel: { marginTop: 8, color: COLORS.onSurfaceVariant, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6 },
  todayValue: { marginTop: 2, color: COLORS.onSurface, fontSize: 12, fontWeight: '700' },
  communityTopics: { paddingVertical: 12, gap: 2 },
  communityTopic: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0E4E6' },
  communityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  communityCopy: { flex: 1 },
  communityTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '700' },
  communityLabel: { marginTop: 4, color: COLORS.onSurfaceVariant, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  communityPrivacy: { marginTop: 10, borderRadius: 14, padding: 14, backgroundColor: COLORS.emeraldLight, flexDirection: 'row', alignItems: 'center', gap: 10 },
  communityPrivacyText: { flex: 1, color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 17 },
  section: { width: '100%', maxWidth: 1180, paddingHorizontal: 24, paddingVertical: 92 },
  careSection: { paddingTop: 10 },
  sectionEyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionHeadingRow: { marginTop: 12, gap: 16 },
  sectionHeadingRowDesktop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { color: COLORS.onSurface, fontFamily: 'serif', fontSize: 38, lineHeight: 44, maxWidth: 610 },
  sectionTitleDesktop: { fontSize: 50, lineHeight: 56 },
  sectionIntro: { color: COLORS.onSurfaceVariant, fontSize: 15, lineHeight: 24, maxWidth: 430 },
  sectionIntroDesktop: { textAlign: 'right' },
  pillarGrid: { marginTop: 42, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  pillarCard: { width: '100%', minHeight: 230, borderRadius: 22, padding: 24, backgroundColor: '#F3E6E9' },
  pillarCardDesktop: { width: '31.9%', flexGrow: 1 },
  pillarCardPrimary: { backgroundColor: COLORS.primary },
  pillarIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pillarIconPrimary: { backgroundColor: '#FFFFFF1C' },
  pillarTitle: { marginTop: 34, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 27 },
  pillarTextPrimary: { color: '#FFFFFF' },
  pillarBody: { marginTop: 9, color: COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 21 },
  pillarBodyPrimary: { color: '#F1DDE2' },
  careGrid: { marginTop: 42, flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  careCard: { width: '100%', minHeight: 190, borderRadius: 20, padding: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDDFE2' },
  careCardDesktop: { width: '31.9%', flexGrow: 1 },
  careIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  careTitle: { marginTop: 20, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 21 },
  careBody: { marginTop: 8, color: COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 20 },
  journeySection: { width: '100%', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 76, gap: 48 },
  journeySectionDesktop: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 94, paddingHorizontal: 60 },
  journeyLead: { width: '100%', maxWidth: 500 },
  journeyLeadDesktop: { paddingRight: 70 },
  sectionEyebrowLight: { color: '#EDC9D1', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  journeyTitle: { marginTop: 12, color: '#FFFFFF', fontFamily: 'serif', fontSize: 42, lineHeight: 48 },
  journeyTitleDesktop: { fontSize: 56, lineHeight: 62 },
  journeyBody: { marginTop: 16, color: '#F1DDE2', fontSize: 16, lineHeight: 25, maxWidth: 440 },
  networkRow: { marginTop: 30, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  networkPill: { borderWidth: 1, borderColor: '#9C5368', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#750026' },
  networkText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  journeySteps: { width: '100%', maxWidth: 560, gap: 13 },
  journeyStepsDesktop: { justifyContent: 'center' },
  journeyStep: { borderRadius: 18, padding: 20, flexDirection: 'row', gap: 18, backgroundColor: '#FFFFFF0F', borderWidth: 1, borderColor: '#FFFFFF1E' },
  stepNumber: { color: '#EDC9D1', fontFamily: 'serif', fontSize: 20 },
  stepCopy: { flex: 1 },
  stepTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  stepBody: { marginTop: 6, color: '#E8D2D8', fontSize: 13, lineHeight: 20 },
  aiSection: { width: '100%', maxWidth: 1120, marginVertical: 86, marginHorizontal: 24, borderRadius: 26, padding: 26, backgroundColor: '#EBF1ED', gap: 24 },
  aiSectionDesktop: { flexDirection: 'row', alignItems: 'center', padding: 42 },
  aiBadge: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  aiCopy: { flex: 1 },
  aiTitle: { marginTop: 8, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 28, lineHeight: 34 },
  aiBody: { marginTop: 10, color: COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 21, maxWidth: 530 },
  aiFacts: { minWidth: 240, gap: 9 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  factText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600' },
  finalCta: { width: '100%', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 92, backgroundColor: '#F7E8EB' },
  finalTitle: { color: COLORS.onSurface, fontFamily: 'serif', fontSize: 40, lineHeight: 47, textAlign: 'center', maxWidth: 700 },
  finalBody: { marginTop: 12, color: COLORS.onSurfaceVariant, fontSize: 15, textAlign: 'center' },
  finalButton: { marginTop: 28, minHeight: 54, paddingHorizontal: 25, borderRadius: 28, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E4CDD2' },
  finalButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
  footer: { width: '100%', maxWidth: 1180, minHeight: 112, paddingHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' },
  brandMarkSmall: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  brandMarkSmallText: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 18, fontWeight: '700', fontStyle: 'italic' },
  footerBrand: { color: COLORS.primary, fontFamily: 'serif', fontSize: 23, fontWeight: '700', fontStyle: 'italic' },
  footerText: { color: COLORS.onSurfaceVariant, fontSize: 12 },
});
