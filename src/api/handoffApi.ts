import axios from 'axios';
import { API_BASE_URL } from './client';
import { LabResult } from './careApi';

export type PublicLabHandoff = {
  token: string;
  status: 'issued' | 'checked_in' | 'result_ready';
  reference: string;
  patient_name: string;
  test_name: string;
  ordered_by_name: string;
  provider_name?: string;
  phone?: string;
  estimated_result_at?: string;
  result?: LabResult;
};

const endpoint = (token: string) => `${API_BASE_URL}/v1/public/lab-handoffs/${encodeURIComponent(token)}`;

export const handoffApi = {
  async get(token: string): Promise<PublicLabHandoff> {
    return (await axios.get(endpoint(token), { timeout: 10000 })).data;
  },
  async update(token: string, body: Record<string, string>): Promise<PublicLabHandoff> {
    return (await axios.patch(endpoint(token), body, { timeout: 10000 })).data;
  },
};

export type PublicPharmacyHandoff = {token:string;status:'issued'|'checked_in'|'dispensed';reference:string;patient_name:string;medicine:string;dose:string;frequency:string;duration_days:number;instructions?:string;prescribed_by:string;provider_name?:string;phone?:string};
const pharmacyEndpoint = (token:string) => `${API_BASE_URL}/v1/public/pharmacy-handoffs/${encodeURIComponent(token)}`;
export const pharmacyHandoffApi = {
  async get(token:string):Promise<PublicPharmacyHandoff>{return (await axios.get(pharmacyEndpoint(token),{timeout:10000})).data},
  async update(token:string,body:Record<string,string>):Promise<PublicPharmacyHandoff>{return (await axios.patch(pharmacyEndpoint(token),body,{timeout:10000})).data},
};
