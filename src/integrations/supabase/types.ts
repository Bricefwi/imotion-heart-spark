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
    PostgrestVersion: "14.4"
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
      audit_to_project_links: {
        Row: {
          audit_id: string
          created_at: string
          id: string
          linked_by: string
          note: string | null
          project_id: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          id?: string
          linked_by: string
          note?: string | null
          project_id: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          id?: string
          linked_by?: string
          note?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_to_project_links_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "marketing_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_to_project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          metadata: Json | null
          rule_id: string
          status: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          metadata?: Json | null
          rule_id: string
          status?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          metadata?: Json | null
          rule_id?: string
          status?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json
          trigger_count: number
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json
          trigger_count?: number
          trigger_event: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json
          trigger_count?: number
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
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
      client_reviews: {
        Row: {
          created_at: string
          id: string
          rating: number
          review_text: string
          reviewer_company: string | null
          reviewer_name: string
          reviewer_role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review_text: string
          reviewer_company?: string | null
          reviewer_name?: string
          reviewer_role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review_text?: string
          reviewer_company?: string | null
          reviewer_name?: string
          reviewer_role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string
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
      document_templates: {
        Row: {
          available_variables: Json | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          available_variables?: Json | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          available_variables?: Json | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
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
      email_campaigns: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          segment_filter: Json
          sent_at: string | null
          status: string
          subject: string
          total_clicked: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          segment_filter?: Json
          sent_at?: string | null
          status?: string
          subject: string
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_filter?: Json
          sent_at?: string | null
          status?: string
          subject?: string
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          content_html: string | null
          content_markdown: string
          created_at: string | null
          document_number: string | null
          document_type: string
          estimate_id: string | null
          generated_at: string | null
          id: string
          opened_at: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          project_id: string
          requires_signature: boolean | null
          sent_at: string | null
          sent_to: string[] | null
          signature_ip: string | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          template_code: string | null
          updated_at: string | null
          variables_snapshot: Json | null
        }
        Insert: {
          content_html?: string | null
          content_markdown: string
          created_at?: string | null
          document_number?: string | null
          document_type: string
          estimate_id?: string | null
          generated_at?: string | null
          id?: string
          opened_at?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          project_id: string
          requires_signature?: boolean | null
          sent_at?: string | null
          sent_to?: string[] | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          template_code?: string | null
          updated_at?: string | null
          variables_snapshot?: Json | null
        }
        Update: {
          content_html?: string | null
          content_markdown?: string
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          estimate_id?: string | null
          generated_at?: string | null
          id?: string
          opened_at?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          project_id?: string
          requires_signature?: boolean | null
          sent_at?: string | null
          sent_to?: string[] | null
          signature_ip?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          template_code?: string | null
          updated_at?: string | null
          variables_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "project_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_template_code_fkey"
            columns: ["template_code"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["code"]
          },
        ]
      }
      marketing_audits: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          external_id: string | null
          full_payload: Json
          id: string
          recommendations: Json
          score: number | null
          source: string
          status: string
          summary: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          external_id?: string | null
          full_payload?: Json
          id?: string
          recommendations?: Json
          score?: number | null
          source?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          external_id?: string | null
          full_payload?: Json
          id?: string
          recommendations?: Json
          score?: number | null
          source?: string
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
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
      pricing_config: {
        Row: {
          base_price: number
          code: string
          created_at: string | null
          default_features: Json | null
          description: string | null
          display_order: number | null
          duration_weeks_max: number | null
          duration_weeks_min: number
          icon: string | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_range_max: number | null
          price_range_min: number
          updated_at: string | null
        }
        Insert: {
          base_price: number
          code: string
          created_at?: string | null
          default_features?: Json | null
          description?: string | null
          display_order?: number | null
          duration_weeks_max?: number | null
          duration_weeks_min: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_range_max?: number | null
          price_range_min: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          code?: string
          created_at?: string | null
          default_features?: Json | null
          description?: string | null
          display_order?: number | null
          duration_weeks_max?: number | null
          duration_weeks_min?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_range_max?: number | null
          price_range_min?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_maintenance: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          evolution_hours_included: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_highlighted: boolean | null
          monthly_price: number
          name: string
          recommended_for: string[] | null
          sla_percentage: number
          support_response_hours: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evolution_hours_included?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          monthly_price: number
          name: string
          recommended_for?: string[] | null
          sla_percentage: number
          support_response_hours?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evolution_hours_included?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_highlighted?: boolean | null
          monthly_price?: number
          name?: string
          recommended_for?: string[] | null
          sla_percentage?: number
          support_response_hours?: number | null
        }
        Relationships: []
      }
      pricing_options: {
        Row: {
          applicable_to: string[] | null
          category: string
          code: string
          created_at: string | null
          description: string | null
          duration_impact_days: number | null
          id: string
          is_active: boolean | null
          name: string
          price_amount: number
          price_type: string
          unit_label: string | null
        }
        Insert: {
          applicable_to?: string[] | null
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          duration_impact_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_amount: number
          price_type: string
          unit_label?: string | null
        }
        Update: {
          applicable_to?: string[] | null
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          duration_impact_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_amount?: number
          price_type?: string
          unit_label?: string | null
        }
        Relationships: []
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
      project_estimates: {
        Row: {
          base_price: number
          calculation_inputs: Json | null
          calculation_rules_version: string | null
          complexity_factors: Json | null
          complexity_score: number | null
          created_at: string | null
          discount_percentage: number | null
          discount_reason: string | null
          duration_weeks_max: number | null
          duration_weeks_min: number | null
          final_price: number
          generated_at: string | null
          id: string
          is_current: boolean | null
          options_total: number | null
          project_id: string
          project_type_code: string | null
          recommended_maintenance_code: string | null
          responded_at: string | null
          selected_options: Json | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          valid_until: string | null
          version: number | null
        }
        Insert: {
          base_price: number
          calculation_inputs?: Json | null
          calculation_rules_version?: string | null
          complexity_factors?: Json | null
          complexity_score?: number | null
          created_at?: string | null
          discount_percentage?: number | null
          discount_reason?: string | null
          duration_weeks_max?: number | null
          duration_weeks_min?: number | null
          final_price: number
          generated_at?: string | null
          id?: string
          is_current?: boolean | null
          options_total?: number | null
          project_id: string
          project_type_code?: string | null
          recommended_maintenance_code?: string | null
          responded_at?: string | null
          selected_options?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Update: {
          base_price?: number
          calculation_inputs?: Json | null
          calculation_rules_version?: string | null
          complexity_factors?: Json | null
          complexity_score?: number | null
          created_at?: string | null
          discount_percentage?: number | null
          discount_reason?: string | null
          duration_weeks_max?: number | null
          duration_weeks_min?: number | null
          final_price?: number
          generated_at?: string | null
          id?: string
          is_current?: boolean | null
          options_total?: number | null
          project_id?: string
          project_type_code?: string | null
          recommended_maintenance_code?: string | null
          responded_at?: string | null
          selected_options?: Json | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_estimates_project_type_code_fkey"
            columns: ["project_type_code"]
            isOneToOne: false
            referencedRelation: "pricing_config"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "project_estimates_recommended_maintenance_code_fkey"
            columns: ["recommended_maintenance_code"]
            isOneToOne: false
            referencedRelation: "pricing_maintenance"
            referencedColumns: ["code"]
          },
        ]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          attempt_number: number
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          job_id: string
          response_code: number | null
          response_snippet: string | null
          status: string
          worker_id: string | null
        }
        Insert: {
          attempt_number: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_id: string
          response_code?: number | null
          response_snippet?: string | null
          status: string
          worker_id?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_id?: string
          response_code?: number | null
          response_snippet?: string | null
          status?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "sync_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          dedupe_key: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          next_retry_at: string
          payload: Json
          related_project_id: string | null
          related_user_id: string | null
          status: Database["public"]["Enums"]["sync_job_status"]
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dedupe_key?: string | null
          id?: string
          job_type: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          related_project_id?: string | null
          related_user_id?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          dedupe_key?: string | null
          id?: string
          job_type?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          related_project_id?: string | null
          related_user_id?: string | null
          status?: Database["public"]["Enums"]["sync_job_status"]
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: []
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
      webhook_nonces: {
        Row: {
          consumed_at: string
          expires_at: string
          nonce: string
          source: string
        }
        Insert: {
          consumed_at?: string
          expires_at?: string
          nonce: string
          source: string
        }
        Update: {
          consumed_at?: string
          expires_at?: string
          nonce?: string
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_project_estimate: {
        Args: { p_project_id: string }
        Returns: string
      }
      claim_sync_jobs: {
        Args: {
          _batch_size?: number
          _lease_seconds?: number
          _worker_id: string
        }
        Returns: {
          attempts: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          dedupe_key: string | null
          id: string
          job_type: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          next_retry_at: string
          payload: Json
          related_project_id: string | null
          related_user_id: string | null
          status: Database["public"]["Enums"]["sync_job_status"]
          updated_at: string
          worker_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "sync_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_webhook_nonces: { Args: never; Returns: undefined }
      complete_sync_job: {
        Args: {
          _duration_ms?: number
          _job_id: string
          _response_code?: number
          _response_snippet?: string
          _worker_id?: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_sync_job: {
        Args: {
          _dedupe_key?: string
          _job_type: string
          _max_attempts?: number
          _payload: Json
          _related_project_id?: string
        }
        Returns: string
      }
      fail_sync_job: {
        Args: {
          _duration_ms?: number
          _error_message: string
          _job_id: string
          _response_code?: number
          _response_snippet?: string
          _worker_id?: string
        }
        Returns: Json
      }
      fail_sync_job_classified: {
        Args: {
          _duration_ms?: number
          _error_kind?: string
          _error_message: string
          _job_id: string
          _progress?: Json
          _response_code?: number
          _response_snippet?: string
          _worker_id?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_views: { Args: { post_slug: string }; Returns: undefined }
      link_audit_to_project: {
        Args: { _audit_id: string; _note?: string; _project_id: string }
        Returns: string
      }
      merge_marketing_into_project: {
        Args: { _audit_payload: Json; _project_id: string }
        Returns: Json
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      requeue_sync_job: { Args: { _job_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "client" | "consultant" | "admin" | "super_admin"
      sync_job_status:
        | "pending"
        | "processing"
        | "success"
        | "failed"
        | "dead_letter"
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
      sync_job_status: [
        "pending",
        "processing",
        "success",
        "failed",
        "dead_letter",
      ],
    },
  },
} as const
