export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: number;
          name: string;
          slug: string;
          email: string;
          phone: string | null;
          languages: string[];
          default_language: string;
          theme_color: string | null;
          logo_url: string | null;
          theme_config: {
            primary: string;
            secondary: string;
            accent?: string;
            font?: string;
          } | null;
          contact_info: {
            address?: string;
            facebook?: string;
            instagram?: string;
            tiktok?: string;
            email?: string;
            whatsapp?: string;
          } | null;
          verified_network_ip: string | null;
          order_pin_code: string | null;
          order_pin_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          email: string;
          phone?: string | null;
          languages?: string[];
          default_language?: string;
          theme_color?: string | null;
          logo_url?: string | null;
          theme_config?: {
            primary: string;
            secondary: string;
            accent?: string;
            font?: string;
          } | null;
          contact_info?: {
            address?: string;
            facebook?: string;
            instagram?: string;
            tiktok?: string;
            email?: string;
            whatsapp?: string;
          } | null;
          verified_network_ip?: string | null;
          order_pin_code?: string | null;
          order_pin_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          email?: string;
          phone?: string | null;
          languages?: string[];
          theme_color?: string | null;
          logo_url?: string | null;
          theme_config?: {
            primary: string;
            secondary: string;
            accent?: string;
            font?: string;
          } | null;
          contact_info?: {
            address?: string;
            facebook?: string;
            instagram?: string;
            tiktok?: string;
            email?: string;
            whatsapp?: string;
          } | null;
          verified_network_ip?: string | null;
          order_pin_code?: string | null;
          order_pin_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenant_users: {
        Row: {
          id: number;
          tenant_id: number;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          user_id?: string;
          role?: "owner" | "editor" | "viewer";
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: number;
          token: string;
          email: string;
          tenant_id: number;
          invited_by: string;
          role: "owner" | "editor" | "viewer";
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          token: string;
          email: string;
          tenant_id: number;
          invited_by: string;
          role: "owner" | "editor" | "viewer";
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          token?: string;
          email?: string;
          tenant_id?: number;
          invited_by?: string;
          role?: "owner" | "editor" | "viewer";
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          tenant_id: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      category_translations: {
        Row: {
          id: number;
          category_id: number;
          language_code: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          language_code: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number;
          language_code?: string;
          name?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: number;
          tenant_id: number;
          category_id: number;
          price: number;
          image_url: string | null;
          is_published: boolean;
          availability_status:
            | "available"
            | "unavailable"
            | "unavailable_until";
          unavailable_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          category_id: number;
          price: number;
          image_url?: string | null;
          is_published?: boolean;
          availability_status?:
            | "available"
            | "unavailable"
            | "unavailable_until";
          unavailable_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          category_id?: number;
          price?: number;
          image_url?: string | null;
          is_published?: boolean;
          availability_status?:
            | "available"
            | "unavailable"
            | "unavailable_until";
          unavailable_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_translations: {
        Row: {
          id: number;
          product_id: number;
          language_code: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          language_code: string;
          name: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          language_code?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: number;
          key: string;
          name: string;
          price_monthly: number;
          currency: string;
          features: Record<string, any>;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          name: string;
          price_monthly: number;
          currency?: string;
          features?: Record<string, any>;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          name?: string;
          price_monthly?: number;
          currency?: string;
          features?: Record<string, any>;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      addons: {
        Row: {
          id: number;
          key: string;
          name: string;
          price_monthly: number;
          currency: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          name: string;
          price_monthly: number;
          currency?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          name?: string;
          price_monthly?: number;
          currency?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      tenant_addons: {
        Row: {
          id: number;
          tenant_id: number;
          addon_key: string;
          enabled: boolean;
          activated_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          addon_key: string;
          enabled?: boolean;
          activated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          addon_key?: string;
          enabled?: boolean;
          activated_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          tenant_id: number;
          label: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: number;
          label: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: number;
          label?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      order_statuses: {
        Row: {
          id: number;
          tenant_id: number;
          key: string;
          label: string;
          color: string;
          sort_order: number;
          is_terminal: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          key: string;
          label: string;
          color: string;
          sort_order?: number;
          is_terminal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          key?: string;
          label?: string;
          color?: string;
          sort_order?: number;
          is_terminal?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: number;
          tenant_id: number;
          table_id: string;
          status_id: number;
          note: string | null;
          verification_method: "wifi" | "pin" | "none";
          verified_at: string | null;
          total_amount: number;
          customer_name: string | null;
          customer_phone: string | null;
          estimated_ready_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: number;
          table_id: string;
          status_id: number;
          note?: string | null;
          verification_method?: "wifi" | "pin" | "none";
          verified_at?: string | null;
          total_amount: number;
          customer_name?: string | null;
          customer_phone?: string | null;
          estimated_ready_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tenant_id?: number;
          table_id?: string;
          status_id?: number;
          note?: string | null;
          verification_method?: "wifi" | "pin" | "none";
          verified_at?: string | null;
          total_amount?: number;
          customer_name?: string | null;
          customer_phone?: string | null;
          estimated_ready_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
          note: string | null;
          selected_options: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
          note?: string | null;
          selected_options?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          unit_price?: number;
          note?: string | null;
          selected_options?: Record<string, any> | null;
          created_at?: string;
        };
      };
      product_option_groups: {
        Row: {
          id: number;
          product_id: number;
          tenant_id: number;
          name: string;
          selection_type: "single" | "multiple";
          is_required: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          tenant_id: number;
          name: string;
          selection_type?: "single" | "multiple";
          is_required?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          tenant_id?: number;
          name?: string;
          selection_type?: "single" | "multiple";
          is_required?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      product_option_values: {
        Row: {
          id: number;
          group_id: number;
          name: string;
          price_delta: number;
          display_order: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          group_id: number;
          name: string;
          price_delta?: number;
          display_order?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          group_id?: number;
          name?: string;
          price_delta?: number;
          display_order?: number;
          is_default?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
