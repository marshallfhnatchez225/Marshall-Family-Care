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
          id: string;
          full_name: string | null;
          role: "admin" | "staff" | "service_director" | "family" | null;
          loved_one_name: string | null;
          preferred_phone: string | null;
          assigned_director: string | null;
          portal_progress: number | null;
          portal_status: string | null;
          open_requests: number | null;
          last_portal_activity: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "admin" | "staff" | "service_director" | "family" | null;
          loved_one_name?: string | null;
          preferred_phone?: string | null;
          assigned_director?: string | null;
          portal_progress?: number | null;
          portal_status?: string | null;
          open_requests?: number | null;
          last_portal_activity?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: "admin" | "staff" | "service_director" | "family" | null;
          loved_one_name?: string | null;
          preferred_phone?: string | null;
          assigned_director?: string | null;
          portal_progress?: number | null;
          portal_status?: string | null;
          open_requests?: number | null;
          last_portal_activity?: string | null;
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
