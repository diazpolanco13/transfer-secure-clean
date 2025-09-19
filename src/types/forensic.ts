// 🕵️ TIPOS PARA AUDITORÍA FORENSE COMPLETA
// Para uso en investigaciones legales y compliance

export interface ForensicData {
  // === IDENTIFICACIÓN ÚNICA ===
  accessId: string;           // ID único de este acceso
  linkId: string;            // ID del link compartido
  auditId: string;           // ID de auditoría del archivo original
  
  // === INFORMACIÓN DE RED ===
  clientIP: string;          // IP pública (puede ser VPN)
  proxyIPs?: string[];       // IPs de proxies si existen
  userAgent: string;         // User-Agent completo del navegador
  
  // === DETECCIÓN AVANZADA DE IP (NUEVO) ===
  realIP?: string;           // IP real si se detecta leak de WebRTC
  localIP?: string;          // IP local de la red del usuario
  vpnDetected?: boolean;     // Si se detectó uso de VPN
  vpnProvider?: string;      // Proveedor de VPN si se identifica
  canvasFingerprint?: string;// Huella única del dispositivo
  trustScore?: number;       // Score de confianza (0-100)
  
  // === INFORMACIÓN DEL NAVEGADOR ===
  browserFingerprint: {
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };
    timezone: string;
    language: string;
    languages: string[];
    platform: string;
    cookieEnabled: boolean;
    doNotTrack: boolean;
    hardwareConcurrency: number;
    deviceMemory?: number;
  };
  
  // === INFORMACIÓN DE LOCALIZACIÓN ===
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  
  // === INFORMACIÓN DE SESIÓN ===
  referer: string;           // De dónde viene el usuario
  sessionStart: string;      // Cuando abrió el link
  sessionEnd?: string;       // Cuando cerró/salió
  downloadTime?: string;     // Cuando descargó el archivo
  
  // === INFORMACIÓN TÉCNICA ===
  connectionType?: string;   // Tipo de conexión (wifi, cellular, etc.)
  effectiveType?: string;    // Velocidad estimada de conexión
  
  // === METADATOS DE AUDITORÍA ===
  createdAt: string;         // Timestamp de creación del registro
  isDownloaded: boolean;     // Si descargó el archivo
  accessCount: number;       // Número de veces que accedió al link
  
  // === INFORMACIÓN ADICIONAL ===
  pageVisibility: 'visible' | 'hidden' | 'prerender';
  focusEvents: {
    timestamp: string;
    event: 'focus' | 'blur';
  }[];
}

export interface LinkAccessLog {
  linkId: string;
  auditId: string;
  fileName: string;
  createdAt: string;
  expiresAt: string;
  totalAccesses: number;
  uniqueIPs: string[];
  forensicLogs: ForensicData[];
  isActive: boolean;
}

// Para el historial extendido
export interface UploadedFileExtended {
  auditId: string;
  originalName: string;
  secureName: string;
  secureUrl: string;
  fileSize: number;
  fileType: string;
  clientIP: string;
  uploadedAt: string;
  processedAt: string;
  
  // === NUEVA INFORMACIÓN DE ACCESOS ===
  accessLog?: LinkAccessLog;
  shareLinks: {
    id: string;
    url: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
    accessCount: number;
  }[];
}
