import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { LabOrder } from '../api/careApi';
import { ClinicalIntelligence, ClinicalTestSuggestion, ProviderAction, ProviderCase, providerApi } from '../api/providerApi';
import { LabProfile, SupportedClinicalTest, labPartnerApi } from '../api/labPartnerApi';

type ProviderRole = 'clinician' | 'lab' | 'admin';

const STATUS_LABELS: Record<string, string> = {
  care_recommended: 'Care recommended',
  awaiting_payment: 'Awaiting payment',
  awaiting_test: 'Awaiting test',
  awaiting_results: 'Awaiting results',
  awaiting_clinician: 'Awaiting clinician',
  awaiting_appointment: 'Appointment required',
  appointment_scheduled: 'Appointment scheduled',
  follow_up: 'Follow-up',
};

const statusLabel = (value?: string) => STATUS_LABELS[value || ''] || 'New case';
const concernLabel = (value?: string) => (value || 'Patient care').replaceAll('_', ' ');

export const ProviderWorkspace: React.FC<{ role: ProviderRole; displayName: string; onLogout: () => void; onManageProfile?: () => void }> = ({ role, displayName, onLogout, onManageProfile }) => {
  const { width } = useWindowDimensions();
  const desktop = width >= 920;
  const [cases, setCases] = useState<ProviderCase[]>([]);
  const [current, setCurrent] = useState<ProviderCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [testName, setTestName] = useState('');
  const [testID, setTestID] = useState('');
  const [supportedTests, setSupportedTests] = useState<SupportedClinicalTest[]>([]);
  const [resultNotes, setResultNotes] = useState<Record<string, string>>({});
  const [resultURLs, setResultURLs] = useState<Record<string, string>>({});
  const [appointmentAt, setAppointmentAt] = useState('');
  const [medicine, setMedicine] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [instructions, setInstructions] = useState('');
  const [reminderTimes, setReminderTimes] = useState('08:00, 20:00');
  const [labApplications, setLabApplications] = useState<LabProfile[]>([]);
  const [clinicalIntelligence, setClinicalIntelligence] = useState<ClinicalIntelligence | null>(null);
  const [clinicalLoading, setClinicalLoading] = useState(false);

  const title = role === 'lab' ? 'Laboratory workspace' : role === 'admin' ? 'Care operations' : 'Clinician workspace';
  const queueTitle = role === 'lab' ? 'Test orders' : 'Care queue';

  const load = async () => {
    setError('');
    try {
      const next = await providerApi.listCases();
      setCases(next);
      setCurrent((selected) => next.find((item) => item.id === selected?.id) || next[0] || null);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not load the care queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!current || role !== 'clinician') { setClinicalIntelligence(null); return; }
    let active = true;
    setClinicalLoading(true);
    providerApi.clinicalIntelligence(current.id)
      .then((value) => { if (active) setClinicalIntelligence(value); })
      .catch(() => { if (active) setClinicalIntelligence({ case_id: current.id, clinical_intelligence_available: false, candidate_conditions: [], supporting_findings: [], missing_information: [], red_flags: [], recommended_tests: [], conditional_tests: [], triggered_rules: [], knowledge_review_status: 'unavailable', clinician_review_required: true }); })
      .finally(() => { if (active) setClinicalLoading(false); });
    return () => { active = false; };
  }, [current?.id, current?.revision, role]);
  useEffect(() => {
    if (role === 'admin') labPartnerApi.applications().then(setLabApplications).catch(() => setError('Could not load laboratory applications.'));
  }, [role]);
  useEffect(() => {
    if (role === 'clinician') labPartnerApi.supportedTests().then(setSupportedTests).catch(() => setError('Could not load the clinical test catalogue.'));
  }, [role]);

  const reviewLab = async (profile: LabProfile, decision: 'approve' | 'reject', reason = '') => {
    setBusy(true); setError('');
    try {
      const updated = await labPartnerApi.review(profile.owner_user_id || '', decision, reason);
      setLabApplications((items) => items.map((item) => item.owner_user_id === updated.owner_user_id ? updated : item));
    } catch (e: any) { setError(e.response?.data?.error || 'Could not review this laboratory.'); }
    finally { setBusy(false); }
  };

  const update = async (action: Omit<ProviderAction, 'revision'>) => {
    if (!current) return;
    setBusy(true);
    setError('');
    try {
      const updated = await providerApi.updateCase(current.id, { ...action, revision: current.revision });
      setCurrent(updated);
      setCases((items) => items.map((item) => item.id === updated.id ? updated : item));
      if (action.action === 'order_test') { setTestName(''); setTestID(''); }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not update this case.');
      if (e.response?.status === 409) void load();
    } finally {
      setBusy(false);
    }
  };

  const metrics = useMemo(() => ({
    active: cases.length,
    waiting: cases.filter((item) => item.workflow?.status === 'awaiting_clinician' || item.workflow?.status === 'awaiting_results').length,
    priority: cases.filter((item) => item.assessment?.urgency === 'urgent').length,
  }), [cases]);

  if (Platform.OS !== 'web') {
    return <View style={styles.mobileNotice}><MaterialCommunityIcons name="monitor" size={34} color={COLORS.primary} /><Text style={styles.detailTitle}>{title}</Text><Text style={styles.muted}>Provider workspaces are available on the web.</Text><Action label="Sign out" onPress={onLogout} secondary /></View>;
  }

  return (
    <View style={styles.shell}>
      <View style={[styles.sidebar, !desktop && styles.sidebarMobile]}>
        <View style={styles.logoRow}><View style={styles.logo}><Text style={styles.logoText}>S</Text></View><Text style={styles.brand}>Sadé</Text></View>
        {desktop ? <View style={styles.navList}>
          <View style={styles.navActive}><MaterialCommunityIcons name={role === 'lab' ? 'flask-outline' : 'view-dashboard-outline'} size={20} color="#FFFFFF" /><Text style={styles.navActiveText}>{queueTitle}</Text></View>
          <View style={styles.navItem}><MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.onSurfaceVariant} /><Text style={styles.navText}>Updates</Text></View>
        </View> : null}
        <TouchableOpacity style={styles.account} onPress={onLogout}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text></View>
          {desktop ? <View style={styles.accountCopy}><Text numberOfLines={1} style={styles.accountName}>{displayName}</Text><Text style={styles.accountRole}>{role}</Text></View> : null}
          <MaterialCommunityIcons name="logout" size={19} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <View style={styles.workspace}>
        <View style={styles.topbar}>
          <View><Text style={styles.eyebrow}>Sadé provider network</Text><Text style={styles.pageTitle}>{title}</Text></View>
          <View style={styles.topActions}>{onManageProfile ? <TouchableOpacity style={styles.refresh} onPress={onManageProfile}><MaterialCommunityIcons name="office-building-cog-outline" size={19} color={COLORS.primary} /><Text style={styles.refreshText}>Laboratory profile</Text></TouchableOpacity> : null}<TouchableOpacity style={styles.refresh} onPress={load}><MaterialCommunityIcons name="refresh" size={19} color={COLORS.primary} /><Text style={styles.refreshText}>Refresh</Text></TouchableOpacity></View>
        </View>

        {role !== 'lab' ? <View style={styles.metrics}>
          <Metric label="Active cases" value={metrics.active} icon="folder-heart-outline" />
          <Metric label="Waiting on team" value={metrics.waiting} icon="clock-outline" />
          <Metric label="Urgent" value={metrics.priority} icon="alert-circle-outline" alert={metrics.priority > 0} />
        </View> : null}

        {error ? <View style={styles.errorBox}><MaterialCommunityIcons name="alert-circle-outline" size={18} color={COLORS.error} /><Text style={styles.errorText}>{error}</Text></View> : null}

        {role === 'admin' ? <AdminLabApplications applications={labApplications} busy={busy} onReview={reviewLab} /> : null}

        <View style={[styles.content, !desktop && styles.contentMobile]}>
          <View style={[styles.queue, !desktop && styles.queueMobile]}>
            <View style={styles.queueHeader}><Text style={styles.sectionTitle}>{queueTitle}</Text><View style={styles.countPill}><Text style={styles.countText}>{cases.length}</Text></View></View>
            {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} /> : null}
            {!loading && cases.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons name="check-circle-outline" size={28} color={COLORS.emerald} /><Text style={styles.emptyTitle}>Queue clear</Text><Text style={styles.muted}>New work will appear here.</Text></View> : null}
            <ScrollView style={styles.queueScroll}>
              {cases.map((item) => {
                const selected = current?.id === item.id;
                return <TouchableOpacity key={item.id} style={[styles.caseRow, selected && styles.caseRowSelected]} onPress={() => setCurrent(item)}>
                  <View style={styles.caseRowTop}><Text style={styles.patientName}>{item.patient.display_name}</Text><View style={[styles.statusDot, item.assessment?.urgency === 'urgent' && styles.statusDotUrgent]} /></View>
                  <Text style={styles.concern}>{role === 'lab' ? `${item.workflow?.lab_orders?.length || 0} test order${item.workflow?.lab_orders?.length === 1 ? '' : 's'}` : concernLabel(item.intake?.concern)}</Text>
                  <View style={styles.caseMeta}><Text style={styles.statusText}>{statusLabel(item.workflow?.status)}</Text><Text style={styles.timeText}>{new Date(item.updated_at).toLocaleDateString()}</Text></View>
                </TouchableOpacity>;
              })}
            </ScrollView>
          </View>

          <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
            {!current ? <View style={styles.emptyDetail}><MaterialCommunityIcons name="clipboard-text-outline" size={34} color={COLORS.outline} /><Text style={styles.muted}>Select a case to continue.</Text></View> : (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.patientAvatar}><Text style={styles.patientAvatarText}>{current.patient.display_name.charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.detailHeaderCopy}><Text style={styles.detailTitle}>{current.patient.display_name}</Text><Text style={styles.caseID}>Case {current.id.slice(0, 8).toUpperCase()}</Text></View>
                  <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{statusLabel(current.workflow?.status)}</Text></View>
                </View>

                <View style={styles.progressRow}>
                  {['Payment', 'Test', 'Results', 'Clinician'].map((step, index) => <React.Fragment key={step}>
                    <View style={styles.progressStep}><View style={[styles.progressCircle, workflowStep(current, index) && styles.progressCircleDone]}><MaterialCommunityIcons name={workflowStep(current, index) ? 'check' : 'circle-small'} size={17} color={workflowStep(current, index) ? '#FFFFFF' : COLORS.outline} /></View><Text style={styles.progressText}>{step}</Text></View>
                    {index < 3 ? <View style={[styles.progressLine, workflowStep(current, index + 1) && styles.progressLineDone]} /> : null}
                  </React.Fragment>)}
                </View>

                {role !== 'lab' ? <ClinicianCase canPractice={role === 'clinician'} current={current} busy={busy} clinicalIntelligence={clinicalIntelligence} clinicalLoading={clinicalLoading} supportedTests={supportedTests} testID={testID} setTestID={setTestID} testName={testName} setTestName={setTestName} appointmentAt={appointmentAt} setAppointmentAt={setAppointmentAt} medicine={medicine} setMedicine={setMedicine} dose={dose} setDose={setDose} frequency={frequency} setFrequency={setFrequency} durationDays={durationDays} setDurationDays={setDurationDays} instructions={instructions} setInstructions={setInstructions} reminderTimes={reminderTimes} setReminderTimes={setReminderTimes} update={update} /> : <LabCase current={current} busy={busy} resultNotes={resultNotes} setResultNotes={setResultNotes} resultURLs={resultURLs} setResultURLs={setResultURLs} update={update} />}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

function ClinicianCase({ canPractice, current, busy, clinicalIntelligence, clinicalLoading, supportedTests, testID, setTestID, testName, setTestName, appointmentAt, setAppointmentAt, medicine, setMedicine, dose, setDose, frequency, setFrequency, durationDays, setDurationDays, instructions, setInstructions, reminderTimes, setReminderTimes, update }: any) {
  const [knowledgeFeedback, setKnowledgeFeedback] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [testCatalogueOpen, setTestCatalogueOpen] = useState(false);
  const schedule = () => {
    const when = new Date(appointmentAt);
    if (!appointmentAt || Number.isNaN(when.getTime())) return;
    update({ action: 'schedule_appointment', scheduled_at: when.toISOString() });
  };
  return <>
    <View style={styles.twoCol}>
      <View style={[styles.panel, styles.halfPanel]}><Text style={styles.panelLabel}>Concern</Text><Text style={styles.panelTitle}>{concernLabel(current.intake?.concern)}</Text><Text style={styles.panelBody}>{current.assessment?.title}</Text></View>
      <View style={[styles.panel, styles.halfPanel]}><Text style={styles.panelLabel}>Payment</Text><Text style={styles.panelTitle}>{current.workflow?.payment_status?.replaceAll('_', ' ') || 'Not started'}</Text>{current.workflow?.payment_status === 'pending' ? <Action label="Confirm sample payment" busy={busy} onPress={() => update({ action: 'confirm_sample_payment' })} /> : null}</View>
    </View>
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>Care summary</Text>
      <Text style={styles.panelTitle}>Clinical overview</Text>
      <Text style={styles.panelBody}>{current.care_summary?.overview || current.assessment?.title}</Text>
      <Text style={styles.panelTitle}>Recommendations</Text>
      {(current.care_summary?.recommendations || [current.assessment?.guidance]).filter(Boolean).map((item: string) => <Text key={item} style={styles.panelBody}>• {item}</Text>)}
      <Text style={styles.panelTitle}>Next plan</Text>
      {(current.care_summary?.next_plan || []).map((item: string) => <Text key={item} style={styles.panelBody}>• {item}</Text>)}
      <Text style={styles.muted}>Draft for clinician review</Text>
      {current.brief?.ai_available ? <Action label="Generate with Sadé AI" busy={busy} secondary onPress={() => update({ action: 'generate_summary' })} /> : null}
    </View>
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>Patient-reported summary</Text>
      <View style={styles.factGrid}>{(current.facts || []).filter((fact: any) => fact.id !== 'triage.guidance').map((fact: any) => <View key={fact.id} style={styles.fact}><Text style={styles.factLabel}>{fact.label}</Text><Text style={styles.factValue}>{fact.value}</Text></View>)}</View>
    </View>
    {canPractice ? <ClinicalIntelligencePanel key={current.id} value={clinicalIntelligence} loading={clinicalLoading} busy={busy} decisions={current.clinician_decisions || []} onDecision={update} /> : null}
    {canPractice ? <View style={styles.panel}>
      <Text style={styles.panelLabel}>Laboratory orders</Text>
      {(current.workflow?.lab_orders || []).map((order: LabOrder) => <OrderCard key={order.id} order={order}>{order.status === 'result_ready' ? <Action label="Mark result reviewed" busy={busy} onPress={() => update({ action: 'review_result', order_id: order.id })} /> : null}</OrderCard>)}
      <TouchableOpacity style={styles.catalogueTrigger} onPress={() => setTestCatalogueOpen((open) => !open)}><View style={styles.orderCopy}><Text style={styles.panelTitle}>{testName || 'Select a clinical test'}</Text>{testID ? <Text style={styles.muted}>{testID.replaceAll('_', ' ')}</Text> : null}</View><MaterialCommunityIcons name={testCatalogueOpen ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} /></TouchableOpacity>
      {testCatalogueOpen ? <ScrollView style={styles.testCatalogue} nestedScrollEnabled>{supportedTests.map((test: SupportedClinicalTest) => <TouchableOpacity key={test.id} style={[styles.testOption, testID === test.id && styles.testOptionSelected]} onPress={() => { setTestID(test.id); setTestName(test.name); setTestCatalogueOpen(false); }}><Text style={styles.panelTitle}>{test.name}{test.abbreviation ? ` (${test.abbreviation})` : ''}</Text><Text style={styles.muted}>{test.type}{test.specimen ? ` · ${test.specimen.replaceAll('_', ' ')}` : ''}</Text></TouchableOpacity>)}</ScrollView> : null}
      <Action label="Create order" busy={busy} disabled={!testID || !testName.trim()} onPress={() => update({ action: 'order_test', test_id: testID, test_name: testName })} />
    </View> : null}
    {canPractice ? <View style={styles.panel}>
      <Text style={styles.panelLabel}>Appointment</Text>
      {current.workflow?.appointment ? <View style={styles.appointment}><MaterialCommunityIcons name="calendar-check-outline" size={22} color={COLORS.emerald} /><View><Text style={styles.panelTitle}>{new Date(current.workflow.appointment.scheduled_at).toLocaleString()}</Text><Text style={styles.muted}>{current.workflow.appointment.clinician_name} · {current.workflow.appointment.status}</Text></View></View> : <View style={styles.inlineForm}><DateTimePicker value={appointmentAt} onChange={setAppointmentAt} /><Action label="Schedule appointment" busy={busy} disabled={!appointmentAt.trim()} onPress={schedule} /></View>}
      {current.workflow?.appointment?.status === 'scheduled' ? <Action label="Complete consultation" busy={busy} onPress={() => update({ action: 'complete_consultation' })} /> : null}
    </View> : null}
    {canPractice ? <View style={styles.panel}>
      <Text style={styles.panelLabel}>Prescription and dosage</Text>
      {(current.workflow?.prescriptions || []).map((item: any) => <View key={item.id} style={styles.orderCard}><Text style={styles.panelTitle}>{item.medicine} · {item.dose}</Text><Text style={styles.panelBody}>{item.frequency} for {item.duration_days} days</Text><Text style={styles.muted}>Reminders: {(item.reminder_times || []).join(', ') || 'None'} · {item.dose_log?.length || 0} doses recorded</Text></View>)}
      <View style={styles.resultForm}><TextInput value={medicine} onChangeText={setMedicine} placeholder="Medication name" placeholderTextColor={COLORS.outline} style={styles.input}/><TextInput value={dose} onChangeText={setDose} placeholder="Dose, for example 500 mg" placeholderTextColor={COLORS.outline} style={styles.input}/><TextInput value={frequency} onChangeText={setFrequency} placeholder="Frequency, for example twice daily" placeholderTextColor={COLORS.outline} style={styles.input}/><TextInput value={durationDays} onChangeText={setDurationDays} placeholder="Duration in days" keyboardType="number-pad" placeholderTextColor={COLORS.outline} style={styles.input}/><TextInput value={reminderTimes} onChangeText={setReminderTimes} placeholder="Reminder times: 08:00, 20:00" placeholderTextColor={COLORS.outline} style={styles.input}/><TextInput multiline value={instructions} onChangeText={setInstructions} placeholder="Instructions" placeholderTextColor={COLORS.outline} style={[styles.input,styles.textarea]}/><Action label="Add prescription" busy={busy} disabled={!medicine.trim()||!dose.trim()||!frequency.trim()||Number(durationDays)<1} onPress={()=>update({action:'prescribe_medication',medicine,dose,frequency,duration_days:Number(durationDays),instructions,reminder_times:reminderTimes.split(',').map((v:string)=>v.trim()).filter(Boolean)})}/></View>
    </View> : null}
    <DecisionHistory decisions={current.clinician_decisions || []} />
    {canPractice ? <View style={styles.panel}>
      <Text style={styles.panelLabel}>Clinical knowledge feedback</Text>
      <TextInput multiline value={knowledgeFeedback} onChangeText={setKnowledgeFeedback} placeholder="Suggest a correction or improvement to Sadé’s clinical knowledge" placeholderTextColor={COLORS.outline} style={[styles.input, styles.textarea]} />
      <Action label="Send feedback" busy={feedbackBusy} disabled={knowledgeFeedback.trim().length < 20} onPress={async () => { setFeedbackBusy(true); setFeedbackStatus(''); try { await providerApi.submitKnowledgeFeedback({ case_id: current.id, target_type: 'general', suggestion: knowledgeFeedback.trim() }); setKnowledgeFeedback(''); setFeedbackStatus('Feedback submitted'); } catch { setFeedbackStatus('Could not submit feedback'); } finally { setFeedbackBusy(false); } }} />
      {feedbackStatus ? <Text style={styles.muted}>{feedbackStatus}</Text> : null}
    </View> : null}
  </>;
}

function ClinicalIntelligencePanel({ value, loading, busy, decisions, onDecision }: { value: ClinicalIntelligence | null; loading: boolean; busy: boolean; decisions: any[]; onDecision: (action: Omit<ProviderAction, 'revision'>) => void }) {
  const [reviewing, setReviewing] = useState<Record<string, 'dismiss' | 'replace' | undefined>>({});
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [conditionRationales, setConditionRationales] = useState<Record<string, string>>({});
  if (loading) return <View style={styles.panel}><Text style={styles.panelLabel}>Clinical intelligence</Text><ActivityIndicator color={COLORS.primary} /></View>;
  if (!value?.clinical_intelligence_available) return <View style={styles.panel}><Text style={styles.panelLabel}>Clinical intelligence</Text><Text style={styles.muted}>Clinical knowledge is temporarily unavailable. Existing triage remains active.</Text></View>;
  const decidedTests = new Set(decisions.filter((item) => item.type === 'test_suggestion').map((item) => item.reference_id));
  const tests = [...value.recommended_tests, ...value.conditional_tests].filter((item) => !decidedTests.has(item.test_id));
  return <View style={styles.panel}>
    <View style={styles.intelligenceHeader}><View><Text style={styles.panelLabel}>Clinical intelligence</Text><Text style={styles.panelTitle}>Suggested investigations</Text></View><View style={styles.reviewBadge}><Text style={styles.reviewBadgeText}>{value.knowledge_review_status.replaceAll('_', ' ')}</Text></View></View>
    {value.red_flags.length > 0 ? <View style={styles.clinicalAlert}><MaterialCommunityIcons name="alert-circle-outline" size={18} color={COLORS.error} /><Text style={styles.errorText}>{value.red_flags.join(', ').replaceAll('_', ' ')}</Text></View> : null}
    {value.candidate_conditions.length > 0 ? <View style={styles.resultForm}><Text style={styles.factLabel}>Candidates for assessment</Text>{value.candidate_conditions.map((condition) => <View key={condition.id} style={styles.suggestionCard}><View style={styles.orderCopy}><Text style={styles.panelTitle}>{condition.name}</Text><Text style={styles.panelBody}>{condition.description}</Text><TextInput value={conditionRationales[condition.id] || ''} onChangeText={(text: string) => setConditionRationales((old) => ({ ...old, [condition.id]: text }))} placeholder="Clinical rationale" placeholderTextColor={COLORS.outline} style={styles.input} /></View><View style={styles.decisionActions}>{(['considering','confirmed','excluded'] as const).map((outcome) => <Action key={outcome} label={outcome} busy={busy} secondary={outcome !== 'confirmed'} disabled={(conditionRationales[condition.id] || '').trim().length < 10} onPress={() => onDecision({ action: 'record_condition_assessment', condition_id: condition.id, assessment_outcome: outcome, rationale: conditionRationales[condition.id] })} />)}</View></View>)}</View> : null}
    {tests.length === 0 ? <Text style={styles.muted}>No investigation is suggested by the current rules. Use clinical judgement and review missing information.</Text> : tests.map((test) => <View key={test.test_id} style={styles.suggestionCard}>
      <View style={styles.orderCopy}><Text style={styles.panelTitle}>{test.name}{test.abbreviation ? ` (${test.abbreviation})` : ''}</Text><Text style={styles.statusText}>{test.group} · {test.priority} priority</Text>{test.reasons.map((reason) => <Text key={reason} style={styles.panelBody}>{reason}</Text>)}
      {reviewing[test.test_id] ? <View style={styles.resultForm}><TextInput value={rationales[test.test_id] || ''} onChangeText={(text: string) => setRationales((old) => ({ ...old, [test.test_id]: text }))} placeholder="Clinical rationale" placeholderTextColor={COLORS.outline} style={styles.input} />{reviewing[test.test_id] === 'replace' ? <TextInput value={replacements[test.test_id] || ''} onChangeText={(text: string) => setReplacements((old) => ({ ...old, [test.test_id]: text }))} placeholder="Replacement test" placeholderTextColor={COLORS.outline} style={styles.input} /> : null}</View> : null}</View>
      <View style={styles.decisionActions}><Action label="Order" busy={busy} onPress={() => onDecision({ action: 'confirm_suggested_test', test_id: test.test_id })} /><Action label="Dismiss" busy={busy} secondary onPress={() => reviewing[test.test_id] === 'dismiss' ? onDecision({ action: 'dismiss_suggested_test', test_id: test.test_id, rationale: rationales[test.test_id] || '' }) : setReviewing((old) => ({ ...old, [test.test_id]: 'dismiss' }))} disabled={reviewing[test.test_id] === 'dismiss' && (test.priority === 'high' || test.priority === 'critical') && (rationales[test.test_id] || '').trim().length < 10} /><Action label="Replace" busy={busy} secondary onPress={() => reviewing[test.test_id] === 'replace' ? onDecision({ action: 'replace_suggested_test', test_id: test.test_id, test_name: replacements[test.test_id], rationale: rationales[test.test_id] || '' }) : setReviewing((old) => ({ ...old, [test.test_id]: 'replace' }))} disabled={reviewing[test.test_id] === 'replace' && ((rationales[test.test_id] || '').trim().length < 10 || !(replacements[test.test_id] || '').trim())} /></View>
    </View>)}
    {value.missing_information.length > 0 ? <Text style={styles.muted}>Missing: {value.missing_information.join(', ').replaceAll('_', ' ')}</Text> : null}
    <Text style={styles.muted}>Suggestions do not create orders until confirmed by a clinician.</Text>
  </View>;
}

function DecisionHistory({ decisions }: { decisions: any[] }) {
  if (!decisions.length) return null;
  return <View style={styles.panel}><Text style={styles.panelLabel}>Clinical decision history</Text>{[...decisions].reverse().map((decision) => <View key={decision.id} style={styles.decisionRow}><View style={styles.orderCopy}><Text style={styles.panelTitle}>{decision.reference_name || decision.type} · {decision.action.replaceAll('_', ' ')}</Text>{decision.replacement ? <Text style={styles.panelBody}>Replaced with {decision.replacement}</Text> : null}{decision.rationale ? <Text style={styles.panelBody}>{decision.rationale}</Text> : null}<Text style={styles.muted}>{decision.clinician_name} · {new Date(decision.created_at).toLocaleString()}</Text></View></View>)}</View>;
}

function DateTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'datetime-local',
      value,
      min: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      onChange: (event: any) => onChange(event.target.value),
      'aria-label': 'Appointment date and time',
      style: { minHeight: 44, flex: 1, minWidth: 230, borderRadius: 10, border: '1px solid #DFD1D4', background: '#FFFFFF', padding: '0 12px', color: COLORS.onSurface, fontSize: 12 },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={COLORS.outline} style={styles.input} />;
}

function LabCase({ current, busy, resultNotes, setResultNotes, resultURLs, setResultURLs, update }: any) {
  return <View style={styles.panel}>
    <Text style={styles.panelLabel}>Assigned tests</Text>
    {(current.workflow?.lab_orders || []).map((order: LabOrder) => <OrderCard key={order.id} order={order}>
      {order.status === 'ordered' ? <Action label="Mark sample collected" busy={busy} onPress={() => update({ action: 'collect_sample', order_id: order.id })} /> : null}
      {order.status === 'sample_collected' ? <View style={styles.resultForm}>
        <TextInput multiline value={resultNotes[order.id] || ''} onChangeText={(value: string) => setResultNotes((old: any) => ({ ...old, [order.id]: value }))} placeholder="Result summary" placeholderTextColor={COLORS.outline} style={[styles.input, styles.textarea]} />
        <TextInput value={resultURLs[order.id] || ''} onChangeText={(value: string) => setResultURLs((old: any) => ({ ...old, [order.id]: value }))} placeholder="Secure result URL (optional)" placeholderTextColor={COLORS.outline} style={styles.input} />
        <Action label="Publish result to clinician" busy={busy} disabled={!(resultNotes[order.id] || '').trim()} onPress={() => update({ action: 'upload_result', order_id: order.id, result_summary: resultNotes[order.id], document_url: resultURLs[order.id] })} />
      </View> : null}
    </OrderCard>)}
  </View>;
}

function AdminLabApplications({ applications, busy, onReview }: { applications: LabProfile[]; busy: boolean; onReview: (profile: LabProfile, decision: 'approve' | 'reject', reason?: string) => void }) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  return <View style={styles.adminLabs}><View style={styles.queueHeader}><Text style={styles.sectionTitle}>Laboratory applications</Text><View style={styles.countPill}><Text style={styles.countText}>{applications.filter((item) => item.status === 'pending_review').length}</Text></View></View>
    <ScrollView horizontal contentContainerStyle={styles.applicationList}>
      {applications.length === 0 ? <Text style={styles.muted}>No laboratory registrations yet.</Text> : applications.map((profile) => <View key={profile.owner_user_id} style={styles.applicationCard}>
        <Text style={styles.panelTitle}>{profile.trading_name}</Text><Text style={styles.muted}>{profile.legal_name} · {profile.registration_number}</Text><Text style={styles.panelBody}>{profile.locations.length} location{profile.locations.length === 1 ? '' : 's'} · {profile.offerings.length} test{profile.offerings.length === 1 ? '' : 's'}</Text><Text style={styles.statusText}>{profile.status?.replaceAll('_', ' ')}</Text>
        {profile.status === 'pending_review' ? <><TextInput value={reasons[profile.owner_user_id || ''] || ''} onChangeText={(value: string) => setReasons((old) => ({ ...old, [profile.owner_user_id || '']: value }))} placeholder="Reason if rejecting" placeholderTextColor={COLORS.outline} style={styles.input} /><View style={styles.reviewActions}><Action label="Approve" busy={busy} onPress={() => onReview(profile, 'approve')} /><Action label="Reject" busy={busy} secondary disabled={!reasons[profile.owner_user_id || '']?.trim()} onPress={() => onReview(profile, 'reject', reasons[profile.owner_user_id || ''])} /></View></> : null}
      </View>)}
    </ScrollView>
  </View>;
}

function OrderCard({ order, children }: { order: LabOrder; children?: React.ReactNode }) {
  return <View style={styles.orderCard}><View style={styles.orderTop}><View style={styles.orderIcon}><MaterialCommunityIcons name="flask-outline" size={21} color={COLORS.primary} /></View><View style={styles.orderCopy}><Text style={styles.panelTitle}>{order.test_name}</Text><Text style={styles.muted}>{order.status.replaceAll('_', ' ')}</Text></View></View>{order.result ? <View style={styles.resultBox}><Text style={styles.factLabel}>Laboratory result</Text><Text style={styles.factValue}>{order.result.summary}</Text>{order.result.document_url ? <Text style={styles.resultLink}>{order.result.document_url}</Text> : null}</View> : null}{children}</View>;
}

function Metric({ label, value, icon, alert = false }: any) { return <View style={styles.metric}><View style={[styles.metricIcon, alert && styles.metricIconAlert]}><MaterialCommunityIcons name={icon} size={22} color={alert ? COLORS.error : COLORS.primary} /></View><View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View></View>; }
function Action({ label, onPress, busy = false, disabled = false, secondary = false }: any) { return <TouchableOpacity disabled={busy || disabled} onPress={onPress} style={[styles.action, secondary && styles.actionSecondary, (busy || disabled) && styles.actionDisabled]}>{busy ? <ActivityIndicator color={secondary ? COLORS.primary : '#FFFFFF'} /> : <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>}</TouchableOpacity>; }
function workflowStep(c: ProviderCase, index: number) { const status = c.workflow?.status; if (index === 0) return c.workflow?.payment_status === 'paid' || c.workflow?.payment_status === 'not_required'; if (index === 1) return ['awaiting_results', 'awaiting_clinician', 'awaiting_appointment', 'appointment_scheduled', 'follow_up'].includes(status); if (index === 2) return ['awaiting_clinician', 'awaiting_appointment', 'appointment_scheduled', 'follow_up'].includes(status); return ['awaiting_appointment', 'appointment_scheduled', 'follow_up'].includes(status); }

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#F8F5F5' },
  sidebar: { width: 238, padding: 22, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#EADFE1', justifyContent: 'space-between' },
  sidebarMobile: { width: 74, paddingHorizontal: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 21, fontWeight: '700', fontStyle: 'italic' }, brand: { color: COLORS.primary, fontFamily: 'serif', fontSize: 25, fontWeight: '700', fontStyle: 'italic' },
  navList: { flex: 1, paddingTop: 52, gap: 8 }, navActive: { minHeight: 48, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: COLORS.primary }, navActiveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' }, navItem: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, navText: { color: COLORS.onSurfaceVariant, fontSize: 13 },
  account: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: COLORS.primary, fontWeight: '800' }, accountCopy: { flex: 1 }, accountName: { color: COLORS.onSurface, fontSize: 12, fontWeight: '700' }, accountRole: { color: COLORS.onSurfaceVariant, fontSize: 10, textTransform: 'capitalize', marginTop: 2 },
  workspace: { flex: 1, minWidth: 0, padding: 26, gap: 20 }, topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }, eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 }, pageTitle: { marginTop: 4, color: COLORS.onSurface, fontFamily: 'serif', fontSize: 29 }, refresh: { minHeight: 42, paddingHorizontal: 15, borderRadius: 21, borderWidth: 1, borderColor: '#E0D2D5', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 7 }, refreshText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, metric: { minWidth: 180, flex: 1, minHeight: 92, borderRadius: 16, padding: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE3E5', flexDirection: 'row', alignItems: 'center', gap: 13 }, metricIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }, metricIconAlert: { backgroundColor: '#FFEDEA' }, metricValue: { color: COLORS.onSurface, fontSize: 21, fontWeight: '800' }, metricLabel: { marginTop: 2, color: COLORS.onSurfaceVariant, fontSize: 11 },
  errorBox: { borderRadius: 12, padding: 12, backgroundColor: '#FFEDEA', flexDirection: 'row', alignItems: 'center', gap: 8 }, errorText: { color: COLORS.error, fontSize: 12 },
  adminLabs: { flexShrink: 0, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE3E5', overflow: 'hidden' }, applicationList: { padding: 14, gap: 12 }, applicationCard: { width: 310, borderRadius: 14, padding: 14, gap: 9, backgroundColor: '#FCF9F9', borderWidth: 1, borderColor: '#EEE4E6' }, reviewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  content: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 16 }, contentMobile: { flexDirection: 'column' }, queue: { width: 320, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EDE3E5', overflow: 'hidden' }, queueMobile: { width: '100%', maxHeight: 260 }, queueHeader: { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEE4E6' }, sectionTitle: { color: COLORS.onSurface, fontSize: 14, fontWeight: '800' }, countPill: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }, countText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' }, queueScroll: { flex: 1 },
  caseRow: { padding: 16, gap: 5, borderBottomWidth: 1, borderBottomColor: '#F0E7E9' }, caseRowSelected: { backgroundColor: '#FFF0F2', borderLeftWidth: 3, borderLeftColor: COLORS.primaryContainer }, caseRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, patientName: { color: COLORS.onSurface, fontSize: 13, fontWeight: '800' }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.emerald }, statusDotUrgent: { backgroundColor: COLORS.error }, concern: { color: COLORS.onSurfaceVariant, fontSize: 11, textTransform: 'capitalize' }, caseMeta: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }, statusText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' }, timeText: { color: COLORS.outline, fontSize: 9 },
  empty: { padding: 32, alignItems: 'center', gap: 7 }, emptyTitle: { color: COLORS.onSurface, fontSize: 14, fontWeight: '700' }, muted: { color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 17, textTransform: 'capitalize' },
  detail: { flex: 1, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EDE3E5' }, detailContent: { padding: 24, paddingBottom: 48, gap: 18 }, emptyDetail: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 }, detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 }, patientAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, patientAvatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' }, detailHeaderCopy: { flex: 1 }, detailTitle: { color: COLORS.onSurface, fontFamily: 'serif', fontSize: 22 }, caseID: { marginTop: 3, color: COLORS.outline, fontSize: 9, letterSpacing: 0.8 }, statusBadge: { borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: COLORS.emeraldLight }, statusBadgeText: { color: COLORS.emerald, fontSize: 10, fontWeight: '800' },
  progressRow: { paddingVertical: 18, flexDirection: 'row', alignItems: 'flex-start' }, progressStep: { alignItems: 'center', gap: 6 }, progressCircle: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, borderColor: '#D8CBCD', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, progressCircleDone: { borderColor: COLORS.emerald, backgroundColor: COLORS.emerald }, progressText: { color: COLORS.onSurfaceVariant, fontSize: 9 }, progressLine: { flex: 1, height: 2, marginTop: 12, backgroundColor: '#E5DADD' }, progressLineDone: { backgroundColor: COLORS.emerald },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, panel: { flexShrink: 0, minWidth: 250, borderRadius: 15, padding: 17, gap: 12, backgroundColor: '#FCF9F9', borderWidth: 1, borderColor: '#EEE4E6' }, halfPanel: { flexGrow: 1, flexBasis: 250 }, panelLabel: { color: COLORS.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, panelTitle: { color: COLORS.onSurface, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' }, panelBody: { color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 17 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, fact: { width: '48%', minWidth: 190, borderRadius: 10, padding: 11, backgroundColor: '#FFFFFF' }, factLabel: { color: COLORS.outline, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6 }, factValue: { marginTop: 4, color: COLORS.onSurface, fontSize: 11, lineHeight: 17 },
  inlineForm: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, input: { minHeight: 44, flex: 1, minWidth: 210, borderRadius: 10, borderWidth: 1, borderColor: '#DFD1D4', backgroundColor: '#FFFFFF', paddingHorizontal: 12, color: COLORS.onSurface, fontSize: 12 }, textarea: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }, action: { minHeight: 42, borderRadius: 10, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryContainer }, actionSecondary: { backgroundColor: COLORS.surfaceContainerHigh }, actionDisabled: { opacity: 0.5 }, actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' }, actionTextSecondary: { color: COLORS.primary },
  catalogueTrigger: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: '#DFD1D4', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }, testCatalogue: { maxHeight: 320, borderRadius: 12, borderWidth: 1, borderColor: '#E9DEE0', backgroundColor: '#FFFFFF', overflow: 'hidden' }, testOption: { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1E8EA' }, testOptionSelected: { backgroundColor: COLORS.surfaceContainerLow },
  orderCard: { borderRadius: 12, padding: 13, gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9DEE0' }, orderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, orderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }, orderCopy: { flex: 1 }, resultBox: { borderRadius: 10, padding: 12, backgroundColor: COLORS.emeraldLight }, resultLink: { marginTop: 6, color: COLORS.primary, fontSize: 10 }, resultForm: { gap: 8 }, appointment: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  intelligenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, reviewBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFF0D6' }, reviewBadgeText: { color: '#7A4A00', fontSize: 9, fontWeight: '800', textTransform: 'capitalize' }, clinicalAlert: { borderRadius: 10, padding: 11, backgroundColor: '#FFEDEA', flexDirection: 'row', gap: 8, alignItems: 'center' }, suggestionCard: { borderRadius: 12, padding: 13, gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9DEE0', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  decisionActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, decisionRow: { borderRadius: 11, padding: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9DEE0' },
  mobileNotice: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.background },
});
