export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          current_status: string | null;
          current_country: string | null;
          target_goal: string | null;
          target_timeline: string | null;
          citizenship: string | null;
          age_band: string | null;
          marital_status: string | null;
          education_level: string | null;
          english_test_status: string | null;
          canadian_experience: string | null;
          foreign_experience: string | null;
          job_offer_support: string | null;
          province_preference: string | null;
          refusal_history_flag: boolean;
          consumer_plan_tier: string;
          consumer_plan_status: string;
          consumer_plan_source: string;
          consumer_plan_activated_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          current_status?: string | null;
          current_country?: string | null;
          target_goal?: string | null;
          target_timeline?: string | null;
          citizenship?: string | null;
          age_band?: string | null;
          marital_status?: string | null;
          education_level?: string | null;
          english_test_status?: string | null;
          canadian_experience?: string | null;
          foreign_experience?: string | null;
          job_offer_support?: string | null;
          province_preference?: string | null;
          refusal_history_flag?: boolean;
          consumer_plan_tier?: string;
          consumer_plan_status?: string;
          consumer_plan_source?: string;
          consumer_plan_activated_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          current_status?: string | null;
          current_country?: string | null;
          target_goal?: string | null;
          target_timeline?: string | null;
          citizenship?: string | null;
          age_band?: string | null;
          marital_status?: string | null;
          education_level?: string | null;
          english_test_status?: string | null;
          canadian_experience?: string | null;
          foreign_experience?: string | null;
          job_offer_support?: string | null;
          province_preference?: string | null;
          refusal_history_flag?: boolean;
          consumer_plan_tier?: string;
          consumer_plan_status?: string;
          consumer_plan_source?: string;
          consumer_plan_activated_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      professional_profiles: {
        Row: {
          user_id: string;
          organization_id: string | null;
          display_name: string | null;
          professional_title: string | null;
          service_regions: string[];
          intake_status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          organization_id?: string | null;
          display_name?: string | null;
          professional_title?: string | null;
          service_regions?: string[];
          intake_status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          organization_id?: string | null;
          display_name?: string | null;
          professional_title?: string | null;
          service_regions?: string[];
          intake_status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      handoff_requests: {
        Row: {
          id: string;
          case_id: string;
          client_user_id: string;
          professional_user_id: string | null;
          organization_id: string | null;
          status: string;
          client_locale: string;
          requested_review_version: number;
          requested_readiness_status: string;
          request_note: string | null;
          opened_at: string | null;
          in_review_at: string | null;
          closed_at: string | null;
          status_updated_at: string | null;
          status_updated_by: string | null;
          internal_notes: string | null;
          export_snapshot: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          client_user_id: string;
          professional_user_id?: string | null;
          organization_id?: string | null;
          status?: string;
          client_locale: string;
          requested_review_version: number;
          requested_readiness_status: string;
          request_note?: string | null;
          opened_at?: string | null;
          in_review_at?: string | null;
          closed_at?: string | null;
          status_updated_at?: string | null;
          status_updated_by?: string | null;
          internal_notes?: string | null;
          export_snapshot?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          client_user_id?: string;
          professional_user_id?: string | null;
          organization_id?: string | null;
          status?: string;
          client_locale?: string;
          requested_review_version?: number;
          requested_readiness_status?: string;
          request_note?: string | null;
          opened_at?: string | null;
          in_review_at?: string | null;
          closed_at?: string | null;
          status_updated_at?: string | null;
          status_updated_by?: string | null;
          internal_notes?: string | null;
          export_snapshot?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          use_case_slug: string;
          title: string;
          status: string;
          intake_answers: Json;
          intake_completed_at: string | null;
          latest_review_version: number | null;
          latest_review_summary: string | null;
          latest_readiness_status: string | null;
          latest_timeline_note: string | null;
          latest_reviewed_at: string | null;
          checklist_state: Json;
          status_history: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          use_case_slug: string;
          title: string;
          status?: string;
          intake_answers?: Json;
          intake_completed_at?: string | null;
          latest_review_version?: number | null;
          latest_review_summary?: string | null;
          latest_readiness_status?: string | null;
          latest_timeline_note?: string | null;
          latest_reviewed_at?: string | null;
          checklist_state?: Json;
          status_history?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          use_case_slug?: string;
          title?: string;
          status?: string;
          intake_answers?: Json;
          intake_completed_at?: string | null;
          latest_review_version?: number | null;
          latest_review_summary?: string | null;
          latest_readiness_status?: string | null;
          latest_timeline_note?: string | null;
          latest_reviewed_at?: string | null;
          checklist_state?: Json;
          status_history?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          document_key: string;
          label: string;
          description: string;
          position: number;
          required: boolean;
          status: string;
          material_reference: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          file_name: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          uploaded_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id?: string;
          document_key: string;
          label: string;
          description: string;
          position?: number;
          required?: boolean;
          status?: string;
          material_reference?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          uploaded_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          document_key?: string;
          label?: string;
          description?: string;
          position?: number;
          required?: boolean;
          status?: string;
          material_reference?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          uploaded_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_review_versions: {
        Row: {
          id: string;
          case_id: string;
          version_number: number;
          readiness_status: string;
          readiness_summary: string;
          result_summary: string;
          timeline_note: string | null;
          checklist_items: Json;
          missing_items: string[];
          risk_flags: Json;
          next_steps: string[];
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          version_number: number;
          readiness_status: string;
          readiness_summary: string;
          result_summary: string;
          timeline_note?: string | null;
          checklist_items?: Json;
          missing_items?: string[];
          risk_flags?: Json;
          next_steps?: string[];
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          version_number?: number;
          readiness_status?: string;
          readiness_summary?: string;
          result_summary?: string;
          timeline_note?: string | null;
          checklist_items?: Json;
          missing_items?: string[];
          risk_flags?: Json;
          next_steps?: string[];
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      case_events: {
        Row: {
          id: string;
          case_id: string;
          user_id: string;
          event_type: string;
          status: string;
          from_status: string | null;
          to_status: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          user_id: string;
          event_type: string;
          status: string;
          from_status?: string | null;
          to_status?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          user_id?: string;
          event_type?: string;
          status?: string;
          from_status?: string | null;
          to_status?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      lead_requests: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          use_case_interest: string;
          current_stage: string;
          wants_demo: boolean;
          wants_early_access: boolean;
          note: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          use_case_interest: string;
          current_stage: string;
          wants_demo?: boolean;
          wants_early_access?: boolean;
          note?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          use_case_interest?: string;
          current_stage?: string;
          wants_demo?: boolean;
          wants_early_access?: boolean;
          note?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      app_events: {
        Row: {
          id: string;
          user_id: string | null;
          case_id: string | null;
          lead_request_id: string | null;
          event_type: string;
          path: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          case_id?: string | null;
          lead_request_id?: string | null;
          event_type: string;
          path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          case_id?: string | null;
          lead_request_id?: string | null;
          event_type?: string;
          path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          user_id: string;
          current_status: string;
          goal: string;
          timeline: string;
          notes: string;
          input_snapshot: Json;
          result_summary: string;
          result_focus_areas: string[];
          result_why_matters: string[];
          result_risks_and_constraints: string[];
          result_missing_information: string[];
          result_next_steps: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_status: string;
          goal: string;
          timeline: string;
          notes: string;
          input_snapshot: Json;
          result_summary: string;
          result_focus_areas: string[];
          result_why_matters?: string[];
          result_risks_and_constraints?: string[];
          result_missing_information?: string[];
          result_next_steps: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_status?: string;
          goal?: string;
          timeline?: string;
          notes?: string;
          input_snapshot?: Json;
          result_summary?: string;
          result_focus_areas?: string[];
          result_why_matters?: string[];
          result_risks_and_constraints?: string[];
          result_missing_information?: string[];
          result_next_steps?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comparisons: {
        Row: {
          id: string;
          user_id: string;
          option_a: string;
          option_b: string;
          priority: string;
          profile_notes: string;
          input_snapshot: Json;
          result_summary: string;
          result_focus_areas: string[];
          result_why_matters: string[];
          result_risks_and_constraints: string[];
          result_missing_information: string[];
          result_next_steps: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          option_a: string;
          option_b: string;
          priority: string;
          profile_notes: string;
          input_snapshot: Json;
          result_summary: string;
          result_focus_areas: string[];
          result_why_matters?: string[];
          result_risks_and_constraints?: string[];
          result_missing_information?: string[];
          result_next_steps: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          option_a?: string;
          option_b?: string;
          priority?: string;
          profile_notes?: string;
          input_snapshot?: Json;
          result_summary?: string;
          result_focus_areas?: string[];
          result_why_matters?: string[];
          result_risks_and_constraints?: string[];
          result_missing_information?: string[];
          result_next_steps?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      copilot_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          status: string;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary?: string | null;
          status?: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          summary?: string | null;
          status?: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      copilot_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: "assistant" | "system" | "user";
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: "assistant" | "system" | "user";
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: "assistant" | "system" | "user";
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Row: infer RowType }
    ? RowType
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends { Row: infer RowType }
      ? RowType
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer InsertType }
    ? InsertType
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends { Insert: infer InsertType }
      ? InsertType
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer UpdateType }
    ? UpdateType
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends { Update: infer UpdateType }
      ? UpdateType
      : never
    : never;
