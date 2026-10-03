import { apiClient } from './client';
export type Intake = {concern:string;concern_detail?:string;onset:string;severity:number;impact:string;pregnancy:string;urgent_symptoms:boolean;details:string;include_history:boolean};
export type CareFact = {id:string;label:string;value:string;date?:string};
export type CarePackage = {id:string;name:string;description:string;includes:string[];provider:string;price_minor:number;currency:string;booking_url:string;sample:boolean};
export type CareTask = {id:string;title:string;due_date:string;status:'pending'|'completed';source:string};
export type LabResult = {summary:string;document_url?:string;uploaded_at:string;uploaded_by:string};
export type ExternalHandoff = {token:string;status:'issued'|'checked_in'|'result_ready'|'dispensed';provider_name?:string;phone?:string;estimated_result_at?:string;reminder_status?:string;created_at:string};
export type LabOrder = {id:string;test_id?:string;test_name:string;status:'ordered'|'sample_collected'|'result_ready'|'reviewed';ordered_at:string;ordered_by_name?:string;external_handoff?:ExternalHandoff;result?:LabResult};
export type Prescription = {id:string;medicine:string;dose:string;frequency:string;duration_days:number;instructions?:string;reminder_times:string[];status:'active'|'completed'|'cancelled';prescribed_at:string;prescribed_by:string;dose_log:{taken_at:string;status:string}[];external_handoff?:ExternalHandoff};
export type CareWorkflow = {status:string;payment_status:string;lab_orders:LabOrder[];prescriptions:Prescription[];appointment?:{scheduled_at:string;clinician:string;clinician_name:string;status:'scheduled'|'completed'}};
export type CareSummary = {overview:string;recommendations:string[];next_plan:string[];source:string;review_status:string;generated_at:string;model?:string};
export type ClinicianDecision = {id:string;type:'test_suggestion'|'test_order'|'condition_assessment';action:string;reference_id?:string;reference_name?:string;replacement_id?:string;replacement?:string;priority?:string;rationale?:string;clinician_id:string;clinician_name:string;created_at:string};
export type CareCase = {id:string;revision:number;status:'open'|'archived';intake:Intake;assessment:{urgency:string;title:string;guidance:string;rule_version:string};facts:CareFact[];packages:CarePackage[];selected_package_id?:string;tasks:CareTask[];brief:{ai_available:boolean;source:string;sections:{heading:string;fact_ids:string[]}[]};care_summary:CareSummary;workflow:CareWorkflow;clinician_decisions:ClinicianDecision[];created_at:string;updated_at:string};
export type CareMutation = {revision:number;action:string;package_id?:string;task_id?:string;order_id?:string;prescription_id?:string;taken_at?:string;title?:string;due_date?:string;status?:string};
export const careApi = {
 async list():Promise<CareCase[]>{return (await apiClient.get('/v1/me/care/cases')).data},
 async get(id:string):Promise<CareCase>{return (await apiClient.get(`/v1/me/care/cases/${id}`)).data},
 async create(intake:Intake,key:string):Promise<CareCase>{return (await apiClient.post('/v1/me/care/cases',intake,{headers:{'Idempotency-Key':key}})).data},
 async update(id:string,change:CareMutation):Promise<CareCase>{return (await apiClient.patch(`/v1/me/care/cases/${id}`,change)).data},
 async brief(id:string,revision:number):Promise<CareCase>{return (await apiClient.post(`/v1/me/care/cases/${id}/brief`,{revision},{timeout:110000})).data},
};
export const concernLabels:Record<string,string>={pelvic_pain:'Pelvic pain',heavy_bleeding:'Heavy bleeding',unexpected_bleeding:'Unexpected bleeding',discharge:'Discharge, itching or burning',cycle_change:'Missed or irregular period',recurring_concern:'Recurring concern',other:'Something else'};
