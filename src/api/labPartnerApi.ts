import { apiClient } from './client';

export type LabLocation = {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  geocoding_status?: 'resolved' | 'pending' | 'unavailable' | 'failed';
  formatted_address?: string;
  phone: string;
  collection_methods: Array<'walk_in' | 'appointment' | 'home_collection'>;
  active: boolean;
};

export type SupportedClinicalTest = {
  id: string;
  name: string;
  abbreviation?: string;
  type: 'laboratory' | 'imaging';
  specimen?: string;
  preparation?: string[];
};

export type LaboratorySearchResult = {
  partner_id: string;
  trading_name: string;
  location: LabLocation;
  offering: LabOffering;
  distance_km: number;
  recommendation: string;
};

export type LabOffering = {
  id: string;
  test_id: string;
  test_name: string;
  lab_test_code?: string;
  specimen: string;
  location_ids: string[];
  price_minor: number;
  currency: 'NGN';
  turnaround_hours: number;
  preparation_instructions?: string[];
  active: boolean;
};

export type LabProfile = {
  id?: string;
  owner_user_id?: string;
  legal_name: string;
  trading_name: string;
  registration_number: string;
  accreditation_number?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website?: string;
  status?: 'pending_review' | 'verified' | 'rejected';
  rejection_reason?: string;
  locations: LabLocation[];
  offerings: LabOffering[];
  terms_accepted: boolean;
  information_confirmed: boolean;
};

export const labPartnerApi = {
  async supportedTests(): Promise<SupportedClinicalTest[]> {
    return (await apiClient.get('/v1/provider/clinical-tests')).data.tests;
  },
  async search(testID: string, latitude: number, longitude: number): Promise<LaboratorySearchResult[]> {
    return (await apiClient.get('/v1/laboratories/search', { params: { test_id: testID, latitude, longitude, radius_km: 50 } })).data.results;
  },
  async mine(): Promise<LabProfile | null> {
    return (await apiClient.get('/v1/partner/lab/profile')).data.profile;
  },
  async save(profile: LabProfile): Promise<LabProfile> {
    return (await apiClient.put('/v1/partner/lab/profile', profile)).data.profile;
  },
  async applications(): Promise<LabProfile[]> {
    return (await apiClient.get('/v1/admin/laboratories')).data.laboratories;
  },
  async review(ownerID: string, decision: 'approve' | 'reject', reason = ''): Promise<LabProfile> {
    return (await apiClient.post(`/v1/admin/laboratories/${ownerID}/${decision}`, { reason })).data.profile;
  },
};
