export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          created_at?: string;
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
          category_id: number;
          price: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          price: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number;
          price?: number;
          image_url?: string | null;
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
