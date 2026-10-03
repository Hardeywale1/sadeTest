import { apiClient } from './client';
import { CareCase } from './careApi';

export type ProviderCase = CareCase & {
  patient: { id: string; display_name: string };
};

export type ProviderAction = {
  revision: number;
  action: 'generate_summary' | 'confirm_sample_payment' | 'confirm_suggested_test' | 'dismiss_suggested_test' | 'replace_suggested_test' | 'record_condition_assessment' | 'order_test' | 'collect_sample' | 'upload_result' | 'review_result' | 'schedule_appointment' | 'prescribe_medication' | 'complete_consultation';
  order_id?: string;
  test_name?: string;
  test_id?: string;
  replacement_test_id?: string;
  rationale?: string;
  condition_id?: string;
  assessment_outcome?: 'considering' | 'confirmed' | 'excluded';
  result_summary?: string;
  document_url?: string;
  scheduled_at?: string;
  medicine?: string;
  dose?: string;
  frequency?: string;
  duration_days?: number;
  instructions?: string;
  reminder_times?: string[];
};

export type ClinicalTestSuggestion = {
  test_id: string;
  name: string;
  abbreviation?: string;
  group: 'recommended' | 'conditional';
  priority: string;
  reasons: string[];
  rule_ids: string[];
  review_status: string;
  requires_clinician_confirmation: boolean;
};

export type ClinicalIntelligence = {
  case_id: string;
  clinical_intelligence_available: boolean;
  candidate_conditions: { id: string; name: string; type: string; description: string }[];
  supporting_findings: string[];
  missing_information: string[];
  red_flags: string[];
  recommended_tests: ClinicalTestSuggestion[];
  conditional_tests: ClinicalTestSuggestion[];
  triggered_rules: { rule_id: string; name: string; severity: string; action_types: string[] }[];
  knowledge_review_status: string;
  clinician_review_required: boolean;
};

export const providerApi = {
  async listCases(): Promise<ProviderCase[]> {
    return (await apiClient.get('/v1/provider/care/cases')).data;
  },
  async getCase(id: string): Promise<ProviderCase> {
    return (await apiClient.get(`/v1/provider/care/cases/${id}`)).data;
  },
  async updateCase(id: string, action: ProviderAction): Promise<ProviderCase> {
    const config = action.action === 'generate_summary' ? { timeout: 110000 } : undefined;
    return (await apiClient.patch(`/v1/provider/care/cases/${id}`, action, config)).data;
  },
  async clinicalIntelligence(id: string): Promise<ClinicalIntelligence> {
    return (await apiClient.get(`/v1/provider/care/cases/${id}/clinical-intelligence`)).data;
  },
  async submitKnowledgeFeedback(input: { case_id: string; target_type: 'condition' | 'test' | 'rule' | 'general'; target_id?: string; suggestion: string }): Promise<void> {
    await apiClient.post('/v1/provider/clinical-knowledge/feedback', input);
  },
};
