import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { paymentsApi } from '../api/paymentsApi';
import { Subscription } from '../types';
import { COLORS } from '../theme/colors';

const BENEFITS = [
  'Cycle, bleeding and symptom tracking',
  'Period summaries and irregular-cycle insights',
  'Journal, health history and personal goals',
  'Concern triage with your continuity record',
  'Coordinated doctor, laboratory and care updates',
  'Sadé community access',
];

export const MembershipSetupScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const start = async () => {
    setBusy(true); setError('');
    try {
      const checkout = await paymentsApi.initializePaystack();
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(checkout.authorization_url);
      else await Linking.openURL(checkout.authorization_url);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not open Paystack. Please try again.');
      setBusy(false);
    }
  };
  return <View style={styles.page}><View style={styles.card}>
    <Text style={styles.brand}>Sadé</Text>
    <Text style={styles.title}>Start your 30-day free trial</Text>
    <Text style={styles.subtitle}>Add a card securely with Paystack to activate Basic. Sadé does not receive or store your card details.</Text>
    <View style={styles.plan}><View style={styles.planHeader}><View><Text style={styles.planName}>Basic</Text><Text style={styles.price}>₦3,000<Text style={styles.period}> / month after 30 days</Text></Text></View><MaterialCommunityIcons name="check-decagram" size={27} color={COLORS.primary}/></View>
      {BENEFITS.map((benefit) => <View key={benefit} style={styles.benefit}><MaterialCommunityIcons name="check" size={17} color={COLORS.primary}/><Text style={styles.benefitText}>{benefit}</Text></View>)}
    </View>
    <Text style={styles.note}>Paystack Test Mode charges ₦50 to verify the card. Consultations, laboratory tests and medicines are paid for separately. Cancel before the trial ends to avoid the first monthly membership charge.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <TouchableOpacity style={styles.primary} onPress={start} disabled={busy}>{busy ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.primaryText}>Continue to Paystack</Text>}</TouchableOpacity>
    <TouchableOpacity style={styles.secondary} onPress={onLogout} disabled={busy}><Text style={styles.secondaryText}>Sign out</Text></TouchableOpacity>
  </View></View>;
};

export const PaymentReturnScreen: React.FC<{ authenticated: boolean; onVerified: (subscription: Subscription) => Promise<void>; onContinue: () => void }> = ({ authenticated, onVerified, onContinue }) => {
  const [state, setState] = useState<'checking'|'success'|'failed'>(authenticated ? 'checking' : 'failed');
  const [message, setMessage] = useState(authenticated ? 'Confirming your card with Paystack…' : 'Your session could not be found. Sign in and try again.');
  useEffect(() => {
    if (!authenticated || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref') || '';
    if (!reference) { setState('failed'); setMessage('Paystack did not return a payment reference.'); return; }
    paymentsApi.verifyPaystack(reference).then(async (result) => {
      if (result.status !== 'success' || !result.subscription) throw new Error(result.message || 'Paystack has not confirmed the payment.');
      await onVerified(result.subscription);
      setState('success'); setMessage('Your Basic trial is active. You can now continue to Sadé.');
    }).catch((e: any) => { setState('failed'); setMessage(e.response?.data?.error || e.message || 'The payment could not be confirmed.'); });
  }, [authenticated]);
  return <View style={styles.page}><View style={styles.resultCard}>
    {state === 'checking' ? <ActivityIndicator size="large" color={COLORS.primary}/> : <MaterialCommunityIcons name={state === 'success' ? 'check-circle-outline' : 'alert-circle-outline'} size={52} color={state === 'success' ? COLORS.primary : '#A33B3B'}/>} 
    <Text style={styles.title}>{state === 'checking' ? 'Confirming payment' : state === 'success' ? 'Trial activated' : 'Payment not confirmed'}</Text>
    <Text style={styles.subtitle}>{message}</Text>
    {state !== 'checking' ? <TouchableOpacity style={styles.primary} onPress={onContinue}><Text style={styles.primaryText}>{state === 'success' ? 'Continue to Sadé' : 'Return to membership'}</Text></TouchableOpacity> : null}
  </View></View>;
};

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:COLORS.background,alignItems:'center',justifyContent:'center',padding:20}, card:{width:'100%',maxWidth:500,backgroundColor:'#FFFFFF',borderRadius:24,padding:24},resultCard:{width:'100%',maxWidth:440,backgroundColor:'#FFFFFF',borderRadius:24,padding:28,alignItems:'center',gap:14},brand:{fontFamily:'serif',fontSize:25,fontWeight:'800',color:COLORS.primary,textAlign:'center',marginBottom:16},title:{fontFamily:'serif',fontSize:25,fontWeight:'700',color:COLORS.onSurface,textAlign:'center'},subtitle:{fontSize:13,lineHeight:20,color:COLORS.onSurfaceVariant,textAlign:'center',marginTop:7,marginBottom:18},plan:{borderWidth:2,borderColor:COLORS.primary,borderRadius:18,padding:18,backgroundColor:COLORS.surfaceContainerHigh},planHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:13},planName:{fontSize:17,fontWeight:'800',color:COLORS.onSurface},price:{fontSize:22,fontWeight:'800',color:COLORS.primary,marginTop:3},period:{fontSize:11,fontWeight:'600',color:COLORS.onSurfaceVariant},benefit:{flexDirection:'row',gap:9,alignItems:'flex-start',marginTop:9},benefitText:{flex:1,fontSize:12,lineHeight:18,color:COLORS.onSurface},note:{fontSize:10,lineHeight:16,color:COLORS.onSurfaceVariant,marginVertical:15},error:{color:'#A33B3B',fontSize:12,textAlign:'center',marginBottom:10},primary:{minHeight:49,borderRadius:14,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',paddingHorizontal:18},primaryText:{fontSize:13,fontWeight:'800',color:'#FFFFFF'},secondary:{minHeight:43,alignItems:'center',justifyContent:'center',marginTop:6},secondaryText:{fontSize:12,fontWeight:'700',color:COLORS.primary},
});
