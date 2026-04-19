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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          field: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          field?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          field?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          display_count: number
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          display_count?: number
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          display_count?: number
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_user_ids: string[] | null
          send_to_all: boolean
          send_to_solicitantes_only: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_user_ids?: string[] | null
          send_to_all?: boolean
          send_to_solicitantes_only?: boolean
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_user_ids?: string[] | null
          send_to_all?: boolean
          send_to_solicitantes_only?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_columns: {
        Row: {
          color: string | null
          created_at: string
          dot_color: string | null
          icon: string | null
          id: string
          position: number
          status_key: string
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          color?: string | null
          created_at?: string
          dot_color?: string | null
          icon?: string | null
          id?: string
          position?: number
          status_key: string
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          color?: string | null
          created_at?: string
          dot_color?: string | null
          icon?: string | null
          id?: string
          position?: number
          status_key?: string
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          can_access_calendar: boolean | null
          can_access_dashboard: boolean | null
          can_access_integrations: boolean | null
          can_access_metrics: boolean | null
          can_access_reports: boolean | null
          can_attach_files: boolean | null
          can_change_deadline: boolean | null
          can_change_logo: boolean | null
          can_change_settings: boolean | null
          can_change_simple_password: boolean | null
          can_change_theme: boolean | null
          can_comment: boolean | null
          can_complete_task: boolean | null
          can_configure_whatsapp: boolean | null
          can_create_task: boolean | null
          can_deactivate_users: boolean | null
          can_delete_comments: boolean | null
          can_delete_task: boolean | null
          can_disable_login: boolean | null
          can_download_attachments: boolean | null
          can_edit_comments: boolean | null
          can_edit_task: boolean | null
          can_edit_users: boolean | null
          can_enable_login: boolean | null
          can_export_pdf: boolean | null
          can_manage_kanban_columns: boolean | null
          can_manage_users: boolean | null
          can_move_task: boolean | null
          can_print_reports: boolean | null
          can_receive_whatsapp: boolean | null
          can_reset_password: boolean | null
          can_send_whatsapp: boolean | null
          can_start_task: boolean | null
          can_view_activity_log: boolean | null
          can_view_all_data: boolean | null
          can_view_team_only: boolean | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access_calendar?: boolean | null
          can_access_dashboard?: boolean | null
          can_access_integrations?: boolean | null
          can_access_metrics?: boolean | null
          can_access_reports?: boolean | null
          can_attach_files?: boolean | null
          can_change_deadline?: boolean | null
          can_change_logo?: boolean | null
          can_change_settings?: boolean | null
          can_change_simple_password?: boolean | null
          can_change_theme?: boolean | null
          can_comment?: boolean | null
          can_complete_task?: boolean | null
          can_configure_whatsapp?: boolean | null
          can_create_task?: boolean | null
          can_deactivate_users?: boolean | null
          can_delete_comments?: boolean | null
          can_delete_task?: boolean | null
          can_disable_login?: boolean | null
          can_download_attachments?: boolean | null
          can_edit_comments?: boolean | null
          can_edit_task?: boolean | null
          can_edit_users?: boolean | null
          can_enable_login?: boolean | null
          can_export_pdf?: boolean | null
          can_manage_kanban_columns?: boolean | null
          can_manage_users?: boolean | null
          can_move_task?: boolean | null
          can_print_reports?: boolean | null
          can_receive_whatsapp?: boolean | null
          can_reset_password?: boolean | null
          can_send_whatsapp?: boolean | null
          can_start_task?: boolean | null
          can_view_activity_log?: boolean | null
          can_view_all_data?: boolean | null
          can_view_team_only?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access_calendar?: boolean | null
          can_access_dashboard?: boolean | null
          can_access_integrations?: boolean | null
          can_access_metrics?: boolean | null
          can_access_reports?: boolean | null
          can_attach_files?: boolean | null
          can_change_deadline?: boolean | null
          can_change_logo?: boolean | null
          can_change_settings?: boolean | null
          can_change_simple_password?: boolean | null
          can_change_theme?: boolean | null
          can_comment?: boolean | null
          can_complete_task?: boolean | null
          can_configure_whatsapp?: boolean | null
          can_create_task?: boolean | null
          can_deactivate_users?: boolean | null
          can_delete_comments?: boolean | null
          can_delete_task?: boolean | null
          can_disable_login?: boolean | null
          can_download_attachments?: boolean | null
          can_edit_comments?: boolean | null
          can_edit_task?: boolean | null
          can_edit_users?: boolean | null
          can_enable_login?: boolean | null
          can_export_pdf?: boolean | null
          can_manage_kanban_columns?: boolean | null
          can_manage_users?: boolean | null
          can_move_task?: boolean | null
          can_print_reports?: boolean | null
          can_receive_whatsapp?: boolean | null
          can_reset_password?: boolean | null
          can_send_whatsapp?: boolean | null
          can_start_task?: boolean | null
          can_view_activity_log?: boolean | null
          can_view_all_data?: boolean | null
          can_view_team_only?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          login_enabled: boolean
          manager_id: string | null
          phone: string | null
          portal_password: string | null
          portal_slug: string | null
          position: string | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          login_enabled?: boolean
          manager_id?: string | null
          phone?: string | null
          portal_password?: string | null
          portal_slug?: string | null
          position?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          login_enabled?: boolean
          manager_id?: string | null
          phone?: string | null
          portal_password?: string | null
          portal_slug?: string | null
          position?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_defaults: {
        Row: {
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          assignee_user_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          notes: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          requester: string | null
          requester_user_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          assignee_user_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          requester?: string | null
          requester_user_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          assignee_user_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          requester?: string | null
          requester_user_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "colaborador" | "solicitante"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status:
        | "a_fazer"
        | "aguardando_inicio"
        | "em_andamento"
        | "em_revisao"
        | "urgente"
        | "concluido"
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
      app_role: ["admin", "gestor", "colaborador", "solicitante"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: [
        "a_fazer",
        "aguardando_inicio",
        "em_andamento",
        "em_revisao",
        "urgente",
        "concluido",
      ],
    },
  },
} as const
