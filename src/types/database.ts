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
          role: "student" | "admin";
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "student" | "admin";
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "student" | "admin";
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          subject: string;
          time_limit_minutes: number | null;
          is_public: boolean;
          created_by: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          subject: string;
          time_limit_minutes?: number | null;
          is_public?: boolean;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          subject?: string;
          time_limit_minutes?: number | null;
          is_public?: boolean;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          id: string;
          test_id: string;
          title: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          title: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          title?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sections_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          section_id: string;
          question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
          content: string;
          explanation: string | null;
          points: number;
          sort_order: number;
          accepted_answers: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
          content: string;
          explanation?: string | null;
          points?: number;
          sort_order?: number;
          accepted_answers?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          question_type?: "multiple_choice" | "true_false" | "short_answer" | "essay";
          content?: string;
          explanation?: string | null;
          points?: number;
          sort_order?: number;
          accepted_answers?: string[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      answer_options: {
        Row: {
          id: string;
          question_id: string;
          content: string;
          is_correct: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          content: string;
          is_correct?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          question_id?: string;
          content?: string;
          is_correct?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          test_id: string;
          user_id: string;
          started_at: string;
          submitted_at: string | null;
          score: number | null;
          max_score: number | null;
          status: "in_progress" | "submitted" | "graded";
          question_order: string[] | null;
          option_order: Record<string, string[]> | null;
        };
        Insert: {
          id?: string;
          test_id: string;
          user_id: string;
          started_at?: string;
          submitted_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          status?: "in_progress" | "submitted" | "graded";
          question_order?: string[] | null;
          option_order?: Record<string, string[]> | null;
        };
        Update: {
          id?: string;
          test_id?: string;
          user_id?: string;
          started_at?: string;
          submitted_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          status?: "in_progress" | "submitted" | "graded";
          question_order?: string[] | null;
          option_order?: Record<string, string[]> | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_test_id_fkey";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          answer_text: string | null;
          selected_option_id: string | null;
          is_correct: boolean | null;
          points_awarded: number | null;
          graded_by: string | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          answer_text?: string | null;
          selected_option_id?: string | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          graded_by?: string | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          answer_text?: string | null;
          selected_option_id?: string | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          graded_by?: string | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_selected_option_id_fkey";
            columns: ["selected_option_id"];
            isOneToOne: false;
            referencedRelation: "answer_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_graded_by_fkey";
            columns: ["graded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      question_type: "multiple_choice" | "true_false" | "short_answer" | "essay";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
