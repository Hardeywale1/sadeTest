import { apiClient } from './client';
import {
  CycleStatus,
  CycleSettings,
  PeriodLog,
  SymptomLog,
  PainJournal,
  MedicationLog,
  OvulationLog,
} from '../types';

export const cycleApi = {
  async getStatus(): Promise<CycleStatus> {
    const res = await apiClient.get<CycleStatus>('/v1/me/cycle/status');
    return res.data;
  },

  async getSettings(): Promise<CycleSettings> {
    const res = await apiClient.get<CycleSettings>('/v1/me/cycle/settings');
    return res.data;
  },

  async updateSettings(settings: Partial<CycleSettings>): Promise<CycleSettings> {
    const res = await apiClient.put<CycleSettings>('/v1/me/cycle/settings', settings);
    return res.data;
  },

  async logPeriod(payload: { start_date: string; end_date?: string; flow_days: Array<{ date: string; intensity: string }> }): Promise<PeriodLog> {
    const res = await apiClient.post<PeriodLog>('/v1/me/cycle/periods', payload);
    return res.data;
  },

  async listPeriods(limit = 12): Promise<{ periods: PeriodLog[] }> {
    const res = await apiClient.get<{ periods: PeriodLog[] }>(`/v1/me/cycle/periods?limit=${limit}`);
    return res.data;
  },

  async logSymptoms(payload: Partial<SymptomLog> & { date: string }): Promise<SymptomLog> {
    const res = await apiClient.post<SymptomLog>('/v1/me/cycle/symptoms', payload);
    return res.data;
  },

  async getSymptomsByDate(date: string): Promise<SymptomLog> {
    const res = await apiClient.get<SymptomLog>(`/v1/me/cycle/symptoms?date=${date}`);
    return res.data;
  },

  async listSymptomsHistory(limit = 30): Promise<{ symptoms: SymptomLog[] }> {
    const res = await apiClient.get<{ symptoms: SymptomLog[] }>(`/v1/me/cycle/symptoms/history?limit=${limit}`);
    return res.data;
  },

  async logPain(payload: { date: string; pain_level: number; location: string[]; description?: string }): Promise<PainJournal> {
    const res = await apiClient.post<PainJournal>('/v1/me/cycle/pain', payload);
    return res.data;
  },

  async listPain(limit = 30): Promise<{ entries: PainJournal[] }> {
    const res = await apiClient.get<{ entries: PainJournal[] }>(`/v1/me/cycle/pain?limit=${limit}`);
    return res.data;
  },

  async deletePain(id: string): Promise<void> {
    await apiClient.delete(`/v1/me/cycle/pain/${id}`);
  },

  async logMedication(payload: { date: string; name: string; dose: string; taken_at: string; notes?: string }): Promise<MedicationLog> {
    const res = await apiClient.post<MedicationLog>('/v1/me/cycle/medications', payload);
    return res.data;
  },

  async listMedications(date?: string): Promise<{ medications: MedicationLog[] }> {
    const query = date ? `?date=${date}` : '';
    const res = await apiClient.get<{ medications: MedicationLog[] }>(`/v1/me/cycle/medications${query}`);
    return res.data;
  },

  async deleteMedication(id: string): Promise<void> {
    await apiClient.delete(`/v1/me/cycle/medications/${id}`);
  },

  async logOvulation(payload: { date: string; is_confirmed: boolean; method?: string; notes?: string }): Promise<OvulationLog> {
    const res = await apiClient.post<OvulationLog>('/v1/me/cycle/ovulation', payload);
    return res.data;
  },

  async listOvulation(limit = 12): Promise<{ ovulation_logs: OvulationLog[] }> {
    const res = await apiClient.get<{ ovulation_logs: OvulationLog[] }>(`/v1/me/cycle/ovulation?limit=${limit}`);
    return res.data;
  },
};
