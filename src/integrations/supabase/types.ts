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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number
          monthly_amount: number
          updated_at: string
          yearly_amount: number
        }
        Insert: {
          id?: number
          monthly_amount?: number
          updated_at?: string
          yearly_amount?: number
        }
        Update: {
          id?: number
          monthly_amount?: number
          updated_at?: string
          yearly_amount?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          joined_on: string | null
          member_code: string
          must_change_password: boolean
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          joined_on?: string | null
          member_code: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          joined_on?: string | null
          member_code?: string
          must_change_password?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      money_returned: {
        Row: {
          amount_returned: number
          created_at: string
          id: string
          member_id: string
          money_taken_id: string
          notes: string | null
          payment_date: string
          recorded_by: string | null
          return_code: string
        }
        Insert: {
          amount_returned: number
          created_at?: string
          id?: string
          member_id: string
          money_taken_id: string
          notes?: string | null
          payment_date: string
          recorded_by?: string | null
          return_code: string
        }
        Update: {
          amount_returned?: number
          created_at?: string
          id?: string
          member_id?: string
          money_taken_id?: string
          notes?: string | null
          payment_date?: string
          recorded_by?: string | null
          return_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_returned_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_returned_money_taken_id_fkey"
            columns: ["money_taken_id"]
            isOneToOne: false
            referencedRelation: "money_taken"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_returned_money_taken_id_fkey"
            columns: ["money_taken_id"]
            isOneToOne: false
            referencedRelation: "money_taken_status"
            referencedColumns: ["id"]
          },
        ]
      }
      money_taken: {
        Row: {
          amount_taken: number
          created_at: string
          extra_amount: number
          id: string
          member_id: string
          notes: string | null
          recorded_by: string | null
          taken_date: string
          total_to_return: number | null
          transaction_code: string
        }
        Insert: {
          amount_taken: number
          created_at?: string
          extra_amount?: number
          id?: string
          member_id: string
          notes?: string | null
          recorded_by?: string | null
          taken_date: string
          total_to_return?: number | null
          transaction_code: string
        }
        Update: {
          amount_taken?: number
          created_at?: string
          extra_amount?: number
          id?: string
          member_id?: string
          notes?: string | null
          recorded_by?: string | null
          taken_date?: string
          total_to_return?: number | null
          transaction_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_taken_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_obligations: {
        Row: {
          amount_due: number
          created_at: string
          id: string
          member_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          period_month: number | null
          period_year: number
        }
        Insert: {
          amount_due: number
          created_at?: string
          id?: string
          member_id: string
          payment_type: Database["public"]["Enums"]["payment_type"]
          period_month?: number | null
          period_year: number
        }
        Update: {
          amount_due?: number
          created_at?: string
          id?: string
          member_id?: string
          payment_type?: Database["public"]["Enums"]["payment_type"]
          period_month?: number | null
          period_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_obligations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_receipts: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          notes: string | null
          obligation_id: string
          payment_date: string
          receipt_code: string
          recorded_by: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          notes?: string | null
          obligation_id: string
          payment_date: string
          receipt_code: string
          recorded_by?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          obligation_id?: string
          payment_date?: string
          receipt_code?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_receipts_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligation_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_receipts_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "subscription_obligations"
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
      yearly_totals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          total_amount: number
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          total_amount: number
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      money_taken_status: {
        Row: {
          amount_returned: number | null
          amount_taken: number | null
          created_at: string | null
          extra_amount: number | null
          full_name: string | null
          id: string | null
          member_code: string | null
          member_id: string | null
          notes: string | null
          remaining: number | null
          status: string | null
          taken_date: string | null
          total_to_return: number | null
          transaction_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "money_taken_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_status: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          full_name: string | null
          id: string | null
          last_payment_date: string | null
          member_code: string | null
          member_id: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          period_month: number | null
          period_year: number | null
          remaining: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_obligations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_member_id: { Args: never; Returns: string }
      generate_obligations: {
        Args: {
          _month?: number
          _type: Database["public"]["Enums"]["payment_type"]
          _year: number
        }
        Returns: number
      }
      generate_obligations_for: {
        Args: {
          _member_ids: string[]
          _month?: number
          _type: Database["public"]["Enums"]["payment_type"]
          _year: number
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_admin: { Args: never; Returns: boolean }
      next_code: {
        Args: { _col: string; _prefix: string; _table: string; _year: number }
        Returns: string
      }
      next_member_code: { Args: never; Returns: string }
      record_money_returned: {
        Args: {
          _amount: number
          _date: string
          _money_taken_id: string
          _notes: string
        }
        Returns: string
      }
      record_money_taken: {
        Args: {
          _amount: number
          _date: string
          _extra: number
          _member_id: string
          _notes: string
        }
        Returns: string
      }
      record_subscription_payment: {
        Args: {
          _amount: number
          _date: string
          _notes: string
          _obligation_id: string
        }
        Returns: string
      }
      update_obligation_amount: {
        Args: { _amount: number; _obligation_id: string }
        Returns: undefined
      }
      update_obligation_period: {
        Args: { _month?: number; _obligation_id: string; _year: number }
        Returns: undefined
      }
      update_settings: {
        Args: { _monthly: number; _yearly: number }
        Returns: undefined
      }
      write_audit: {
        Args: {
          _action: string
          _details: Json
          _entity: string
          _entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
      member_status: "active" | "inactive"
      payment_type: "monthly" | "yearly"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "member"],
      member_status: ["active", "inactive"],
      payment_type: ["monthly", "yearly"],
    },
  },
} as const
