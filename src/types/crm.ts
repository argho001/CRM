export type Platform = 'google' | 'facebook' | 'linkedin';
export type LeadStatus = 'new' | 'done' | 'demo' | 'working' | 'testing' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'member';
export type ResponseStatus =
  | 'not_contacted'
  | 'no_response'
  | 'replied'
  | 'not_interested'
  | 'interested'
  | 'follow_up'
  | 'proposal_sent'
  | 'converted';

export interface Lead {
  id: string;
  business_name: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  platform: Platform;
  category: string;
  has_website: boolean;
  website_url: string;
  map_url: string;
  followers_count: number;
  rating: number;
  review_count: number;
  last_review_days_ago: number | null;
  score: number;
  status: LeadStatus;
  response_status: ResponseStatus;
  handled_by: string | null;
  handled_at: string | null;
  last_note: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

export interface LeadUpdate {
  id: string;
  lead_id: string;
  updated_by: string;
  old_status: string;
  new_status: string;
  note: string;
  updated_at: string;
}

export interface SearchLog {
  id: string;
  searched_by: string;
  keyword: string;
  location: string;
  platform: string;
  result_count: number;
  searched_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  leads_handled: number;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const RESPONSE_STATUS_CONFIG: Record<ResponseStatus, { label: string; color: string }> = {
  not_contacted: { label: 'Not Contacted Yet', color: 'bg-muted text-muted-foreground' },
  no_response: { label: 'No Response', color: 'bg-warning/20 text-warning' },
  replied: { label: 'Replied', color: 'bg-primary/20 text-primary' },
  not_interested: { label: 'Not Interested', color: 'bg-destructive/20 text-destructive' },
  interested: { label: 'Interested', color: 'bg-success/20 text-success' },
  follow_up: { label: 'Follow Up', color: 'bg-warning/20 text-warning' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-primary/20 text-primary' },
  converted: { label: 'Converted', color: 'bg-success/20 text-success' },
};

export const PLATFORM_CONFIG: Record<Platform, { label: string }> = {
  google: { label: 'Google Maps' },
  facebook: { label: 'Facebook' },
  linkedin: { label: 'LinkedIn' },
};
