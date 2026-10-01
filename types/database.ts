// Database types. Regenerate after every migration with `npm run db:types` (requires `npx supabase start`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };
type OptionalTimestamps = { created_at?: string; updated_at?: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          full_name: string | null;
          id: string;
          locale: Database["public"]["Enums"]["app_locale"];
        };
        Insert: OptionalTimestamps & {
          full_name?: string | null;
          id: string;
          locale?: Database["public"]["Enums"]["app_locale"];
        };
        Update: OptionalTimestamps & {
          full_name?: string | null;
          id?: string;
          locale?: Database["public"]["Enums"]["app_locale"];
        };
        Relationships: [];
      };
      organizations: {
        Row: Timestamps & {
          id: string;
          name: string;
          business_type: Database["public"]["Enums"]["business_type"];
          default_locale: Database["public"]["Enums"]["app_locale"];
          timezone: string;
          created_by: string | null;
        };
        Insert: OptionalTimestamps & {
          id?: string;
          name: string;
          business_type: Database["public"]["Enums"]["business_type"];
          default_locale?: Database["public"]["Enums"]["app_locale"];
          timezone?: string;
          created_by?: string | null;
        };
        Update: OptionalTimestamps & {
          id?: string;
          name?: string;
          business_type?: Database["public"]["Enums"]["business_type"];
          default_locale?: Database["public"]["Enums"]["app_locale"];
          timezone?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      organization_members: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["org_role"];
        };
        Insert: OptionalTimestamps & {
          id?: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["org_role"];
        };
        Update: OptionalTimestamps & {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          email: string;
          role: Database["public"]["Enums"]["org_role"];
          token_hash: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          revoked_at: string | null;
        };
        Insert: OptionalTimestamps & {
          id?: string;
          organization_id: string;
          email: string;
          role: Database["public"]["Enums"]["org_role"];
          token_hash: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Update: OptionalTimestamps & {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: Database["public"]["Enums"]["org_role"];
          token_hash?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      locations: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          name: string;
          city: string | null;
          address: string | null;
          archived_at: string | null;
        };
        Insert: OptionalTimestamps & {
          id?: string;
          organization_id: string;
          name: string;
          city?: string | null;
          address?: string | null;
          archived_at?: string | null;
        };
        Update: OptionalTimestamps & {
          id?: string;
          organization_id?: string;
          name?: string;
          city?: string | null;
          address?: string | null;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      surveys: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          name: string;
          status: Database["public"]["Enums"]["survey_status"];
          default_locale: Database["public"]["Enums"]["app_locale"];
          locales: Database["public"]["Enums"]["app_locale"][];
          questions: Json;
          thank_you: Json;
          current_version_id: string | null;
          has_unpublished_changes: boolean;
          created_by: string | null;
        };
        Insert: OptionalTimestamps & {
          id?: string;
          organization_id: string;
          name: string;
          status?: Database["public"]["Enums"]["survey_status"];
          default_locale?: Database["public"]["Enums"]["app_locale"];
          locales?: Database["public"]["Enums"]["app_locale"][];
          questions?: Json;
          thank_you?: Json;
          current_version_id?: string | null;
          has_unpublished_changes?: boolean;
          created_by?: string | null;
        };
        Update: OptionalTimestamps & {
          id?: string;
          organization_id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["survey_status"];
          default_locale?: Database["public"]["Enums"]["app_locale"];
          locales?: Database["public"]["Enums"]["app_locale"][];
          questions?: Json;
          thank_you?: Json;
          current_version_id?: string | null;
          has_unpublished_changes?: boolean;
          created_by?: string | null;
        };
        Relationships: [];
      };
      survey_versions: {
        Row: {
          id: string;
          organization_id: string;
          survey_id: string;
          version: number;
          definition: Json;
          published_by: string | null;
          published_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          survey_id: string;
          version: number;
          definition: Json;
          published_by?: string | null;
          published_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          survey_id?: string;
          version?: number;
          definition?: Json;
          published_by?: string | null;
          published_at?: string;
        };
        Relationships: [];
      };
      survey_links: {
        Row: Timestamps & {
          id: string;
          organization_id: string;
          survey_id: string;
          location_id: string;
          public_code: string;
          is_active: boolean;
        };
        Insert: OptionalTimestamps & {
          id?: string;
          organization_id: string;
          survey_id: string;
          location_id: string;
          public_code: string;
          is_active?: boolean;
        };
        Update: OptionalTimestamps & {
          id?: string;
          organization_id?: string;
          survey_id?: string;
          location_id?: string;
          public_code?: string;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "survey_links_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      survey_responses: {
        Row: {
          id: string;
          organization_id: string;
          survey_id: string;
          survey_version_id: string;
          location_id: string;
          link_id: string | null;
          submission_id: string;
          locale: Database["public"]["Enums"]["app_locale"];
          device_type: string | null;
          csat_score: number | null;
          nps_score: number | null;
          has_comment: boolean;
          submitted_at: string;
          status: Database["public"]["Enums"]["response_status"];
          is_read: boolean;
          is_important: boolean;
          comment_text: string | null;
          rating_sentiment: RatingSentiment | null;
        };
        Insert: never;
        Update: {
          status?: Database["public"]["Enums"]["response_status"];
          is_read?: boolean;
          is_important?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey";
            columns: ["survey_id"];
            isOneToOne: false;
            referencedRelation: "surveys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "survey_responses_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "survey_responses_survey_version_id_fkey";
            columns: ["survey_version_id"];
            isOneToOne: false;
            referencedRelation: "survey_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      survey_answers: {
        Row: {
          id: string;
          organization_id: string;
          response_id: string;
          question_id: string;
          value_number: number | null;
          value_text: string | null;
          value_option_ids: string[] | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      feedback_tags: {
        Row: Timestamps & { id: string; organization_id: string; name: string };
        Insert: { organization_id: string; name: string };
        Update: never;
        Relationships: [];
      };
      response_tags: {
        Row: { organization_id: string; response_id: string; tag_id: string; created_at: string };
        Insert: { organization_id: string; response_id: string; tag_id: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "response_tags_response_id_organization_id_fkey";
            columns: ["response_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "survey_responses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "response_tags_tag_id_organization_id_fkey";
            columns: ["tag_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "feedback_tags";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      create_organization: {
        Args: {
          p_name: string;
          p_business_type: Database["public"]["Enums"]["business_type"];
          p_default_locale: Database["public"]["Enums"]["app_locale"];
          p_location_name: string;
          p_location_city?: string | null;
        };
        Returns: string;
      };
      list_organization_members: {
        Args: { p_organization_id: string };
        Returns: {
          member_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["org_role"];
          full_name: string | null;
          email: string;
          joined_at: string;
        }[];
      };
      change_member_role: {
        Args: { p_member_id: string; p_role: Database["public"]["Enums"]["org_role"] };
        Returns: undefined;
      };
      remove_member: { Args: { p_member_id: string }; Returns: undefined };
      leave_organization: { Args: { p_organization_id: string }; Returns: undefined };
      create_invitation: {
        Args: {
          p_organization_id: string;
          p_email: string;
          p_role: Database["public"]["Enums"]["org_role"];
          p_token_hash: string;
        };
        Returns: string;
      };
      revoke_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      get_invitation: {
        Args: { p_token_hash: string };
        Returns: {
          organization_name: string;
          role: Database["public"]["Enums"]["org_role"];
          email: string;
          status: "pending" | "accepted" | "revoked" | "expired" | "email_mismatch";
        }[];
      };
      accept_invitation: { Args: { p_token_hash: string }; Returns: string };
      publish_survey: { Args: { p_survey_id: string }; Returns: string };
      set_survey_status: {
        Args: { p_survey_id: string; p_status: Database["public"]["Enums"]["survey_status"] };
        Returns: undefined;
      };
      get_public_survey: { Args: { p_code: string }; Returns: Json };
      submit_survey_response: {
        Args: {
          p_code: string;
          p_version_id: string;
          p_submission_id: string;
          p_locale: Database["public"]["Enums"]["app_locale"];
          p_answers: Json;
          p_device_type: string;
        };
        Returns: string;
      };
      add_response_tag: { Args: { p_response_id: string; p_name: string }; Returns: string };
      get_analytics: {
        Args: { p_organization_id: string; p_from: string; p_to: string; p_location_id?: string | null; p_survey_id?: string | null };
        Returns: Json;
      };
      get_question_stats: {
        Args: { p_organization_id: string; p_survey_id: string; p_from: string; p_to: string; p_location_id?: string | null };
        Returns: Json;
      };
    };
    Enums: {
      app_locale: "ar" | "en";
      org_role: "owner" | "admin" | "manager" | "staff" | "viewer";
      survey_status: "draft" | "published" | "paused" | "archived";
      response_status: "new" | "in_progress" | "resolved";
      business_type: "restaurant" | "cafe" | "retail" | "clinic" | "beauty" | "hotel" | "gym" | "entertainment" | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type OrgRole = Database["public"]["Enums"]["org_role"];
export type BusinessType = Database["public"]["Enums"]["business_type"];
export type SurveyStatus = Database["public"]["Enums"]["survey_status"];
export type ResponseStatus = Database["public"]["Enums"]["response_status"];
export type RatingSentiment = "positive" | "neutral" | "negative";
