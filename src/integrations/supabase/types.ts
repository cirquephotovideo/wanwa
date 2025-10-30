export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      product_analyses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          supplier_product_id: string | null
          ean: string | null
          product_name: string | null
          analysis_result: Json | null
          enrichment_status: Json
          image_urls: string[] | null
          exported_to_platforms: Json
          amazon_asin: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          supplier_product_id?: string | null
          ean?: string | null
          product_name?: string | null
          analysis_result?: Json | null
          enrichment_status?: Json
          image_urls?: string[] | null
          exported_to_platforms?: Json
          amazon_asin?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          supplier_product_id?: string | null
          ean?: string | null
          product_name?: string | null
          analysis_result?: Json | null
          enrichment_status?: Json
          image_urls?: string[] | null
          exported_to_platforms?: Json
          amazon_asin?: string | null
        }
      }
      supplier_products: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          supplier_id: string
          ean: string | null
          name: string
          purchase_price: number | null
          raw_data: Json
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          supplier_id: string
          ean?: string | null
          name: string
          purchase_price?: number | null
          raw_data?: Json
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          supplier_id?: string
          ean?: string | null
          name?: string
          purchase_price?: number | null
          raw_data?: Json
          last_synced_at?: string | null
        }
      }
      supplier_configurations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          supplier_name: string
          source_type: 'email' | 'ftp' | 'api' | 'csv'
          connection_config: Json
          column_mapping: Json | null
          is_active: boolean
          last_sync_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          supplier_name: string
          source_type: 'email' | 'ftp' | 'api' | 'csv'
          connection_config: Json
          column_mapping?: Json | null
          is_active?: boolean
          last_sync_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          supplier_name?: string
          source_type?: 'email' | 'ftp' | 'api' | 'csv'
          connection_config?: Json
          column_mapping?: Json | null
          is_active?: boolean
          last_sync_at?: string | null
        }
      }
      import_jobs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          supplier_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          products_created: number
          products_updated: number
          error_logs: Json | null
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          supplier_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          products_created?: number
          products_updated?: number
          error_logs?: Json | null
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          supplier_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          products_created?: number
          products_updated?: number
          error_logs?: Json | null
          started_at?: string | null
          completed_at?: string | null
        }
      }
      enrichment_queue: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          analysis_id: string
          enrichment_type: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          priority: number
          retry_count: number
          max_retries: number
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          analysis_id: string
          enrichment_type: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          priority?: number
          retry_count?: number
          max_retries?: number
          error_message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          analysis_id?: string
          enrichment_type?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          priority?: number
          retry_count?: number
          max_retries?: number
          error_message?: string | null
        }
      }
      amazon_credentials: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          marketplace_id: string
          refresh_token_encrypted: string
          access_token_encrypted: string | null
          token_expires_at: string | null
          secret_expires_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          marketplace_id: string
          refresh_token_encrypted: string
          access_token_encrypted?: string | null
          token_expires_at?: string | null
          secret_expires_at: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          marketplace_id?: string
          refresh_token_encrypted?: string
          access_token_encrypted?: string | null
          token_expires_at?: string | null
          secret_expires_at?: string
          is_active?: boolean
        }
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
  }
}
