// 🗄️ CLIENTE DE SUPABASE PARA TRANSFER SECURE
// Configuración para conectar con la base de datos

import { createClient } from '@supabase/supabase-js';

// Obtener configuración desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar si las variables están configuradas
const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here');

if (!hasSupabaseConfig) {
  console.warn('⚠️ [SUPABASE] Variables de entorno no configuradas. Funcionando en modo sin base de datos.');
  console.warn('📝 [SUPABASE] Para habilitar Supabase, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local');
}

// Crear cliente de Supabase (solo si está configurado)
export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// === TIPOS PARA SUPABASE ===
export interface Database {
  public: {
    Tables: {
      uploaded_files: {
        Row: {
          id: string;
          audit_id: string;
          original_name: string;
          secure_name: string;
          secure_url: string;
          file_size: number;
          file_type: string;
          client_ip: string;
          uploaded_at: string;
          processed_at: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          audit_id: string;
          original_name: string;
          secure_name: string;
          secure_url: string;
          file_size: number;
          file_type: string;
          client_ip: string;
          uploaded_at?: string;
          processed_at?: string;
          user_id?: string | null;
        };
        Update: {
          original_name?: string;
          secure_name?: string;
          secure_url?: string;
          file_size?: number;
          file_type?: string;
          client_ip?: string;
          uploaded_at?: string;
          processed_at?: string;
          user_id?: string | null;
        };
      };
      share_links: {
        Row: {
          id: string;
          link_id: string;
          audit_id: string;
          share_url: string;
          recipient_email: string | null;
          expiration_days: number;
          expires_at: string;
          custom_message: string | null;
          created_at: string;
          is_active: boolean;
          access_count: number;
        };
        Insert: {
          link_id: string;
          audit_id: string;
          share_url: string;
          recipient_email?: string | null;
          expiration_days?: number;
          expires_at: string;
          custom_message?: string | null;
          is_active?: boolean;
          access_count?: number;
        };
        Update: {
          share_url?: string;
          recipient_email?: string | null;
          expiration_days?: number;
          expires_at?: string;
          custom_message?: string | null;
          is_active?: boolean;
          access_count?: number;
        };
      };
      forensic_logs: {
        Row: {
          id: string;
          access_id: string;
          link_id: string;
          audit_id: string;
          client_ip: string;
          proxy_ips: string[] | null;
          user_agent: string;
          referer: string;
          screen_width: number | null;
          screen_height: number | null;
          color_depth: number | null;
          pixel_ratio: number | null;
          timezone: string | null;
          language: string | null;
          languages: string[] | null;
          platform: string | null;
          cookie_enabled: boolean | null;
          do_not_track: boolean | null;
          hardware_concurrency: number | null;
          device_memory: number | null;
          latitude: number | null;
          longitude: number | null;
          location_accuracy: number | null;
          location_timestamp: number | null;
          session_start: string;
          session_end: string | null;
          download_time: string | null;
          page_visibility: string;
          connection_type: string | null;
          effective_type: string | null;
          created_at: string;
          is_downloaded: boolean;
          access_count: number;
          focus_events: any; // JSONB
        };
        Insert: {
          access_id: string;
          link_id: string;
          audit_id: string;
          client_ip: string;
          proxy_ips?: string[] | null;
          user_agent: string;
          referer?: string;
          screen_width?: number | null;
          screen_height?: number | null;
          color_depth?: number | null;
          pixel_ratio?: number | null;
          timezone?: string | null;
          language?: string | null;
          languages?: string[] | null;
          platform?: string | null;
          cookie_enabled?: boolean | null;
          do_not_track?: boolean | null;
          hardware_concurrency?: number | null;
          device_memory?: number | null;
          latitude?: number | null;
          longitude?: number | null;
          location_accuracy?: number | null;
          location_timestamp?: number | null;
          session_start: string;
          session_end?: string | null;
          download_time?: string | null;
          page_visibility?: string;
          connection_type?: string | null;
          effective_type?: string | null;
          is_downloaded?: boolean;
          access_count?: number;
          focus_events?: any;
        };
        Update: {
          session_end?: string | null;
          download_time?: string | null;
          is_downloaded?: boolean;
          access_count?: number;
          focus_events?: any;
        };
      };
    };
  };
}

// === FUNCIONES DE UTILIDAD ===

// Obtener IP REAL del cliente - REQUISITO LEGAL
export const getClientIP = async (): Promise<string> => {
  // SIEMPRE obtener IP real, sin excepciones
  try {
    // Intentar múltiples servicios para garantizar obtención de IP
    const services = [
      { url: 'https://api.ipify.org?format=json', field: 'ip' },
      { url: 'https://ipapi.co/json/', field: 'ip' },
      { url: 'https://api.ip.sb/geoip', field: 'ip' },
      { url: 'https://ipinfo.io/json', field: 'ip' }
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        const ip = data[service.field];
        
        if (ip && ip !== 'unknown') {
          console.log('✅ IP REAL obtenida para cumplimiento legal:', ip);
          return ip;
        }
      } catch (err) {
        console.warn(`Servicio ${service.url} falló, intentando siguiente...`);
      }
    }
    
    // Si todos fallan, esto es crítico para cumplimiento legal
    console.error('❌ ERROR CRÍTICO: No se pudo obtener IP real');
    return 'IP_CAPTURE_FAILED_CHECK_LOGS';
    
  } catch (error) {
    console.error('❌ Error crítico obteniendo IP:', error);
    return 'IP_ERROR_LEGAL_COMPLIANCE_ISSUE';
  }
};

// Verificar si Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return hasSupabaseConfig && supabase !== null;
};

// Log de conexión
if (import.meta.env.DEV) {
  console.log('🗄️ [SUPABASE] Cliente configurado:', {
    url: supabaseUrl,
    configured: isSupabaseConfigured()
  });
}
