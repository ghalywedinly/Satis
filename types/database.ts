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
    };
    Enums: {
      app_locale: "ar" | "en";
      org_role: "owner" | "admin" | "manager" | "staff" | "viewer";
      business_type: "restaurant" | "cafe" | "retail" | "clinic" | "beauty" | "hotel" | "gym" | "entertainment" | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type OrgRole = Database["public"]["Enums"]["org_role"];
export type BusinessType = Database["public"]["Enums"]["business_type"];
