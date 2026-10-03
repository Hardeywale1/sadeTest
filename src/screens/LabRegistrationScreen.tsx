import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { LabLocation, LabOffering, LabProfile, SupportedClinicalTest, labPartnerApi } from '../api/labPartnerApi';
import { getDeviceCoordinates } from '../services/deviceLocation';

const blankLocation = (): LabLocation => ({ id: '', name: '', address_line_1: '', city: '', state: '', country: 'NG', latitude: 0, longitude: 0, phone: '', collection_methods: ['walk_in'], active: true });
const blankOffering = (): LabOffering => ({ id: '', test_id: '', test_name: '', specimen: '', location_ids: [], price_minor: 0, currency: 'NGN', turnaround_hours: 24, active: true });
const blankProfile = (): LabProfile => ({ legal_name: '', trading_name: '', registration_number: '', contact_name: '', contact_email: '', contact_phone: '', website: '', locations: [blankLocation()], offerings: [blankOffering()], terms_accepted: false, information_confirmed: false });
type FieldErrors = Record<string, string>;

const validate = (profile: LabProfile): FieldErrors => {
  const errors: FieldErrors = {};
  if (profile.legal_name.trim().length < 2) errors.legal_name = 'Enter the registered legal name.';
  if (profile.trading_name.trim().length < 2) errors.trading_name = 'Enter the laboratory trading name.';
  if (profile.registration_number.trim().length < 3) errors.registration_number = 'Enter a valid registration number.';
  if (profile.contact_name.trim().length < 2) errors.contact_name = 'Enter the primary contact name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contact_email.trim())) errors.contact_email = 'Enter a valid contact email.';
  if (profile.contact_phone.trim().length < 7) errors.contact_phone = 'Enter a valid contact phone number.';
  if (profile.website && !/^https:\/\/[^\s]+$/i.test(profile.website.trim())) errors.website = 'Use a complete HTTPS website address.';
  profile.locations.forEach((location, index) => {
    const key = `locations.${index}`;
    if (!location.name.trim()) errors[`${key}.name`] = 'Enter a name for this location.';
    if (!location.address_line_1.trim()) errors[`${key}.address`] = 'Enter the street address.';
    if (!location.city.trim()) errors[`${key}.city`] = 'Enter the city.';
    if (!location.state.trim()) errors[`${key}.state`] = 'Enter the state.';
    if (location.phone.trim().length < 7) errors[`${key}.phone`] = 'Enter a valid location phone number.';
    if (!location.collection_methods.length) errors[`${key}.collection`] = 'Select at least one collection method.';
  });
  profile.offerings.forEach((offering, index) => {
    const key = `offerings.${index}`;
    if (!offering.test_id) errors[`${key}.test`] = 'Choose a Sadé-supported test.';
    if (!offering.specimen.trim()) errors[`${key}.specimen`] = 'Enter the specimen used for this test.';
    if (offering.price_minor <= 0) errors[`${key}.price`] = 'Enter a price greater than zero.';
    if (offering.turnaround_hours < 1 || offering.turnaround_hours > 720) errors[`${key}.turnaround`] = 'Enter a turnaround between 1 and 720 hours.';
  });
  if (!profile.information_confirmed) errors.information_confirmed = 'Confirm that the information and prices are accurate.';
  if (!profile.terms_accepted) errors.terms_accepted = 'Accept the partner terms and privacy requirements.';
  return errors;
};

export const LabRegistrationScreen: React.FC<{ onLogout: () => void; onBack?: () => void }> = ({ onLogout, onBack }) => {
  const [profile, setProfile] = useState<LabProfile>(blankProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [supportedTests, setSupportedTests] = useState<SupportedClinicalTest[]>([]);
  const [openCatalogue, setOpenCatalogue] = useState<number | null>(null);
  const [locating, setLocating] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<FieldErrors>({});

  useEffect(() => {
    Promise.all([labPartnerApi.mine(), labPartnerApi.supportedTests()]).then(([value, tests]) => { if (value) setProfile(value); setSupportedTests(tests); }).catch((e) => setError(e.response?.data?.error || 'Could not load the laboratory profile.')).finally(() => setLoading(false));
  }, []);

  const update = (field: keyof LabProfile, value: any) => { setValidationErrors({}); setProfile((current) => ({ ...current, [field]: value })); };
  const updateLocation = (index: number, field: keyof LabLocation, value: any) => { setValidationErrors({}); setProfile((current) => ({ ...current, locations: current.locations.map((item, i) => i === index ? { ...item, [field]: value } : item) })); };
  const updateOffering = (index: number, field: keyof LabOffering, value: any) => { setValidationErrors({}); setProfile((current) => ({ ...current, offerings: current.offerings.map((item, i) => i === index ? { ...item, [field]: value } : item) })); };
  const selectTest = (index: number, test: SupportedClinicalTest) => {
    setValidationErrors({});
    setProfile((current) => ({ ...current, offerings: current.offerings.map((item, i) => i === index ? { ...item, test_id: test.id, test_name: test.name, specimen: test.specimen || test.type, preparation_instructions: test.preparation || [] } : item) }));
    setOpenCatalogue(null);
  };
  const locate = async (index: number) => {
    setLocating(index); setError('');
    try {
      const value = await getDeviceCoordinates();
      update('locations', profile.locations.map((item, i) => i === index ? { ...item, latitude: value.latitude, longitude: value.longitude, geocoding_status: 'resolved' } : item));
    } catch (e: any) { setError(e?.message || 'Could not get this device location.'); }
    finally { setLocating(null); }
  };
  const submit = async () => {
    const errors = validate(profile);
    if (Object.keys(errors).length) { setValidationErrors(errors); setError('Review the highlighted fields.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      let sourceLocations = profile.locations;
      if (sourceLocations.length === 1 && sourceLocations[0].latitude === 0 && sourceLocations[0].longitude === 0) {
        try {
          const value = await getDeviceCoordinates();
          sourceLocations = [{ ...sourceLocations[0], latitude: value.latitude, longitude: value.longitude, geocoding_status: 'resolved' }];
        } catch { /* The address is still saved for later server-side geocoding. */ }
      }
      const locations = sourceLocations.map((item, index) => ({ ...item, id: item.id || `${item.name || 'location'}_${index + 1}` }));
      const locationIDs = locations.map((item) => item.id);
      const offerings = profile.offerings.map((item) => ({ ...item, location_ids: item.location_ids.length ? item.location_ids : locationIDs }));
      setProfile(await labPartnerApi.save({ ...profile, locations, offerings }));
      setSaved(true);
    } catch (e: any) { setError(e.response?.data?.error || 'Could not submit the laboratory profile.'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <View style={styles.header}>
      <View><Text style={styles.eyebrow}>Sadé partner network</Text><Text style={styles.title}>Laboratory registration</Text><Text style={styles.subtitle}>Provide the legal, operational and service information required for verification.</Text></View>
      <View style={styles.headerActions}>{onBack ? <SmallAction label="Workspace" onPress={onBack} /> : null}<SmallAction label="Sign out" onPress={onLogout} /></View>
    </View>
    {profile.status ? <View style={[styles.status, profile.status === 'verified' && styles.verified]}><Text style={styles.statusTitle}>{profile.status.replaceAll('_', ' ')}</Text><Text style={styles.statusText}>{profile.status === 'pending_review' ? 'Sadé is reviewing the submitted information. Patient orders remain unavailable until approval.' : profile.status === 'verified' ? 'This laboratory is verified and eligible for matching.' : profile.rejection_reason || 'Update the profile and submit it again.'}</Text></View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}{saved ? <Text style={styles.success}>Profile submitted for verification.</Text> : null}
    <Section title="Organization">
      <Field label="Registered legal name" value={profile.legal_name} error={validationErrors.legal_name} onChange={(v) => update('legal_name', v)} />
      <Field label="Trading name" value={profile.trading_name} error={validationErrors.trading_name} onChange={(v) => update('trading_name', v)} />
      <Field label="Business registration number" value={profile.registration_number} error={validationErrors.registration_number} onChange={(v) => update('registration_number', v)} />
      <Field label="Laboratory accreditation number (optional)" value={profile.accreditation_number || ''} onChange={(v) => update('accreditation_number', v)} />
      <Field label="Website (HTTPS, optional)" value={profile.website || ''} error={validationErrors.website} onChange={(v) => update('website', v)} />
    </Section>
    <Section title="Primary contact">
      <Field label="Contact person" value={profile.contact_name} error={validationErrors.contact_name} onChange={(v) => update('contact_name', v)} />
      <Field label="Email" value={profile.contact_email} error={validationErrors.contact_email} onChange={(v) => update('contact_email', v)} />
      <Field label="Phone" value={profile.contact_phone} error={validationErrors.contact_phone} onChange={(v) => update('contact_phone', v)} />
    </Section>
    <Section title="Locations" action="Add location" onAction={() => update('locations', [...profile.locations, blankLocation()])}>
      {profile.locations.map((location, index) => <View key={index} style={styles.subcard}>
        <View style={styles.subhead}><Text style={styles.subheadText}>Location {index + 1}</Text>{profile.locations.length > 1 ? <Remove onPress={() => update('locations', profile.locations.filter((_, i) => i !== index))} /> : null}</View>
        <Field label="Location name" value={location.name} error={validationErrors[`locations.${index}.name`]} onChange={(v) => updateLocation(index, 'name', v)} />
        <Field label="Street address" value={location.address_line_1} error={validationErrors[`locations.${index}.address`]} onChange={(v) => updateLocation(index, 'address_line_1', v)} />
        <Field label="Address line 2 (optional)" value={location.address_line_2 || ''} onChange={(v) => updateLocation(index, 'address_line_2', v)} />
        <View style={styles.row}><Field label="City" value={location.city} error={validationErrors[`locations.${index}.city`]} onChange={(v) => updateLocation(index, 'city', v)} /><Field label="State" value={location.state} error={validationErrors[`locations.${index}.state`]} onChange={(v) => updateLocation(index, 'state', v)} /></View>
        <Field label="Postal code (optional)" value={location.postal_code || ''} onChange={(v) => updateLocation(index, 'postal_code', v)} />
        <Field label="Location phone" value={location.phone} error={validationErrors[`locations.${index}.phone`]} onChange={(v) => updateLocation(index, 'phone', v)} />
        <SmallAction label={locating === index ? 'Getting location…' : location.geocoding_status === 'resolved' ? 'Update device location' : 'Use device location'} onPress={() => { if (locating === null) void locate(index); }} />
        {location.geocoding_status === 'resolved' ? <Text style={styles.help}>Location confirmed · {location.formatted_address || location.address_line_1}</Text> : location.geocoding_status ? <Text style={styles.help}>Address saved · nearby matching will activate when location lookup is available.</Text> : null}
        <Toggle label="Walk-in collection" selected={location.collection_methods.includes('walk_in')} onPress={() => updateLocation(index, 'collection_methods', toggle(location.collection_methods, 'walk_in'))} />
        <Toggle label="Appointment collection" selected={location.collection_methods.includes('appointment')} onPress={() => updateLocation(index, 'collection_methods', toggle(location.collection_methods, 'appointment'))} />
        <Toggle label="Home collection" selected={location.collection_methods.includes('home_collection')} onPress={() => updateLocation(index, 'collection_methods', toggle(location.collection_methods, 'home_collection'))} />
        {validationErrors[`locations.${index}.collection`] ? <Text style={styles.fieldError}>{validationErrors[`locations.${index}.collection`]}</Text> : null}
      </View>)}
    </Section>
    <Section title="Tests and prices" action="Add test" onAction={() => update('offerings', [...profile.offerings, blankOffering()])}>
      {profile.offerings.map((offering, index) => <View key={index} style={styles.subcard}>
        <View style={styles.subhead}><Text style={styles.subheadText}>Test {index + 1}</Text>{profile.offerings.length > 1 ? <Remove onPress={() => update('offerings', profile.offerings.filter((_, i) => i !== index))} /> : null}</View>
        <Text style={styles.label}>Sadé-supported test</Text>
        <TouchableOpacity style={[styles.catalogueSelect, validationErrors[`offerings.${index}.test`] && styles.inputError]} onPress={() => setOpenCatalogue(openCatalogue === index ? null : index)}><Text style={offering.test_name ? styles.catalogueValue : styles.cataloguePlaceholder}>{offering.test_name || 'Choose a test'}</Text><MaterialCommunityIcons name={openCatalogue === index ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} /></TouchableOpacity>
        {validationErrors[`offerings.${index}.test`] ? <Text style={styles.fieldError}>{validationErrors[`offerings.${index}.test`]}</Text> : null}
        {openCatalogue === index ? <View style={styles.catalogue}>{supportedTests.map((test) => <TouchableOpacity key={test.id} style={[styles.catalogueItem, offering.test_id === test.id && styles.catalogueItemSelected]} onPress={() => selectTest(index, test)}><Text style={styles.catalogueItemTitle}>{test.name}{test.abbreviation ? ` (${test.abbreviation})` : ''}</Text><Text style={styles.help}>{test.type}{test.specimen ? ` · ${test.specimen.replaceAll('_', ' ')}` : ''}</Text></TouchableOpacity>)}</View> : null}
        <View style={styles.row}><Field label="Laboratory test code" value={offering.lab_test_code || ''} onChange={(v) => updateOffering(index, 'lab_test_code', v)} /><Field label="Specimen" value={offering.specimen} error={validationErrors[`offerings.${index}.specimen`]} onChange={(v) => updateOffering(index, 'specimen', v)} /></View>
        <View style={styles.row}><Field label="Price in naira" value={offering.price_minor ? String(offering.price_minor / 100) : ''} error={validationErrors[`offerings.${index}.price`]} onChange={(v) => updateOffering(index, 'price_minor', Math.round(Number(v) * 100))} /><Field label="Turnaround hours" value={String(offering.turnaround_hours || '')} error={validationErrors[`offerings.${index}.turnaround`]} onChange={(v) => updateOffering(index, 'turnaround_hours', Number(v))} /></View>
        <Field label="Preparation instructions (one per line)" value={(offering.preparation_instructions || []).join('\n')} multiline onChange={(v) => updateOffering(index, 'preparation_instructions', v.split('\n').map((x) => x.trim()).filter(Boolean))} />
      </View>)}
    </Section>
    <View style={styles.confirmations}><Toggle label="I confirm that the information and prices are accurate." selected={profile.information_confirmed} onPress={() => update('information_confirmed', !profile.information_confirmed)} />{validationErrors.information_confirmed ? <Text style={styles.fieldError}>{validationErrors.information_confirmed}</Text> : null}<Toggle label="I accept the Sadé partner terms and privacy requirements." selected={profile.terms_accepted} onPress={() => update('terms_accepted', !profile.terms_accepted)} />{validationErrors.terms_accepted ? <Text style={styles.fieldError}>{validationErrors.terms_accepted}</Text> : null}</View>
    <TouchableOpacity style={[styles.submit, saving && { opacity: .6 }]} disabled={saving} onPress={submit}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit for verification</Text>}</TouchableOpacity>
  </ScrollView>;
};

const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
const Section = ({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) => <View style={styles.section}><View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action ? <SmallAction label={action} onPress={onAction!} /> : null}</View>{children}</View>;
const Field = ({ label, value, onChange, multiline = false, error }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; error?: string }) => <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline, error && styles.inputError]} multiline={multiline} value={value} onChangeText={onChange} />{error ? <Text style={styles.fieldError}>{error}</Text> : null}</View>;
const Toggle = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => <TouchableOpacity style={styles.toggle} onPress={onPress}><MaterialCommunityIcons name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={21} color={selected ? COLORS.primary : COLORS.outline} /><Text style={styles.toggleText}>{label}</Text></TouchableOpacity>;
const SmallAction = ({ label, onPress }: { label: string; onPress: () => void }) => <TouchableOpacity style={styles.smallAction} onPress={onPress}><Text style={styles.smallActionText}>{label}</Text></TouchableOpacity>;
const Remove = ({ onPress }: { onPress: () => void }) => <TouchableOpacity onPress={onPress}><MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} /></TouchableOpacity>;

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F8F5F5'},content:{width:'100%',maxWidth:1040,alignSelf:'center',padding:30,paddingBottom:70,gap:18},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:20},headerActions:{flexDirection:'row',gap:8},eyebrow:{color:COLORS.primary,fontSize:10,fontWeight:'800',textTransform:'uppercase',letterSpacing:1.1},title:{fontFamily:'serif',fontSize:31,color:COLORS.onSurface,marginTop:4},subtitle:{color:COLORS.onSurfaceVariant,fontSize:12,marginTop:6},section:{backgroundColor:'#fff',borderWidth:1,borderColor:'#EDE3E5',borderRadius:18,padding:20,gap:13},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{fontFamily:'serif',fontSize:21,color:COLORS.onSurface},subcard:{backgroundColor:'#FCF9F9',borderRadius:14,padding:16,gap:11,borderWidth:1,borderColor:'#EEE4E6'},subhead:{flexDirection:'row',justifyContent:'space-between'},subheadText:{fontWeight:'800',color:COLORS.primary,fontSize:12},row:{flexDirection:'row',flexWrap:'wrap',gap:12},field:{flex:1,minWidth:230,gap:6},label:{fontSize:11,fontWeight:'700',color:COLORS.onSurface},input:{minHeight:44,borderWidth:1,borderColor:'#DFD1D4',borderRadius:10,paddingHorizontal:12,backgroundColor:'#fff',fontSize:12,color:COLORS.onSurface},inputError:{borderColor:COLORS.error,backgroundColor:'#FFF8F7'},fieldError:{fontSize:10,color:COLORS.error,fontWeight:'600'},multiline:{minHeight:82,paddingTop:11,textAlignVertical:'top'},help:{fontSize:10,color:COLORS.outline},catalogueSelect:{minHeight:46,borderWidth:1,borderColor:'#DFD1D4',borderRadius:10,paddingHorizontal:12,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},catalogueValue:{fontSize:12,color:COLORS.onSurface,fontWeight:'700'},cataloguePlaceholder:{fontSize:12,color:COLORS.outline},catalogue:{borderWidth:1,borderColor:'#E4D9DB',borderRadius:12,backgroundColor:'#fff'},catalogueItem:{paddingHorizontal:13,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#F1E8EA'},catalogueItemSelected:{backgroundColor:COLORS.emeraldLight},catalogueItemTitle:{fontSize:12,fontWeight:'700',color:COLORS.onSurface},toggle:{flexDirection:'row',alignItems:'center',gap:8,minHeight:34},toggleText:{fontSize:11,color:COLORS.onSurfaceVariant,flex:1},smallAction:{minHeight:38,paddingHorizontal:13,borderRadius:19,borderWidth:1,borderColor:'#DCCDD0',alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},smallActionText:{color:COLORS.primary,fontSize:11,fontWeight:'800'},confirmations:{backgroundColor:'#fff',borderRadius:16,padding:18,gap:5},submit:{minHeight:50,borderRadius:25,backgroundColor:COLORS.primaryContainer,alignItems:'center',justifyContent:'center'},submitText:{color:'#fff',fontWeight:'800',fontSize:13},status:{borderRadius:14,padding:15,backgroundColor:'#FFF1D8'},verified:{backgroundColor:COLORS.emeraldLight},statusTitle:{fontWeight:'800',fontSize:12,textTransform:'capitalize',color:COLORS.onSurface},statusText:{marginTop:4,color:COLORS.onSurfaceVariant,fontSize:11,lineHeight:17},error:{color:COLORS.error,fontSize:12},success:{color:COLORS.emerald,fontSize:12,fontWeight:'700'},
});
