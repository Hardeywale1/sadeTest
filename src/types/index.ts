declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      [key: string]: string | undefined;
    }
  }
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  role: 'patient' | 'clinician' | 'lab_applicant' | 'lab' | 'admin';
}

export interface Session {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  revoked_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface Profile {
  user_id: string;
  display_name: string;
  timezone: string;
  date_of_birth?: string;
  gender_identity?: string;
  health_conditions?: string[];
  avatar_url?: string;
  professional_title?: string;
  medical_license_number?: string;
  nin?: string;
  bvn?: string;
  license_document_url?: string;
  identity_document_url?: string;
  clinician_verification_status?: string;
  clinician_settings?: ClinicianSettings;
  location?: {
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export type AvailabilityWindow = { day: string; start: string; end: string; enabled: boolean };
export type ClinicianSettings = {
  accepting_patients: boolean;
  slot_duration_minutes: number;
  consultation_fee_minor: number;
  currency: 'NGN';
  availability: AvailabilityWindow[];
  unavailable_dates?: string[];
};

export interface Questionnaire {
  version: string;
  sections: OnboardingSection[];
}

export type OnboardingSection =
  | 'demographics'
  | 'cycle_history'
  | 'pain_profile'
  | 'health_conditions'
  | 'lifestyle'
  | 'goals'
  | 'interests';

export interface OnboardingResponse {
  user_id?: string;
  questionnaire_version: string;
  payload: Record<string, any>;
  status: 'not_started' | 'draft' | 'completed';
  saved_at?: string;
  completed_at?: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  slug: string;
  subcategories: InterestSubcategory[];
}

export interface InterestSubcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  interest_id: string;
  title: string;
  description?: string;
  is_preset: boolean;
  target_value: number;
  current_value: number;
  unit: string;
  streak: number;
  is_completed: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  interest_id: string;
  date: string;
  payload: Record<string, any>;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface LogSummary {
  interest_id: string;
  days: number;
  log_count: number;
  averages: Record<string, any>;
  totals: Record<string, any>;
}

export interface CycleSettings {
  user_id: string;
  avg_cycle_length: number;
  avg_period_length: number;
  last_period_start: string;
  created_at: string;
  updated_at: string;
}

export interface CycleStatus {
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  phase_label: string;
  heading: string;
  subtitle: string;
  cycle_day: number;
  next_period_in_days: number;
  avg_cycle_length: number;
  avg_period_length: number;
  last_period_start: string;
}

export interface FlowDay {
  date: string;
  intensity: 'heavy' | 'medium' | 'light' | 'spotting';
}

export interface PeriodLog {
  id: string;
  user_id: string;
  start_date: string;
  end_date?: string;
  flow_days: FlowDay[];
  summary?: {
    classification: 'normal' | 'irregular' | 'insufficient_history';
    cycle_length_days?: number;
    bleeding_days: number;
    reasons: string[];
    guidance: string;
    generated_at: string;
  };
  created_at: string;
}

export interface SymptomLog {
  id?: string;
  flow?: string;
  pain_level?: number;
  locations?: string[];
  energy?: string;
  user_id: string;
  date: string;
  mood?: string;
  pms?: string[];
  discharge?: string;
  bbt?: number;
  ailments?: string[];
  tags?: string[];
  note?: string;
}

export interface PainJournal {
  id: string;
  user_id: string;
  date: string;
  pain_level: number;
  location: string[];
  description?: string;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  date: string;
  name: string;
  dose: string;
  taken_at: string;
  notes?: string;
}

export interface OvulationLog {
  user_id: string;
  date: string;
  is_confirmed: boolean;
  method?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  body: string;
  mood?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  interest_ids: string[];
  title: string;
  body: string;
  is_anonymous: boolean;
  comment_count: number;
  like_count: number;
  /** True when the signed-in reader has already liked this post. */
  liked_by_me: boolean;
  /** Resolved author display name, or "Anonymous" for anonymous posts. */
  author_name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  author_name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Clan {
  id: string;
  owner_user_id: string;
  name: string;
  description?: string;
  focus?: string;
  interest_ids?: string[];
  is_private: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClanMember {
  clan_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Gossip {
  id: string;
  headline: string;
  story: string;
  members_involved: string[];
  vibe_check: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  clinical_tip?: string;
  tags: string[];
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  timezone: string;
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  frequency_cap_per_day: number;
}
