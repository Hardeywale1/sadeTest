import React,{useEffect,useState} from 'react';
import {ActivityIndicator,ScrollView,Text,TextInput,View} from 'react-native';
import {cycleApi} from '../api/cycleApi';
import {SymptomLog} from '../types';
import {CalendarField} from '../components/CalendarField';
import {Button,Choice,ui} from '../components/CareUI';
import {COLORS} from '../theme/colors';
import {CycleScreen} from './CycleScreen';
import {WellnessTrackerScreen} from './WellnessTrackerScreen';
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
type Tab='today'|'history'|'cycle'|'health';
export const TrackerScreen:React.FC<{initialView?:'today'|'cycle'}>=({initialView='today'})=>{
 const[tab,setTab]=useState<Tab>(initialView);const[date,setDate]=useState(today);const[form,setForm]=useState<Partial<SymptomLog>>({});const[history,setHistory]=useState<SymptomLog[]>([]);const[loading,setLoading]=useState(true);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[saved,setSaved]=useState(false);const[retry,setRetry]=useState(0);
 useEffect(()=>{let cancelled=false;setLoading(true);setError('');setSaved(false);(async()=>{try{const response=await cycleApi.listSymptomsHistory(365);if(!cancelled){setHistory(response.symptoms||[]);setForm(response.symptoms?.find(v=>v.date===date)||{})}}catch{if(!cancelled)setError('Could not load your log. Retry before making changes.')}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[date,retry]);
 const update=(patch:Partial<SymptomLog>)=>{setForm(old=>({...old,...patch}));setSaved(false)};
 const toggle=(key:'locations'|'ailments',v:string)=>update({[key]:form[key]?.includes(v)?form[key]!.filter(s=>s!==v):[...(form[key]||[]),v]});
 const save=async()=>{if(!form.flow||form.pain_level===undefined){setError('Select flow and pain level.');return}setBusy(true);setError('');try{const result=await cycleApi.logSymptoms({...form,date,locations:form.locations||[],ailments:form.ailments||[]});setHistory(old=>[result,...old.filter(v=>v.date!==date)]);setSaved(true)}catch(e:any){setError(e.response?.data?.error||'Could not save your log. Try again.')}finally{setBusy(false)}};
 return <View style={ui.page}><View style={{paddingHorizontal:20,paddingVertical:12,gap:15}}><Text style={ui.title}>Your health log</Text><View style={ui.wrap}>{(['today','history','cycle','health'] as Tab[]).map(v=><Choice key={v} label={{today:'Daily log',history:'History',cycle:'Cycle',health:'Wellness'}[v]} selected={tab===v} onPress={()=>setTab(v)}/>)}</View></View>
 {tab==='cycle'?<CycleScreen/>:tab==='health'?<WellnessTrackerScreen/>:<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
 {loading?<ActivityIndicator color={COLORS.primary}/>:null}{error?<View accessibilityRole="alert" style={ui.card}><Text style={ui.error}>{error}</Text><Button label="Retry" secondary onPress={()=>setRetry(v=>v+1)}/></View>:null}
 {tab==='today'?<><CalendarField label="Date" value={date} onChange={setDate} maximumDate={today()}/>
 <View style={ui.card}><Text style={ui.heading}>Menstrual flow</Text><View style={ui.wrap}>{['None','Spotting','Light','Medium','Heavy','Very heavy'].map(v=><Choice key={v} label={v} selected={form.flow===v} onPress={()=>update({flow:v})}/>)}</View></View>
 <View style={ui.card}><Text style={ui.heading}>Pain & discomfort</Text><View style={ui.wrap}>{Array.from({length:11},(_,v)=><Choice key={v} label={String(v)} selected={form.pain_level===v} onPress={()=>update({pain_level:v})}/>)}</View><Text style={ui.small}>0 · No pain     10 · Worst imaginable</Text><Text style={ui.label}>Where?</Text><View style={ui.wrap}>{['Pelvis','Lower back','Thighs','Head'].map(v=><Choice key={v} label={v} selected={form.locations?.includes(v)||false} onPress={()=>toggle('locations',v)}/>)}</View></View>
 <View style={ui.card}><Text style={ui.heading}>Discharge</Text><View style={ui.wrap}>{['None','Dry','Sticky','Creamy','Clear & stretchy','Unusual odour or colour'].map(v=><Choice key={v} label={v} selected={form.discharge===v} onPress={()=>update({discharge:v})}/>)}</View></View>
 <View style={ui.card}><Text style={ui.heading}>Mood & energy</Text><View style={ui.wrap}>{['Calm','Anxious','Irritable','Low mood','Positive'].map(v=><Choice key={v} label={v} selected={form.mood===v} onPress={()=>update({mood:v})}/>)}</View><Text style={ui.label}>Energy</Text><View style={ui.wrap}>{['Low','Usual','High'].map(v=><Choice key={v} label={v} selected={form.energy===v} onPress={()=>update({energy:v})}/>)}</View></View>
 <View style={ui.card}><Text style={ui.heading}>Other symptoms</Text><View style={ui.wrap}>{['Bloating','Nausea','Constipation','Loose stools','Breast tenderness','Fatigue'].map(v=><Choice key={v} label={v} selected={form.ailments?.includes(v)||false} onPress={()=>toggle('ailments',v)}/>)}</View><TextInput accessibilityLabel="Daily note" style={[ui.input,{minHeight:90,textAlignVertical:'top'}]} multiline placeholder="Add a note (optional)" value={form.note||''} onChangeText={(note:string)=>update({note})} maxLength={4000}/></View>
 {form.flow==='Very heavy'||(form.pain_level??0)>=8?<Text style={ui.error}>For severe pain, fainting or very heavy bleeding, seek urgent medical care.</Text>:null}
 <Button label={saved?'Log saved':'Save daily log'} onPress={save} busy={busy} disabled={loading||error.startsWith('Could not load')}/>
 </>:null}
 {tab==='history'?history.length?history.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=><View key={v.id||v.date} style={ui.card}><Text style={ui.eyebrow}>{v.date}</Text><Text style={ui.heading}>{v.pain_level!==undefined?`Pain ${v.pain_level}/10`:'Symptom log'}</Text><Text style={ui.text}>{[v.flow?`Flow: ${v.flow}`:'',v.mood,v.energy?`Energy: ${v.energy}`:'',...(v.ailments||[])].filter(Boolean).join(' · ')}</Text>{v.note?<Text style={ui.text}>{v.note}</Text>:null}<Button label="Edit log" secondary onPress={()=>{setDate(v.date);setTab('today')}}/></View>):!loading&&!error?<Text style={ui.text}>No symptom logs yet.</Text>:null:null}
 </ScrollView>}
 </View>
};
