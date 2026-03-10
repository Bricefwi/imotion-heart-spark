export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          importance: string | null
          metadata: Json | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          metadata?: Json | null
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_editorial_calendar: {
        Row: {
          angle: string
          category: string
          created_at: string | null
          generated_post_id: string | null
          id: string
          keywords: string[] | null
          planned_date: string
          status: string | null
          title: string
          week_number: number
        }
        Insert: {
          angle: string
          category: string
          created_at?: string | null
          generated_post_id?: string | null
          id?: string
          keywords?: string[] | null
          planned_date: string
          status?: string | null
          title: string
          week_number: number
        }
        Update: {
          angle?: string
          category?: string
          created_at?: string | null
          generated_post_id?: string | null
          id?: string
          keywords?: string[] | null
          planned_date?: string
          status?: string | null
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_editorial_calendar_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_name: string | null
          author_role: string | null
          category: string
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string
          id: string
          is_published: boolean | null
          published_at: string | null
          reading_time: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string | null
          author_role?: string | null
          category: string
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string | null
          author_role?: string | null
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          browser: string | null
          created_at: string | null
          device_type: string | null
          duration: number | null
          ended_at: string | null
          extracted_entities: Json | null
          id: string
          key_insights: Json | null
          phase_end: number | null
          phase_start: number | null
          project_id: string
          session_number: number | null
          started_at: string | null
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: number | null
          ended_at?: string | null
          extracted_entities?: Json | null
          id?: string
          key_insights?: Json | null
          phase_end?: number | null
          phase_start?: number | null
          project_id: string
          session_number?: number | null
          started_at?: string | null
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          duration?: number | null
          ended_at?: string | null
          extracted_entities?: Json | null
          id?: string
          key_insights?: Json | null
          phase_end?: number | null
          phase_start?: number | null
          project_id?: string
          session_number?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          project_id: string
          requires_signature: boolean | null
          signature_data: Json | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          storage_path: string
          storage_url: string | null
          type: string
          updated_at: string | null
          version: number | null
          version_history: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          requires_signature?: boolean | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          storage_path: string
          storage_url?: string | null
          type: string
          updated_at?: string | null
          version?: number | null
          version_history?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          requires_signature?: boolean | null
          signature_data?: Json | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          storage_path?: string
          storage_url?: string | null
          type?: string
          updated_at?: string | null
          version?: number | null
          version_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          confidence_score: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          entities: Json | null
          extracted_data: Json | null
          flagged_reason: string | null
          id: string
          intent: string | null
          is_flagged: boolean | null
          is_read: boolean | null
          model_used: string | null
          perplexity_context: Json | null
          phase: number | null
          project_id: string
          read_at: string | null
          role: string
          sentiment: string | null
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          attachments?: Json | null
          confidence_score?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          entities?: Json | null
          extracted_data?: Json | null
          flagged_reason?: string | null
          id?: string
          intent?: string | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          model_used?: string | null
          perplexity_context?: Json | null
          phase?: number | null
          project_id: string
          read_at?: string | null
          role: string
          sentiment?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          attachments?: Json | null
          confidence_score?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          entities?: Json | null
          extracted_data?: Json | null
          flagged_reason?: string | null
          id?: string
          intent?: string | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          model_used?: string | null
          perplexity_context?: Json | null
          phase?: number | null
          project_id?: string
          read_at?: string | null
          role?: string
          sentiment?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          channels: string[] | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          link_type: string | null
          project_id: string | null
          read_at: string | null
          sent_via: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          channels?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          link_type?: string | null
          project_id?: string | null
          read_at?: string | null
          sent_via?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          channels?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          link_type?: string | null
          project_id?: string | null
          read_at?: string | null
          sent_via?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          company_role: string | null
          company_size: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          industry: string | null
          last_seen_at: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          preferences: Json | null
          referrer: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          company_role?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          industry?: string | null
          last_seen_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferences?: Json | null
          referrer?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          company_role?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          industry?: string | null
          last_seen_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferences?: Json | null
          referrer?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          code: string | null
          completed_at: string | null
          consultant_id: string | null
          contract_amount: number | null
          created_at: string | null
          currency: string | null
          current_phase: number | null
          desired_deadline: string | null
          discovery_data: Json | null
          estimated_budget_max: number | null
          estimated_budget_min: number | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          id: string
          internal_notes: string | null
          last_activity_at: string | null
          name: string
          overall_progress: number | null
          phase_progress: Json | null
          priority: string | null
          proposal_amount: number | null
          qualification_flags: string[] | null
          qualification_score: number | null
          signed_at: string | null
          slug: string | null
          status: string
          tags: string[] | null
          total_conversation_time: number | null
          total_messages: number | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          code?: string | null
          completed_at?: string | null
          consultant_id?: string | null
          contract_amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_phase?: number | null
          desired_deadline?: string | null
          discovery_data?: Json | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string | null
          name: string
          overall_progress?: number | null
          phase_progress?: Json | null
          priority?: string | null
          proposal_amount?: number | null
          qualification_flags?: string[] | null
          qualification_score?: number | null
          signed_at?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          total_conversation_time?: number | null
          total_messages?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          code?: string | null
          completed_at?: string | null
          consultant_id?: string | null
          contract_amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_phase?: number | null
          desired_deadline?: string | null
          discovery_data?: Json | null
          estimated_budget_max?: number | null
          estimated_budget_min?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string | null
          name?: string
          overall_progress?: number | null
          phase_progress?: Json | null
          priority?: string | null
          proposal_amount?: number | null
          qualification_flags?: string[] | null
          qualification_score?: number | null
          signed_at?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          total_conversation_time?: number | null
          total_messages?: number | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          category: string | null
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          slug: string
          tags: string[] | null
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          slug: string
          tags?: string[] | null
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          slug?: string
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_views: { Args: { post_slug: string }; Returns: undefined }
    }
    Enums: {
      app_role: "client" | "consultant" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "consultant", "admin", "super_admin"],
    },
  },
} as const
