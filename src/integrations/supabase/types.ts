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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      button_clicks: {
        Row: {
          button_name: string
          clicked_at: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          button_name: string
          clicked_at?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          button_name?: string
          clicked_at?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_details: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      item_main_group: {
        Row: {
          branch_code: string | null
          created_at: string
          id_primary: number
          itm_group_code: string
          itm_group_name: string
          nested_level: number | null
          order_group: number | null
          parent_group_code: string | null
          path: string | null
          saleable: boolean | null
          show_in_website: boolean | null
          updated_at: string
          website_description_ar: string | null
          website_description_en: string | null
          website_name_ar: string | null
          website_name_en: string | null
        }
        Insert: {
          branch_code?: string | null
          created_at?: string
          id_primary?: number
          itm_group_code: string
          itm_group_name: string
          nested_level?: number | null
          order_group?: number | null
          parent_group_code?: string | null
          path?: string | null
          saleable?: boolean | null
          show_in_website?: boolean | null
          updated_at?: string
          website_description_ar?: string | null
          website_description_en?: string | null
          website_name_ar?: string | null
          website_name_en?: string | null
        }
        Update: {
          branch_code?: string | null
          created_at?: string
          id_primary?: number
          itm_group_code?: string
          itm_group_name?: string
          nested_level?: number | null
          order_group?: number | null
          parent_group_code?: string | null
          path?: string | null
          saleable?: boolean | null
          show_in_website?: boolean | null
          updated_at?: string
          website_description_ar?: string | null
          website_description_en?: string | null
          website_name_ar?: string | null
          website_name_en?: string | null
        }
        Relationships: []
      }
      item_master: {
        Row: {
          branch_code: string | null
          created_at: string
          fasting: boolean | null
          healthy_choice: boolean | null
          id: number
          image: string | null
          image_order: number | null
          item_order: number | null
          itm_code: string
          itm_group_code: string | null
          itm_name: string
          photo_url: string | null
          saleable: boolean | null
          sales_price: number | null
          show_in_website: boolean | null
          signature_dish: boolean | null
          spicy: boolean | null
          updated_at: string
          vegetarian: boolean | null
          website_description_ar: string | null
          website_description_en: string | null
          website_name_ar: string | null
          website_name_en: string | null
        }
        Insert: {
          branch_code?: string | null
          created_at?: string
          fasting?: boolean | null
          healthy_choice?: boolean | null
          id?: number
          image?: string | null
          image_order?: number | null
          item_order?: number | null
          itm_code?: string
          itm_group_code?: string | null
          itm_name: string
          photo_url?: string | null
          saleable?: boolean | null
          sales_price?: number | null
          show_in_website?: boolean | null
          signature_dish?: boolean | null
          spicy?: boolean | null
          updated_at?: string
          vegetarian?: boolean | null
          website_description_ar?: string | null
          website_description_en?: string | null
          website_name_ar?: string | null
          website_name_en?: string | null
        }
        Update: {
          branch_code?: string | null
          created_at?: string
          fasting?: boolean | null
          healthy_choice?: boolean | null
          id?: number
          image?: string | null
          image_order?: number | null
          item_order?: number | null
          itm_code?: string
          itm_group_code?: string | null
          itm_name?: string
          photo_url?: string | null
          saleable?: boolean | null
          sales_price?: number | null
          show_in_website?: boolean | null
          signature_dish?: boolean | null
          spicy?: boolean | null
          updated_at?: string
          vegetarian?: boolean | null
          website_description_ar?: string | null
          website_description_en?: string | null
          website_name_ar?: string | null
          website_name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_master_itm_group_code_fkey"
            columns: ["itm_group_code"]
            isOneToOne: false
            referencedRelation: "item_main_group"
            referencedColumns: ["itm_group_code"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          is_open_24_7: boolean | null
          location_order: number | null
          map_link: string
          name: string
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          is_open_24_7?: boolean | null
          location_order?: number | null
          map_link: string
          name: string
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_open_24_7?: boolean | null
          location_order?: number | null
          map_link?: string
          name?: string
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      restaurant_info: {
        Row: {
          branch_code: string | null
          created_at: string
          id: string
          logo_blob: string | null
          logo_url: string | null
          name: string
          show_all_category: boolean | null
          slogan: string | null
          style: string
          theme_id: string | null
          updated_at: string
        }
        Insert: {
          branch_code?: string | null
          created_at?: string
          id?: string
          logo_blob?: string | null
          logo_url?: string | null
          name: string
          show_all_category?: boolean | null
          slogan?: string | null
          style: string
          theme_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_code?: string | null
          created_at?: string
          id?: string
          logo_blob?: string | null
          logo_url?: string | null
          name?: string
          show_all_category?: boolean | null
          slogan?: string | null
          style?: string
          theme_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_info_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "web_themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      social_links: {
        Row: {
          bg_color: string | null
          border_color: string | null
          created_at: string
          id: string
          links_order: number | null
          platform: string
          text_color: string | null
          updated_at: string
          url: string
        }
        Insert: {
          bg_color?: string | null
          border_color?: string | null
          created_at?: string
          id?: string
          links_order?: number | null
          platform: string
          text_color?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          bg_color?: string | null
          border_color?: string | null
          created_at?: string
          id?: string
          links_order?: number | null
          platform?: string
          text_color?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          id: string
          question_en: string
          question_ar: string
          question_type: string
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_en: string
          question_ar: string
          question_type?: string
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_en?: string
          question_ar?: string
          question_type?: string
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          id: string
          question_id: string
          rating: number | null // 1-10 for rating questions, 10=yes/1=no for yes_no
          text_response: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          rating?: number | null // 1-10 for rating questions
          text_response?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          rating?: number | null // 1-10 for rating questions
          text_response?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          session_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          created_at: string
          fasting: string | null
          healthy_choice: string | null
          id: string
          signature_dish: string | null
          spicy: string | null
          updated_at: string
          vegetarian: string | null
        }
        Insert: {
          created_at?: string
          fasting?: string | null
          healthy_choice?: string | null
          id?: string
          signature_dish?: string | null
          spicy?: string | null
          updated_at?: string
          vegetarian?: string | null
        }
        Update: {
          created_at?: string
          fasting?: string | null
          healthy_choice?: string | null
          id?: string
          signature_dish?: string | null
          spicy?: string | null
          updated_at?: string
          vegetarian?: string | null
        }
        Relationships: []
      }
      web_themes: {
        Row: {
          background_color: string
          created_at: string
          is_default: boolean | null
          primary_color: string
          secondary_color: string
          text_color: string
          theme_id: string
          theme_name: string
          updated_at: string
        }
        Insert: {
          background_color: string
          created_at?: string
          is_default?: boolean | null
          primary_color: string
          secondary_color: string
          text_color: string
          theme_id?: string
          theme_name: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          created_at?: string
          is_default?: boolean | null
          primary_color?: string
          secondary_color?: string
          text_color?: string
          theme_id?: string
          theme_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
