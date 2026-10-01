import React,{useEffect,useState} from 'react';
import {ActivityIndicator,RefreshControl,ScrollView,Text,TouchableOpacity,View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAuth} from '../context/AuthContext';
import {cycleApi} from '../api/cycleApi';
import {careApi,CareCase,concernLabels} from '../api/careApi';
import {CycleStatus} from '../types';
import {COLORS} from '../theme/colors';
import {ActionCard,Button,ui} from '../components/CareUI';
type Props={onNavigate?:(tab:'cycle'|'journal',view?:'today'|'cycle')=>void;onCare:(mode:'concern'|'home',id?:string)=>void};
export const DashboardScreen:React.FC<Props>=({onNavigate,onCare})=>{
 const {greetingName}=useAuth();const[cycle,setCycle]=useState<CycleStatus|null>(null);const[cases,setCases]=useState<CareCase[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
 const load=async()=>{setError('');const results=await Promise.allSettled([cycleApi.getStatus(),careApi.list()]);if(results[0].status==='fulfilled')setCycle(results[0].value);if(results[1].status==='fulfilled')setCases(results[1].value);if(results.some(r=>r.status==='rejected'))setError('Some updates could not load.');setLoading(false)};
 useEffect(()=>{load()},[]);
 const active=cases.filter(c=>c.status==='open');const pending=active.flatMap(c=>c.tasks.filter(t=>t.status==='pending').map(t=>({...t,caseId:c.id}))).sort((a,b)=>a.due_date.localeCompare(b.due_date));
 const known=!!cycle?.last_period_start;const hour=new Date().getHours();
 return <ScrollView style={ui.page} contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>{setLoading(true);load()}}/>}>
  <View style={{gap:8}}><Text style={ui.eyebrow}>Good {hour<12?'morning':hour<17?'afternoon':'evening'}, {greetingName}</Text><Text style={ui.title}>Your health today</Text></View>
  <View style={{gap:12}}><ActionCard title="Track Today" detail="Cycle and symptoms" icon="calendar-plus" tone="primary" onPress={()=>onNavigate?.('cycle','today')}/><ActionCard title="I Have a Concern" detail="Check what to do next" icon="shield-check-outline" onPress={()=>onCare('concern')}/><ActionCard title="Find or Prepare for Care" detail="Your care and health summary" icon="medical-bag" tone="muted" onPress={()=>onCare('home')}/></View>
  {error?<View style={ui.card}><Text style={ui.error}>{error}</Text><Button label="Retry" secondary onPress={load}/></View>:null}
  {pending.length>0?<View style={ui.card}><Text style={ui.eyebrow}>Your next step</Text><Text style={ui.heading}>{pending[0].title}</Text><Text style={ui.small}>Due {pending[0].due_date}</Text><Button label="View my plan" onPress={()=>onCare('home',pending[0].caseId)}/></View>:null}
  {active.length>0?<View style={{gap:10}}><Text style={ui.heading}>Ongoing care</Text>{active.slice(0,3).map(c=><TouchableOpacity accessibilityRole="button" key={c.id} style={[ui.card,ui.row]} onPress={()=>onCare('home',c.id)}><MaterialCommunityIcons name="clipboard-pulse-outline" size={25} color={COLORS.primary}/><View style={{flex:1,gap:4}}><Text style={ui.label}>{concernLabels[c.intake.concern]}</Text><Text style={ui.small}>{c.assessment.title}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary}/></TouchableOpacity>)}</View>:null}
  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open cycle history" style={ui.card} onPress={()=>onNavigate?.('cycle','cycle')}><View style={ui.row}><MaterialCommunityIcons name="flower-tulip-outline" size={22} color={COLORS.primary}/><Text style={ui.eyebrow}>Cycle overview</Text></View><Text style={ui.heading}>{known?`Day ${cycle!.cycle_day} · ${cycle!.phase_label}`:'Add your last period'}</Text>{known?<><View style={{flexDirection:'row',gap:5}}>{['menstrual','follicular','ovulation','luteal'].map(p=><View key={p} style={{height:7,flex:1,borderRadius:5,backgroundColor:cycle!.phase===p?COLORS.primaryContainer:COLORS.surfaceContainerHigh}}/>)}</View><Text style={ui.small}>Estimated · {cycle!.subtitle}</Text></>:<Text style={ui.small}>Keep your cycle history in one place.</Text>}</TouchableOpacity>
  <TouchableOpacity accessibilityRole="button" onPress={()=>onNavigate?.('journal')} style={[ui.row,{paddingVertical:8}]}><MaterialCommunityIcons name="notebook-edit-outline" size={23} color={COLORS.primary}/><Text style={[ui.label,{flex:1}]}>Write in your journal</Text><MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary}/></TouchableOpacity>
 </ScrollView>
};
