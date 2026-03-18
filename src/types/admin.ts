import type { Json } from "@/integrations/supabase/types";

/** Profile row from Supabase with optional address fields */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  company_role: string | null;
  company_size: string | null;
  industry: string | null;
  phone: string | null;
  website: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  preferences: Json | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
}

/** Project row with optional joined client */
export interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  priority: string | null;
  client_id: string;
  consultant_id: string | null;
  discovery_data: Json | null;
  estimated_budget_min: number | null;
  estimated_budget_max: number | null;
  current_phase: string | null;
  created_at: string;
  updated_at: string | null;
  client?: Profile | null;
  contract_amount?: number | null;
  proposal_amount?: number | null;
  total_messages?: number | null;
  last_activity_at?: string | null;
  overall_progress?: number | null;
  internal_notes?: string | null;
  tags?: string[] | null;
}

/** Activity row with optional joined profile */
export interface Activity {
  id: string;
  action: string;
  description: string | null;
  importance: string | null;
  metadata: Json | null;
  project_id: string | null;
  user_id: string | null;
  created_at: string | null;
  profile?: Profile | null;
}

/** Generated document row with optional joined project */
export interface GeneratedDocument {
  id: string;
  project_id: string;
  document_type: string;
  content: string | null;
  status: string;
  version: number | null;
  document_number: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  project?: Pick<Project, "id" | "name" | "code"> | null;
  name?: string | null;
  type?: string | null;
}

/** Automation rule */
export interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, string | number | boolean>;
  action_type: string;
  action_config: Record<string, string | number | boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

/** Automation log */
export interface AutomationLog {
  id: string;
  rule_id: string;
  status: string;
  target_email: string | null;
  target_user_id: string | null;
  error_message: string | null;
  metadata: Json | null;
  executed_at: string;
}

/** Campaign */
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string | null;
  sent_count: number | null;
  open_count: number | null;
  click_count: number | null;
  created_at: string;
  updated_at: string | null;
}

/** Supabase error type for mutation callbacks */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}
