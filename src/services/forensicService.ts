// 🕵️ SERVICIO DE AUDITORÍA FORENSE PARA SUPABASE
// Maneja todas las operaciones de logs forenses

import { supabase, type Database } from '../lib/supabase';
import type { ForensicData } from '../types/forensic';

type ForensicLogInsert = Database['public']['Tables']['forensic_logs']['Insert'];
type ForensicLogRow = Database['public']['Tables']['forensic_logs']['Row'];

export class ForensicService {
  // === GUARDAR DATOS FORENSES EN SUPABASE ===
  static async storeForensicData(forensicData: ForensicData): Promise<string | null> {
    if (!supabase) {
      console.warn('⚠️ [FORENSE] Supabase no está configurado');
      return null;
    }

    try {
      console.log('🕵️ [FORENSE] Guardando datos en Supabase:', {
        accessId: forensicData.accessId,
        linkId: forensicData.linkId,
        clientIP: forensicData.clientIP
      });

      const forensicLog: ForensicLogInsert = {
        access_id: forensicData.accessId,
        link_id: forensicData.linkId,
        audit_id: forensicData.auditId,
        client_ip: forensicData.clientIP as any, // Convertir a tipo inet de Postgres
        proxy_ips: forensicData.proxyIPs || null,
        user_agent: forensicData.userAgent,
        referer: forensicData.referer,
        
        // Información del navegador
        screen_width: forensicData.browserFingerprint.screen.width,
        screen_height: forensicData.browserFingerprint.screen.height,
        color_depth: forensicData.browserFingerprint.screen.colorDepth,
        pixel_ratio: forensicData.browserFingerprint.screen.pixelRatio,
        timezone: forensicData.browserFingerprint.timezone,
        language: forensicData.browserFingerprint.language,
        languages: forensicData.browserFingerprint.languages,
        platform: forensicData.browserFingerprint.platform,
        cookie_enabled: forensicData.browserFingerprint.cookieEnabled,
        do_not_track: forensicData.browserFingerprint.doNotTrack,
        hardware_concurrency: forensicData.browserFingerprint.hardwareConcurrency,
        device_memory: forensicData.browserFingerprint.deviceMemory || null,
        
        // Geolocalización
        latitude: forensicData.geolocation?.latitude || null,
        longitude: forensicData.geolocation?.longitude || null,
        location_accuracy: forensicData.geolocation?.accuracy || null,
        location_timestamp: forensicData.geolocation?.timestamp || null,
        
        // Información de sesión
        session_start: forensicData.sessionStart,
        session_end: forensicData.sessionEnd || null,
        download_time: forensicData.downloadTime || null,
        page_visibility: forensicData.pageVisibility,
        
        // Información de red
        connection_type: forensicData.connectionType || null,
        effective_type: forensicData.effectiveType || null,
        
        // Metadatos
        is_downloaded: forensicData.isDownloaded,
        access_count: forensicData.accessCount,
        focus_events: forensicData.focusEvents || []
      };

      const { data, error } = await supabase
        .from('forensic_logs')
        .insert(forensicLog)
        .select('id')
        .single();

      if (error) {
        console.error('❌ [FORENSE] Error guardando en Supabase:', error);
        return null;
      }

      console.log('✅ [FORENSE] Datos guardados exitosamente:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ [FORENSE] Error inesperado:', error);
      return null;
    }
  }

  // === ACTUALIZAR DATOS DE DESCARGA ===
  static async updateDownloadInfo(
    accessId: string, 
    downloadTime: string, 
    sessionEnd?: string
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('⚠️ [FORENSE] Supabase no está configurado');
      return false;
    }

    try {
      console.log('🕵️ [FORENSE] Actualizando descarga:', {
        accessId,
        downloadTime
      });

      const { error } = await supabase
        .from('forensic_logs')
        .update({
          download_time: downloadTime,
          session_end: sessionEnd || null,
          is_downloaded: true
        })
        .eq('access_id', accessId);

      if (error) {
        console.error('❌ [FORENSE] Error actualizando descarga:', error);
        return false;
      }

      console.log('✅ [FORENSE] Descarga actualizada exitosamente');
      return true;

    } catch (error) {
      console.error('❌ [FORENSE] Error inesperado actualizando:', error);
      return false;
    }
  }

  // === OBTENER LOGS FORENSES POR AUDIT ID ===
  static async getForensicLogsByAuditId(auditId: string): Promise<ForensicLogRow[]> {
    if (!supabase) {
      console.warn('⚠️ [FORENSE] Supabase no está configurado');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('forensic_logs')
        .select('*')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [FORENSE] Error obteniendo logs:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [FORENSE] Error inesperado obteniendo logs:', error);
      return [];
    }
  }

  // === OBTENER LOGS FORENSES POR LINK ID ===
  static async getForensicLogsByLinkId(linkId: string): Promise<ForensicLogRow[]> {
    if (!supabase) {
      console.warn('⚠️ [FORENSE] Supabase no está configurado');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('forensic_logs')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [FORENSE] Error obteniendo logs por link:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [FORENSE] Error inesperado obteniendo logs por link:', error);
      return [];
    }
  }

  // === OBTENER ESTADÍSTICAS FORENSES ===
  static async getForensicStats(auditId: string): Promise<{
    totalAccesses: number;
    uniqueIPs: number;
    totalDownloads: number;
    lastAccess: string | null;
  }> {
    if (!supabase) {
      console.warn('⚠️ [FORENSE] Supabase no está configurado');
      return {
        totalAccesses: 0,
        uniqueIPs: 0,
        totalDownloads: 0,
        lastAccess: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('forensic_logs')
        .select('client_ip, is_downloaded, created_at')
        .eq('audit_id', auditId);

      if (error || !data) {
        console.error('❌ [FORENSE] Error obteniendo estadísticas:', error);
        return {
          totalAccesses: 0,
          uniqueIPs: 0,
          totalDownloads: 0,
          lastAccess: null
        };
      }

      const uniqueIPs = new Set(data.map(log => log.client_ip));
      const downloads = data.filter(log => log.is_downloaded);
      const lastAccess = data.length > 0 ? data[0].created_at : null;

      return {
        totalAccesses: data.length,
        uniqueIPs: uniqueIPs.size,
        totalDownloads: downloads.length,
        lastAccess
      };

    } catch (error) {
      console.error('❌ [FORENSE] Error inesperado obteniendo estadísticas:', error);
      return {
        totalAccesses: 0,
        uniqueIPs: 0,
        totalDownloads: 0,
        lastAccess: null
      };
    }
  }

  // === CONVERTIR ROW DE SUPABASE A FORENSIC DATA ===
  static convertRowToForensicData(row: ForensicLogRow): ForensicData {
    return {
      accessId: row.access_id,
      linkId: row.link_id,
      auditId: row.audit_id,
      clientIP: row.client_ip,
      proxyIPs: row.proxy_ips || undefined,
      userAgent: row.user_agent,
      referer: row.referer,
      
      browserFingerprint: {
        screen: {
          width: row.screen_width || 0,
          height: row.screen_height || 0,
          colorDepth: row.color_depth || 24,
          pixelRatio: row.pixel_ratio || 1
        },
        timezone: row.timezone || 'unknown',
        language: row.language || 'unknown',
        languages: row.languages || ['unknown'],
        platform: row.platform || 'unknown',
        cookieEnabled: row.cookie_enabled || false,
        doNotTrack: row.do_not_track || false,
        hardwareConcurrency: row.hardware_concurrency || 0,
        deviceMemory: row.device_memory || undefined
      },
      
      geolocation: (row.latitude && row.longitude) ? {
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.location_accuracy || 0,
        timestamp: row.location_timestamp || 0
      } : undefined,
      
      sessionStart: row.session_start,
      sessionEnd: row.session_end || undefined,
      downloadTime: row.download_time || undefined,
      pageVisibility: row.page_visibility as any,
      
      connectionType: row.connection_type || undefined,
      effectiveType: row.effective_type || undefined,
      
      createdAt: row.created_at,
      isDownloaded: row.is_downloaded,
      accessCount: row.access_count,
      focusEvents: row.focus_events || []
    };
  }
}
