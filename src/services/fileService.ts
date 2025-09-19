// 📁 SERVICIO DE ARCHIVOS PARA SUPABASE
// Maneja todas las operaciones de archivos subidos

import { supabase, getClientIP, type Database } from '../lib/supabase';

type UploadedFileInsert = Database['public']['Tables']['uploaded_files']['Insert'];
type UploadedFileRow = Database['public']['Tables']['uploaded_files']['Row'];
type ShareLinkInsert = Database['public']['Tables']['share_links']['Insert'];
type ShareLinkRow = Database['public']['Tables']['share_links']['Row'];

export interface UploadedFileData {
  auditId: string;
  originalName: string;
  secureName: string;
  secureUrl: string;
  fileSize: number;
  fileType: string;
  clientIP: string;
  uploadedAt: string;
  processedAt: string;
}

export class FileService {
  // === GUARDAR ARCHIVO SUBIDO EN SUPABASE ===
  static async storeUploadedFile(fileData: UploadedFileData): Promise<string | null> {
    if (!supabase) {
      console.warn('⚠️ [ARCHIVOS] Supabase no está configurado');
      return null;
    }

    try {
      console.log('📁 [ARCHIVOS] Guardando archivo en Supabase:', {
        auditId: fileData.auditId,
        fileName: fileData.originalName,
        fileSize: fileData.fileSize
      });

      const uploadedFile: UploadedFileInsert = {
        audit_id: fileData.auditId,
        original_name: fileData.originalName,
        secure_name: fileData.secureName,
        secure_url: fileData.secureUrl,
        file_size: fileData.fileSize,
        file_type: fileData.fileType,
        client_ip: fileData.clientIP,
        uploaded_at: fileData.uploadedAt,
        processed_at: fileData.processedAt
        // user_id se puede agregar cuando implementemos autenticación
      };

      const { data, error } = await supabase
        .from('uploaded_files')
        .insert(uploadedFile)
        .select('id')
        .single();

      if (error) {
        console.error('❌ [ARCHIVOS] Error guardando en Supabase:', error);
        return null;
      }

      console.log('✅ [ARCHIVOS] Archivo guardado exitosamente:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ [ARCHIVOS] Error inesperado:', error);
      return null;
    }
  }

  // === CREAR ENLACE DE COMPARTIR ===
  static async createShareLink(
    auditId: string,
    recipientEmail?: string,
    expirationDays: number = 7,
    customMessage?: string
  ): Promise<ShareLinkRow | null> {
    if (!supabase) {
      console.warn('⚠️ [ENLACES] Supabase no está configurado');
      return null;
    }

    try {
      const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const shareUrl = `${window.location.origin}/receive/${linkId}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      console.log('🔗 [ENLACES] Creando enlace de compartir:', {
        linkId,
        auditId,
        expirationDays
      });

      const shareLink: ShareLinkInsert = {
        link_id: linkId,
        audit_id: auditId,
        share_url: shareUrl,
        recipient_email: recipientEmail || null,
        expiration_days: expirationDays,
        expires_at: expiresAt.toISOString(),
        custom_message: customMessage || null
      };

      const { data, error } = await supabase
        .from('share_links')
        .insert(shareLink)
        .select('*')
        .single();

      if (error) {
        console.error('❌ [ENLACES] Error creando enlace:', error);
        return null;
      }

      console.log('✅ [ENLACES] Enlace creado exitosamente:', data.link_id);
      return data;

    } catch (error) {
      console.error('❌ [ENLACES] Error inesperado:', error);
      return null;
    }
  }

  // === OBTENER ARCHIVOS SUBIDOS ===
  static async getUploadedFiles(): Promise<UploadedFileRow[]> {
    if (!supabase) {
      console.warn('⚠️ [ARCHIVOS] Supabase no está configurado');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ARCHIVOS] Error obteniendo archivos:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [ARCHIVOS] Error inesperado obteniendo archivos:', error);
      return [];
    }
  }

  // === OBTENER DATOS DE ARCHIVO POR LINK ID ===
  static async getFileByLinkId(linkId: string): Promise<{
    file: UploadedFileRow | null;
    shareLink: ShareLinkRow | null;
  }> {
    if (!supabase) {
      console.warn('⚠️ [ARCHIVOS] Supabase no está configurado');
      return { file: null, shareLink: null };
    }

    try {
      // Primero obtener el share_link
      const { data: shareLink, error: linkError } = await supabase
        .from('share_links')
        .select('*')
        .eq('link_id', linkId)
        .single();

      if (linkError || !shareLink) {
        console.error('❌ [ARCHIVOS] Enlace no encontrado:', linkError);
        return { file: null, shareLink: null };
      }

      // Luego obtener el archivo usando audit_id
      const { data: file, error: fileError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('audit_id', shareLink.audit_id)
        .single();

      if (fileError || !file) {
        console.error('❌ [ARCHIVOS] Archivo no encontrado:', fileError);
        return { file: null, shareLink };
      }

      return { file, shareLink };

    } catch (error) {
      console.error('❌ [ARCHIVOS] Error inesperado obteniendo archivo por link:', error);
      return { file: null, shareLink: null };
    }
  }

  // === CONVERTIR ROW DE SUPABASE A FORMATO LOCAL ===
  static convertRowToUploadedFile(row: UploadedFileRow): UploadedFileData & { id: string } {
    return {
      id: row.id,
      auditId: row.audit_id,
      originalName: row.original_name,
      secureName: row.secure_name,
      secureUrl: row.secure_url,
      fileSize: row.file_size,
      fileType: row.file_type,
      clientIP: row.client_ip,
      uploadedAt: row.uploaded_at,
      processedAt: row.processed_at
    };
  }
}
