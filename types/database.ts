// Database types. Regenerate after every migration with `npm run db:types` (requires `npx supabase start`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          locale: Database["public"]["Enums"]["app_locale"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          locale?: Database["public"]["Enums"]["app_locale"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          locale?: Database["public"]["Enums"]["app_locale"];
          updated_at?: string;
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
    };
    Enums: {
      app_locale: "ar" | "en";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
