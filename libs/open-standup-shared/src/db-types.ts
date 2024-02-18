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
      meeting_instances: {
        Row: {
          complete: boolean;
          created_at: string | null;
          id: number;
          meeting_id: number;
          updated_at: string;
        };
        Insert: {
          complete?: boolean;
          created_at?: string | null;
          id?: number;
          meeting_id: number;
          updated_at?: string;
        };
        Update: {
          complete?: boolean;
          created_at?: string | null;
          id?: number;
          meeting_id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_instances_meeting_id_fkey";
            columns: ["meeting_id"];
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
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
      people: {
        Row: {
          id: number;
          meeting_id: number;
          name: string;
          order: number | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          meeting_id: number;
          name: string;
          order?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          meeting_id?: number;
          name?: string;
          order?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "people_meeting_id_fkey";
            columns: ["meeting_id"];
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
        ];
      };
      updates: {
        Row: {
          duration: number | null;
          meeting_instance_id: number;
          order: number | null;
          person_id: number;
          started_at: string | null;
          updated_at: string;
        };
        Insert: {
          duration?: number | null;
          meeting_instance_id: number;
          order?: number | null;
          person_id: number;
          started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          duration?: number | null;
          meeting_instance_id?: number;
          order?: number | null;
          person_id?: number;
          started_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "updates_meeting_instance_id_fkey";
            columns: ["meeting_instance_id"];
            referencedRelation: "meeting_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "updates_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
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
