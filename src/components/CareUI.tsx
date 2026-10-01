import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 36, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { fontFamily: 'serif', fontSize: 32, lineHeight: 39, color: COLORS.onSurface },
  heading: { fontFamily: 'serif', fontSize: 23, lineHeight: 30, color: COLORS.onSurface },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface, lineHeight: 21 },
  text: { fontSize: 14, lineHeight: 22, color: COLORS.onSurfaceVariant },
  small: { fontSize: 12, lineHeight: 18, color: COLORS.onSurfaceVariant },
  eyebrow: { fontSize: 11, letterSpacing: 1.3, fontWeight: '700', color: COLORS.primaryContainer, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: COLORS.roseBorder },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.roseBorder, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.onSurface, minHeight: 48 },
  error: { color: COLORS.error, fontSize: 14, lineHeight: 21 },
  divider: { height: 1, backgroundColor: COLORS.roseBorder },
});
export function Button({label,onPress,secondary=false,busy=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;busy?:boolean;disabled?:boolean}) {
 return <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled:disabled||busy}} disabled={disabled||busy} onPress={onPress} style={{minHeight:50,borderRadius:12,padding:14,alignItems:'center',justifyContent:'center',backgroundColor:secondary?COLORS.surfaceContainerHigh:COLORS.primaryContainer,opacity:disabled||busy?0.55:1}}>{busy?<ActivityIndicator color={secondary?COLORS.primary:'#FFFFFF'}/>:<Text style={{fontSize:14,fontWeight:'600',color:secondary?COLORS.primary:'#FFFFFF'}}>{label}</Text>}</TouchableOpacity>;
}
export function Choice({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}) {
 return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:selected}} onPress={onPress} style={{minHeight:44,borderRadius:12,paddingHorizontal:14,paddingVertical:11,backgroundColor:selected?COLORS.surfaceContainerHighest:COLORS.cardBg,borderWidth:1,borderColor:selected?COLORS.primaryContainer:COLORS.roseBorder}}><Text style={{color:selected?COLORS.primary:COLORS.onSurfaceVariant,fontSize:13,fontWeight:selected?'600':'400'}}>{selected?'✓  ':''}{label}</Text></TouchableOpacity>;
}
export function ActionCard({title,detail,icon,onPress,tone='light'}:{title:string;detail?:string;icon:keyof typeof MaterialCommunityIcons.glyphMap;onPress:()=>void;tone?:'light'|'primary'|'muted'}) {
 const dark=tone==='primary';return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:14,padding:18,minHeight:94,borderRadius:14,backgroundColor:dark?COLORS.primaryContainer:tone==='muted'?COLORS.secondaryContainer:COLORS.surfaceContainerHigh}}><View style={{width:46,height:46,borderRadius:23,backgroundColor:dark?'#FFFFFF18':'#FFFFFF80',alignItems:'center',justifyContent:'center'}}><MaterialCommunityIcons name={icon} size={25} color={dark?'#FFFFFF':COLORS.primary}/></View><View style={{flex:1,gap:4}}><Text style={{fontSize:16,fontWeight:'600',color:dark?'#FFFFFF':COLORS.onSurface}}>{title}</Text>{detail?<Text style={{fontSize:12,lineHeight:18,color:dark?'#FFE5EA':COLORS.onSurfaceVariant}}>{detail}</Text>:null}</View><MaterialCommunityIcons name="chevron-right" size={22} color={dark?'#FFFFFF':COLORS.primary}/></TouchableOpacity>;
}
export function Back({onPress,label='Back'}:{onPress:()=>void;label?:string}){return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[ui.row,{minHeight:44,alignSelf:'flex-start'}]}><MaterialCommunityIcons name="arrow-left" size={21} color={COLORS.primary}/><Text style={ui.label}>{label}</Text></TouchableOpacity>}
