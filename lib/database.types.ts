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
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
