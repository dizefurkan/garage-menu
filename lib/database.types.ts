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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addons: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          key: string
          name: string
          price_monthly: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          key: string
          name: string
          price_monthly: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          key?: string
          name?: string
          price_monthly?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      allergen_translations: {
        Row: {
          allergen_id: number
          created_at: string | null
          id: number
          language_code: string
          name: string
        }
        Insert: {
          allergen_id: number
          created_at?: string | null
          id?: number
          language_code: string
          name: string
        }
        Update: {
          allergen_id?: number
          created_at?: string | null
          id?: number
          language_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergen_translations_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
        ]
      }
      allergens: {
        Row: {
          code: string
          created_at: string | null
          display_order: number
          emoji: string
          id: number
        }
        Insert: {
          code: string
          created_at?: string | null
          display_order?: number
          emoji: string
          id?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          display_order?: number
          emoji?: string
          id?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string
          display_order: number | null
          id: number
          image_url: string | null
          is_draft: boolean | null
          published_at: string | null
          tenant_id: number
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_draft?: boolean | null
          published_at?: string | null
          tenant_id: number
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_draft?: boolean | null
          published_at?: string | null
          tenant_id?: number
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      category_interactions: {
        Row: {
          category_id: number
          created_at: string | null
          id: number
          interacted_at: string | null
          interaction_type: string
          session_id: string
          tenant_id: number
        }
        Insert: {
          category_id: number
          created_at?: string | null
          id?: number
          interacted_at?: string | null
          interaction_type: string
          session_id: string
          tenant_id: number
        }
        Update: {
          category_id?: number
          created_at?: string | null
          id?: number
          interacted_at?: string | null
          interaction_type?: string
          session_id?: string
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_interactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      category_translations: {
        Row: {
          category_id: number
          created_at: string | null
          description: string | null
          id: number
          language_code: string
          name: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          category_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          language_code: string
          name: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          language_code?: string
          name?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: number
          invited_by: string
          tenant_id: number
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: number
          invited_by: string
          tenant_id: number
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: number
          invited_by?: string
          tenant_id?: number
          token?: string
        }
        Relationships: []
      }
      migration_log: {
        Row: {
          applied_at: string | null
          id: number
          migration_name: string
          version: number | null
        }
        Insert: {
          applied_at?: string | null
          id?: number
          migration_name: string
          version?: number | null
        }
        Update: {
          applied_at?: string | null
          id?: number
          migration_name?: string
          version?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: number
          note: string | null
          order_id: string
          product_id: number
          quantity: number
          selected_options: Json | null
          tenant_id: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          note?: string | null
          order_id: string
          product_id: number
          quantity?: number
          selected_options?: Json | null
          tenant_id: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: number
          note?: string | null
          order_id?: string
          product_id?: number
          quantity?: number
          selected_options?: Json | null
          tenant_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_matches_order"
            columns: ["order_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: number
          is_default_seed: boolean | null
          is_enabled: boolean
          is_terminal: boolean | null
          key: string
          label: string
          sort_order: number | null
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: number
          is_default_seed?: boolean | null
          is_enabled?: boolean
          is_terminal?: boolean | null
          key: string
          label: string
          sort_order?: number | null
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: number
          is_default_seed?: boolean | null
          is_enabled?: boolean
          is_terminal?: boolean | null
          key?: string
          label?: string
          sort_order?: number | null
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_statuses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_ready_at: string | null
          id: string
          note: string | null
          status_id: number
          table_id: string
          tenant_id: number
          total_amount: number
          updated_at: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_at?: string | null
          id?: string
          note?: string | null
          status_id: number
          table_id: string
          tenant_id: number
          total_amount?: number
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_at?: string | null
          id?: string
          note?: string | null
          status_id?: number
          table_id?: string
          tenant_id?: number
          total_amount?: number
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "order_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          exit_page: string | null
          id: number
          ip_country: string | null
          ip_country_name: string | null
          language: string | null
          os_type: string | null
          page_load_time_ms: number | null
          referrer: string | null
          session_id: string
          tenant_id: number
          timezone: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visited_at: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          exit_page?: string | null
          id?: number
          ip_country?: string | null
          ip_country_name?: string | null
          language?: string | null
          os_type?: string | null
          page_load_time_ms?: number | null
          referrer?: string | null
          session_id: string
          tenant_id: number
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          exit_page?: string | null
          id?: number
          ip_country?: string | null
          ip_country_name?: string | null
          language?: string | null
          os_type?: string | null
          page_load_time_ms?: number | null
          referrer?: string | null
          session_id?: string
          tenant_id?: number
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: number
          is_active: boolean | null
          key: string
          name: string
          price_monthly: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: number
          is_active?: boolean | null
          key: string
          name: string
          price_monthly: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: number
          is_active?: boolean | null
          key?: string
          name?: string
          price_monthly?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_allergens: {
        Row: {
          allergen_id: number
          created_at: string | null
          id: number
          product_id: number
        }
        Insert: {
          allergen_id: number
          created_at?: string | null
          id?: number
          product_id: number
        }
        Update: {
          allergen_id?: number
          created_at?: string | null
          id?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_allergens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_interactions: {
        Row: {
          category_id: number | null
          created_at: string | null
          id: number
          interacted_at: string | null
          interaction_type: string
          product_id: number
          session_id: string
          tenant_id: number
          time_on_product_seconds: number | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          interacted_at?: string | null
          interaction_type: string
          product_id: number
          session_id: string
          tenant_id: number
          time_on_product_seconds?: number | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          id?: number
          interacted_at?: string | null
          interaction_type?: string
          product_id?: number
          session_id?: string
          tenant_id?: number
          time_on_product_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_interactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          is_required: boolean | null
          name: string
          product_id: number
          selection_type: string
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_required?: boolean | null
          name: string
          product_id: number
          selection_type?: string
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_required?: boolean | null
          name?: string
          product_id?: number
          selection_type?: string
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string | null
          display_order: number | null
          group_id: number
          id: number
          is_default: boolean | null
          name: string
          price_delta: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          group_id: number
          id?: number
          is_default?: boolean | null
          name: string
          price_delta?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          group_id?: number
          id?: number
          is_default?: boolean | null
          name?: string
          price_delta?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          language_code: string
          name: string
          product_id: number
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          language_code: string
          name: string
          product_id: number
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          language_code?: string
          name?: string
          product_id?: number
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calories: number | null
          category_id: number
          contains_no_allergens: boolean
          created_at: string | null
          created_by: string
          currency: string | null
          display_order: number | null
          id: number
          image_url: string | null
          is_available: boolean | null
          is_draft: boolean | null
          is_out_of_stock: boolean
          model_glb_url: string | null
          model_usdz_url: string | null
          price: number
          published_at: string | null
          tenant_id: number
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          calories?: number | null
          category_id: number
          contains_no_allergens?: boolean
          created_at?: string | null
          created_by: string
          currency?: string | null
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          is_draft?: boolean | null
          is_out_of_stock?: boolean
          model_glb_url?: string | null
          model_usdz_url?: string | null
          price: number
          published_at?: string | null
          tenant_id: number
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          calories?: number | null
          category_id?: number
          contains_no_allergens?: boolean
          created_at?: string | null
          created_by?: string
          currency?: string | null
          display_order?: number | null
          id?: number
          image_url?: string | null
          is_available?: boolean | null
          is_draft?: boolean | null
          is_out_of_stock?: boolean
          model_glb_url?: string | null
          model_usdz_url?: string | null
          price?: number
          published_at?: string | null
          tenant_id?: number
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string
          notes: string | null
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label: string
          notes?: string | null
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string
          notes?: string | null
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_addons: {
        Row: {
          activated_at: string | null
          addon_key: string
          created_at: string | null
          enabled: boolean | null
          expires_at: string | null
          id: number
          tenant_id: number
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          addon_key: string
          created_at?: string | null
          enabled?: boolean | null
          expires_at?: string | null
          id?: number
          tenant_id: number
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          addon_key?: string
          created_at?: string | null
          enabled?: boolean | null
          expires_at?: string | null
          id?: number
          tenant_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: number
          invited_at: string | null
          role: string
          tenant_id: number
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: number
          invited_at?: string | null
          role?: string
          tenant_id: number
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: number
          invited_at?: string | null
          role?: string
          tenant_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          category_sort: string
          contact_info: Json | null
          created_at: string | null
          default_language: string | null
          description: string | null
          email: string | null
          id: number
          is_active: boolean | null
          languages: string[] | null
          logo_url: string | null
          menu_layout: string
          name: string
          order_pin_code: string | null
          order_pin_date: string | null
          phone: string | null
          plan_id: number | null
          product_sort: string
          qr_ordering_enabled: boolean
          slug: string
          theme_config: Json | null
          updated_at: string | null
          verified_network_ip: string | null
        }
        Insert: {
          category_sort?: string
          contact_info?: Json | null
          created_at?: string | null
          default_language?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          menu_layout?: string
          name: string
          order_pin_code?: string | null
          order_pin_date?: string | null
          phone?: string | null
          plan_id?: number | null
          product_sort?: string
          qr_ordering_enabled?: boolean
          slug: string
          theme_config?: Json | null
          updated_at?: string | null
          verified_network_ip?: string | null
        }
        Update: {
          category_sort?: string
          contact_info?: Json | null
          created_at?: string | null
          default_language?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          languages?: string[] | null
          logo_url?: string | null
          menu_layout?: string
          name?: string
          order_pin_code?: string | null
          order_pin_date?: string | null
          phone?: string | null
          plan_id?: number | null
          product_sort?: string
          qr_ordering_enabled?: boolean
          slug?: string
          theme_config?: Json | null
          updated_at?: string | null
          verified_network_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_category_heatmap: {
        Row: {
          category_id: number | null
          collapse_count: number | null
          expand_count: number | null
          expansion_rate_percent: number | null
          last_interaction_at: string | null
          tenant_id: number | null
          total_interactions: number | null
          unique_viewers: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_interactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_summary: {
        Row: {
          avg_duration_seconds: number | null
          avg_page_load_ms: number | null
          bounce_count: number | null
          bounce_rate_percent: number | null
          max_duration_seconds: number | null
          min_duration_seconds: number | null
          tenant_id: number | null
          total_views: number | null
          unique_sessions: number | null
          view_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_device_breakdown: {
        Row: {
          avg_duration_seconds: number | null
          browser_name: string | null
          device_type: string | null
          os_type: string | null
          percentage_of_total: number | null
          tenant_id: number | null
          unique_sessions: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_geographic_breakdown: {
        Row: {
          avg_duration_seconds: number | null
          ip_country: string | null
          ip_country_name: string | null
          percentage_of_total: number | null
          tenant_id: number | null
          unique_sessions: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_product_heatmap: {
        Row: {
          avg_time_on_product_seconds: number | null
          click_count: number | null
          click_through_rate_percent: number | null
          image_click_count: number | null
          last_interaction_at: string | null
          product_id: number | null
          scroll_count: number | null
          tenant_id: number | null
          total_interactions: number | null
          unique_viewers: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_referrer_breakdown: {
        Row: {
          avg_duration_seconds: number | null
          bounce_rate_percent: number | null
          referrer_source: string | null
          tenant_id: number | null
          unique_sessions: number | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      categories_with_translations: {
        Args: { p_tenant_id: number }
        Returns: {
          created_at: string
          display_order: number
          id: number
          is_draft: boolean
          published_at: string
          tenant_id: number
          translations: Json
          updated_at: string
        }[]
      }
      cleanup_old_analytics: {
        Args: never
        Returns: {
          deleted_category_interactions: number
          deleted_page_views: number
          deleted_product_interactions: number
        }[]
      }
      is_tenant_member: { Args: { t_id: number }; Returns: boolean }
      is_tenant_owner: { Args: { t_id: number }; Returns: boolean }
      products_with_translations: {
        Args: { p_tenant_id: number }
        Returns: {
          category_id: number
          created_at: string
          currency: string
          display_order: number
          id: number
          image_url: string
          is_available: boolean
          is_draft: boolean
          price: number
          published_at: string
          tenant_id: number
          translations: Json
          updated_at: string
        }[]
      }
      publish_category: { Args: { p_category_id: number }; Returns: undefined }
      publish_product: { Args: { p_product_id: number }; Returns: undefined }
      refresh_analytics_views: { Args: never; Returns: undefined }
      user_tenant_id: { Args: never; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
