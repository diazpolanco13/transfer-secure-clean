// 🧪 FUNCIÓN DE PRUEBA PARA INSERTAR DATOS FORENSES MANUALMENTE

import { ForensicService } from '../services/forensicService';
import type { ForensicData } from '../types/forensic';

export async function testForensicInsert(linkId: string, auditId: string) {
  console.log('🧪 Iniciando prueba de inserción de datos forenses...');
  console.log('Link ID:', linkId);
  console.log('Audit ID:', auditId);
  
  // Crear datos de prueba
  const testData: ForensicData = {
    accessId: `access-test-${Date.now()}`,
    linkId: linkId,
    auditId: auditId,
    clientIP: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Test Insert',
    referer: 'direct',
    
    browserFingerprint: {
      screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
      timezone: 'America/Caracas',
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
  
  console.log('📝 Datos de prueba creados:', testData);
  
  try {
    const result = await ForensicService.storeForensicData(testData);
    
    if (result) {
      console.log('✅ ÉXITO: Datos guardados con ID:', result);
      return true;
    } else {
      console.error('❌ ERROR: No se pudo guardar (resultado null)');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR al guardar:', error);
    return false;
  }
}

// Hacer disponible en consola
if (typeof window !== 'undefined') {
  (window as any).testForensicInsert = testForensicInsert;
  console.log('🧪 testForensicInsert disponible en window');
  console.log('Uso: await testForensicInsert("link-xxx", "audit-xxx")');
}
