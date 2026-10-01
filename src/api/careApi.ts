import { apiClient } from './client';
export type Intake = {concern:string;concern_detail?:string;onset:string;severity:number;impact:string;pregnancy:string;urgent_symptoms:boolean;details:string;include_history:boolean};
export type CareFact = {id:string;label:string;value:string;date?:string};
export type CarePackage = {id:string;name:string;description:string;includes:string[];provider:string;price_minor:number;currency:string;booking_url:string;sample:boolean};
export type CareTask = {id:string;title:string;due_date:string;status:'pending'|'completed';source:string};
export type CareCase = {id:string;revision:number;status:'open'|'archived';intake:Intake;assessment:{urgency:string;title:string;guidance:string;rule_version:string};facts:CareFact[];packages:CarePackage[];selected_package_id?:string;tasks:CareTask[];brief:{ai_available:boolean;source:string;sections:{heading:string;fact_ids:string[]}[]};created_at:string;updated_at:string};
export type CareMutation = {revision:number;action:string;package_id?:string;task_id?:string;title?:string;due_date?:string;status?:string};
export const careApi = {
 async list():Promise<CareCase[]>{return (await apiClient.get('/v1/me/care/cases')).data},
 async get(id:string):Promise<CareCase>{return (await apiClient.get(`/v1/me/care/cases/${id}`)).data},
 async create(intake:Intake,key:string):Promise<CareCase>{return (await apiClient.post('/v1/me/care/cases',intake,{headers:{'Idempotency-Key':key}})).data},
 async update(id:string,change:CareMutation):Promise<CareCase>{return (await apiClient.patch(`/v1/me/care/cases/${id}`,change)).data},
 async brief(id:string,revision:number):Promise<CareCase>{return (await apiClient.post(`/v1/me/care/cases/${id}/brief`,{revision},{timeout:25000})).data},
};
export const concernLabels:Record<string,string>={pelvic_pain:'Pelvic pain',heavy_bleeding:'Heavy bleeding',unexpected_bleeding:'Unexpected bleeding',discharge:'Discharge, itching or burning',cycle_change:'Missed or irregular period',recurring_concern:'Recurring concern',other:'Something else'};
