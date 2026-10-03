import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import QRCode from 'qrcode';
import { CalendarField } from '../components/CalendarField';
import { Button, ui } from '../components/CareUI';
import { handoffApi, PublicLabHandoff } from '../api/handoffApi';
import { COLORS } from '../theme/colors';

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export const ExternalLabHandoffScreen: React.FC<{ token: string }> = ({ token }) => {
  const [handoff, setHandoff] = useState<PublicLabHandoff | null>(null);
  const [providerName, setProviderName] = useState('');
  const [phone, setPhone] = useState('');
  const [estimatedAt, setEstimatedAt] = useState(today());
  const [result, setResult] = useState('');
  const [documentURL, setDocumentURL] = useState('');
  const [qr, setQR] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    handoffApi.get(token).then(setHandoff).catch((e) => setError(e.response?.data?.error || 'This laboratory request is unavailable.'));
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      QRCode.toDataURL(window.location.href, { width: 220, margin: 1, color: { dark: '#681227', light: '#FFFFFF' } }).then(setQR).catch(() => undefined);
    }
  }, [token]);

  const checkIn = async () => {
    if (!providerName.trim() || phone.trim().length < 7) { setError('Enter the laboratory name and phone number.'); return; }
    setBusy(true); setError('');
    try { setHandoff(await handoffApi.update(token, { action: 'check_in', provider_name: providerName, phone, estimated_result_at: estimatedAt })); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not complete laboratory check-in.'); }
    finally { setBusy(false); }
  };

  const upload = async () => {
    if (!result.trim()) { setError('Add the result summary.'); return; }
    setBusy(true); setError('');
    try { setHandoff(await handoffApi.update(token, { action: 'upload_result', result_summary: result, document_url: documentURL })); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not publish this result.'); }
    finally { setBusy(false); }
  };

  const print = () => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.print(); };

  if (!handoff && !error) return <View style={[ui.page, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={COLORS.primary} /></View>;
  return <ScrollView style={ui.page} contentContainerStyle={[ui.content, { maxWidth: 660, alignSelf: 'center', width: '100%' }]}>
    <Text style={ui.eyebrow}>Sadé care handoff</Text><Text style={ui.title}>Laboratory request</Text>
    {error ? <View style={ui.card}><Text style={ui.error}>{error}</Text></View> : null}
    {handoff ? <>
      <View style={ui.card}><Text style={ui.eyebrow}>Request {handoff.reference}</Text><Text style={ui.heading}>{handoff.test_name}</Text><Text style={ui.text}>Patient: {handoff.patient_name}</Text><Text style={ui.text}>Requested by: {handoff.ordered_by_name || 'Sadé clinician'}</Text>{qr ? <Image source={{ uri: qr }} style={{ width: 180, height: 180, alignSelf: 'center', marginTop: 12 }} /> : null}<Button label="Print or save as PDF" secondary onPress={print} /></View>
      {handoff.status === 'issued' ? <View style={ui.card}><Text style={ui.heading}>Laboratory check-in</Text><TextInput style={ui.input} placeholder="Laboratory name" value={providerName} onChangeText={setProviderName} maxLength={160} /><TextInput style={ui.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={24} /><CalendarField label="Estimated result date" value={estimatedAt} onChange={setEstimatedAt} minimumDate={today()} /><Button label="Confirm check-in" busy={busy} onPress={checkIn} /></View> : null}
      {handoff.status === 'checked_in' ? <View style={ui.card}><Text style={ui.heading}>Upload result</Text><Text style={ui.small}>{handoff.provider_name} · expected {handoff.estimated_result_at}</Text><TextInput style={[ui.input, { minHeight: 110, textAlignVertical: 'top' }]} multiline placeholder="Result summary" value={result} onChangeText={setResult} maxLength={2000} /><TextInput style={ui.input} placeholder="Secure document URL (optional)" value={documentURL} onChangeText={setDocumentURL} autoCapitalize="none" /><Button label="Send result to clinician" busy={busy} onPress={upload} /></View> : null}
      {handoff.status === 'result_ready' ? <View style={[ui.card, { backgroundColor: COLORS.emeraldLight }]}><Text style={ui.heading}>Result sent</Text><Text style={ui.text}>The Sadé clinician can now review this result.</Text></View> : null}
    </> : null}
  </ScrollView>;
};
