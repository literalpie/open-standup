export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      counter: {
        Row: {
          counter: number | null;
          created_at: string | null;
          id: number;
          updated_at: string;
        };
        Insert: {
          counter?: number | null;
          created_at?: string | null;
          id?: number;
          updated_at?: string;
        };
        Update: {
          counter?: number | null;
          created_at?: string | null;
          id?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          created_at: string | null;
          id: number;
          randomize_order: boolean;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          randomize_order?: boolean;
          title: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          randomize_order?: boolean;
          title?: string;
        };
        Relationships: [];
      };
      updates: {
        Row: {
          duration: number | null;
          id: number;
          meeting_id: number;
          person_name: string;
          started_at: string | null;
          updated_at: string;
        };
        Insert: {
          duration?: number | null;
          id?: number;
          meeting_id: number;
          person_name: string;
          started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          duration?: number | null;
          id?: number;
          meeting_id?: number;
          person_name?: string;
          started_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "updates_meeting_id_fkey";
            columns: ["meeting_id"];
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
