export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["category_kind"];
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["category_kind"];
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["category_kind"];
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      design_alternatives: {
        Row: {
          created_at: string;
          design_id: string;
          id: string;
          name: string;
          position: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          design_id: string;
          id?: string;
          name: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          design_id?: string;
          id?: string;
          name?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "design_alternatives_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "design_summaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "design_alternatives_design_id_fkey";
            columns: ["design_id"];
            isOneToOne: false;
            referencedRelation: "designs";
            referencedColumns: ["id"];
          },
        ];
      };
      design_items: {
        Row: {
          alternative_id: string;
          created_at: string;
          flip_x: boolean;
          id: string;
          product_id: string;
          product_image_id: string | null;
          rotation: number;
          width: number;
          x: number;
          y: number;
          z_index: number;
        };
        Insert: {
          alternative_id: string;
          created_at?: string;
          flip_x?: boolean;
          id?: string;
          product_id: string;
          product_image_id?: string | null;
          rotation?: number;
          width: number;
          x: number;
          y: number;
          z_index?: number;
        };
        Update: {
          alternative_id?: string;
          created_at?: string;
          flip_x?: boolean;
          id?: string;
          product_id?: string;
          product_image_id?: string | null;
          rotation?: number;
          width?: number;
          x?: number;
          y?: number;
          z_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "design_items_alternative_id_fkey";
            columns: ["alternative_id"];
            isOneToOne: false;
            referencedRelation: "design_alternatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "design_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "design_items_product_image_id_fkey";
            columns: ["product_image_id"];
            isOneToOne: false;
            referencedRelation: "product_images";
            referencedColumns: ["id"];
          },
        ];
      };
      designs: {
        Row: {
          created_at: string;
          created_by: string | null;
          environment_image_path: string | null;
          id: string;
          image_height: number | null;
          image_width: number | null;
          name: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          environment_image_path?: string | null;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          name: string;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          environment_image_path?: string | null;
          id?: string;
          image_height?: number | null;
          image_width?: number | null;
          name?: string;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "designs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "designs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project_summaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "designs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          external_url: string | null;
          id: string;
          position: number;
          product_id: string;
          storage_path: string | null;
        };
        Insert: {
          created_at?: string;
          external_url?: string | null;
          id?: string;
          position?: number;
          product_id: string;
          storage_path?: string | null;
        };
        Update: {
          created_at?: string;
          external_url?: string | null;
          id?: string;
          position?: number;
          product_id?: string;
          storage_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          article_number: string;
          botanical_name: string | null;
          category_id: string;
          color: string | null;
          created_at: string;
          created_by: string | null;
          depth_cm: number | null;
          description: string | null;
          height_cm: number | null;
          id: string;
          light_requirement: Database["public"]["Enums"]["light_requirement"] | null;
          metadata: NonNullable<Json>;
          name: string;
          price_sek: number | null;
          search_text: string | null;
          size_label: string | null;
          status: Database["public"]["Enums"]["product_status"];
          supplier: string | null;
          updated_at: string;
          width_cm: number | null;
        };
        Insert: {
          article_number: string;
          botanical_name?: string | null;
          category_id: string;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          depth_cm?: number | null;
          description?: string | null;
          height_cm?: number | null;
          id?: string;
          light_requirement?: Database["public"]["Enums"]["light_requirement"] | null;
          metadata?: NonNullable<Json>;
          name: string;
          price_sek?: number | null;
          search_text?: never;
          size_label?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          supplier?: string | null;
          updated_at?: string;
          width_cm?: number | null;
        };
        Update: {
          article_number?: string;
          botanical_name?: string | null;
          category_id?: string;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          depth_cm?: number | null;
          description?: string | null;
          height_cm?: number | null;
          id?: string;
          light_requirement?: Database["public"]["Enums"]["light_requirement"] | null;
          metadata?: NonNullable<Json>;
          name?: string;
          price_sek?: number | null;
          search_text?: never;
          size_label?: string | null;
          status?: Database["public"]["Enums"]["product_status"];
          supplier?: string | null;
          updated_at?: string;
          width_cm?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          customer_name: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          customer_name?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          customer_name?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      visualizations: {
        Row: {
          alternative_id: string;
          completed_at: string | null;
          composite_path: string | null;
          created_at: string;
          created_by: string | null;
          environment_image_path: string;
          error: string | null;
          id: string;
          instructions: string | null;
          model: string | null;
          prompt: string | null;
          provider: string | null;
          result_path: string | null;
          status: Database["public"]["Enums"]["visualization_status"];
        };
        Insert: {
          alternative_id: string;
          completed_at?: string | null;
          composite_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          environment_image_path: string;
          error?: string | null;
          id?: string;
          instructions?: string | null;
          model?: string | null;
          prompt?: string | null;
          provider?: string | null;
          result_path?: string | null;
          status?: Database["public"]["Enums"]["visualization_status"];
        };
        Update: {
          alternative_id?: string;
          completed_at?: string | null;
          composite_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          environment_image_path?: string;
          error?: string | null;
          id?: string;
          instructions?: string | null;
          model?: string | null;
          prompt?: string | null;
          provider?: string | null;
          result_path?: string | null;
          status?: Database["public"]["Enums"]["visualization_status"];
        };
        Relationships: [
          {
            foreignKeyName: "visualizations_alternative_id_fkey";
            columns: ["alternative_id"];
            isOneToOne: false;
            referencedRelation: "design_alternatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visualizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      design_summaries: {
        Row: {
          alternative_count: number | null;
          created_at: string | null;
          environment_image_path: string | null;
          id: string | null;
          name: string | null;
          project_id: string | null;
          updated_at: string | null;
          visualization_count: number | null;
        };
        Insert: {
          alternative_count?: never;
          created_at?: string | null;
          environment_image_path?: string | null;
          id?: string | null;
          name?: string | null;
          project_id?: string | null;
          updated_at?: string | null;
          visualization_count?: never;
        };
        Update: {
          alternative_count?: never;
          created_at?: string | null;
          environment_image_path?: string | null;
          id?: string | null;
          name?: string | null;
          project_id?: string | null;
          updated_at?: string | null;
          visualization_count?: never;
        };
        Relationships: [
          {
            foreignKeyName: "designs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "project_summaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "designs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_summaries: {
        Row: {
          cover_image_path: string | null;
          created_at: string | null;
          customer_name: string | null;
          id: string | null;
          name: string | null;
          room_count: number | null;
          updated_at: string | null;
          visualization_count: number | null;
        };
        Insert: {
          cover_image_path?: never;
          created_at?: string | null;
          customer_name?: string | null;
          id?: string | null;
          name?: string | null;
          room_count?: never;
          updated_at?: string | null;
          visualization_count?: never;
        };
        Update: {
          cover_image_path?: never;
          created_at?: string | null;
          customer_name?: string | null;
          id?: string | null;
          name?: string | null;
          room_count?: never;
          updated_at?: string | null;
          visualization_count?: never;
        };
        Relationships: [];
      };
    };
    Functions: {
      duplicate_alternative: { Args: { p_alternative_id: string; p_name: string }; Returns: string };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      product_facets: {
        Args: Record<PropertyKey, never>;
        Returns: {
          facet: string;
          product_count: number;
          value: string;
        }[];
      };
      save_alternative_items: { Args: { p_alternative_id: string; p_items: Json }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "designer";
      category_kind: "plant" | "pot" | "accessory" | "other";
      light_requirement: "low" | "medium" | "high";
      product_status: "active" | "inactive";
      visualization_status: "pending" | "succeeded" | "failed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "designer"],
      category_kind: ["plant", "pot", "accessory", "other"],
      light_requirement: ["low", "medium", "high"],
      product_status: ["active", "inactive"],
      visualization_status: ["pending", "succeeded", "failed"],
    },
  },
} as const;
