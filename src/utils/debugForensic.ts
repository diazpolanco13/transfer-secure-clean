// 🔍 UTILIDAD DE DEBUG PARA DATOS FORENSES
// Archivo temporal para debuggear el problema de persistencia

import { ForensicService } from '../services/forensicService';
import { FileService } from '../services/fileService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { ForensicData } from '../types/forensic';

export class ForensicDebugger {
  static async testForensicCapture(linkId: string) {
    console.log('🔍 ========== INICIANDO DEBUG DE DATOS FORENSES ==========');
    console.log('📝 Link ID:', linkId);
    console.log('🗄️ Supabase configurado:', isSupabaseConfigured());
    
    // Paso 1: Verificar que el link existe
    console.log('\n📌 Paso 1: Verificando que el link existe en la base de datos...');
    const { file, shareLink } = await FileService.getFileByLinkId(linkId);
    
    if (!shareLink) {
      console.error('❌ ERROR: El link no existe en la base de datos');
      console.log('💡 Sugerencia: Usa un link válido de la tabla share_links');
      return false;
    }
    
    console.log('✅ Link encontrado:', {
      link_id: shareLink.link_id,
      audit_id: shareLink.audit_id,
      share_url: shareLink.share_url
    });
    
    if (!file) {
      console.error('❌ ERROR: No se encontró el archivo asociado');
      return false;
    }
    
    console.log('✅ Archivo encontrado:', {
      audit_id: file.audit_id,
      original_name: file.original_name
    });
    
    // Paso 2: Crear datos forenses de prueba
    console.log('\n📌 Paso 2: Creando datos forenses de prueba...');
    const forensicData: ForensicData = {
      accessId: `access-debug-${Date.now()}`,
      linkId: shareLink.link_id,
      auditId: shareLink.audit_id,
      clientIP: '192.168.1.200',
      userAgent: 'Mozilla/5.0 Debug Test',
      referer: 'http://localhost:5173',
      browserFingerprint: {
        screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
        timezone: 'America/Buenos_Aires',
        language: 'es-ES',
        languages: ['es-ES', 'es'],
        platform: 'Win32',
        cookieEnabled: true,
        doNotTrack: false,
        hardwareConcurrency: 8
      },
      sessionStart: new Date().toISOString(),
      pageVisibility: 'visible' as any,
      createdAt: new Date().toISOString(),
      isDownloaded: false,
      accessCount: 1,
      focusEvents: []
    };
    
    console.log('✅ Datos forenses creados:', {
      accessId: forensicData.accessId,
      linkId: forensicData.linkId,
      auditId: forensicData.auditId
    });
    
    // Paso 3: Intentar guardar en Supabase
    console.log('\n📌 Paso 3: Intentando guardar en Supabase...');
    
    try {
      const result = await ForensicService.storeForensicData(forensicData);
      
      if (result) {
        console.log('✅ ÉXITO: Datos guardados con ID:', result);
        
        // Verificar que se guardaron
        console.log('\n📌 Paso 4: Verificando que los datos se guardaron...');
        const logs = await ForensicService.getForensicLogsByLinkId(linkId);
        console.log(`✅ Se encontraron ${logs.length} logs forenses para este link`);
        
        return true;
      } else {
        console.error('❌ ERROR: No se pudo guardar (resultado null)');
        console.log('💡 Posibles causas:');
        console.log('   - Problema con las políticas RLS');
        console.log('   - Error de validación en los datos');
        console.log('   - Problema con las foreign keys');
        return false;
      }
    } catch (error) {
      console.error('❌ ERROR al guardar:', error);
      console.log('💡 Revisa:');
      console.log('   - La consola del navegador para más detalles');
      console.log('   - Los logs de Supabase');
      console.log('   - Las políticas RLS de la tabla forensic_logs');
      return false;
    }
  }
  
  static async checkForensicLogs(linkId: string) {
    console.log('🔍 Verificando logs forenses para link:', linkId);
    
    const logs = await ForensicService.getForensicLogsByLinkId(linkId);
    
    if (logs.length === 0) {
      console.log('⚠️ No hay logs forenses para este link');
    } else {
      console.log(`✅ Se encontraron ${logs.length} logs:`);
      logs.forEach((log, index) => {
        console.log(`\n📝 Log ${index + 1}:`);
        console.log('   - Access ID:', log.access_id);
        console.log('   - IP:', log.client_ip);
        console.log('   - Fecha:', log.created_at);
        console.log('   - Descargado:', log.is_downloaded ? 'Sí' : 'No');
      });
    }
    
    return logs;
  }
}

// Exportar para uso en la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).ForensicDebugger = ForensicDebugger;
  console.log('🔧 ForensicDebugger disponible en window.ForensicDebugger');
  console.log('📝 Uso: await ForensicDebugger.testForensicCapture("link-xxx")');
}
