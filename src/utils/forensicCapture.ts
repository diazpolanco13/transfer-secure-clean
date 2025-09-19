// 🕵️ SISTEMA DE CAPTURA FORENSE COMPLETA
// Para auditoría legal y investigaciones

import type { ForensicData } from '../types/forensic';
import { ForensicService } from '../services/forensicService';
import { isSupabaseConfigured } from '../lib/supabase';
import { AdvancedIPDetection } from './advancedIPDetection';

export class ForensicCapture {
  private accessId: string;
  private linkId: string;
  private auditId: string;
  private sessionStart: string;
  private focusEvents: { timestamp: string; event: 'focus' | 'blur' }[] = [];

  constructor(linkId: string, auditId: string) {
    this.accessId = this.generateAccessId();
    this.linkId = linkId;
    this.auditId = auditId;
    this.sessionStart = new Date().toISOString();
    
    // Iniciar captura de eventos
    this.setupEventListeners();
  }

  private generateAccessId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `access-${timestamp}-${random}`;
  }

  private setupEventListeners(): void {
    // Capturar eventos de foco/desenfoque
    window.addEventListener('focus', () => {
      this.focusEvents.push({
        timestamp: new Date().toISOString(),
        event: 'focus'
      });
    });

    window.addEventListener('blur', () => {
      this.focusEvents.push({
        timestamp: new Date().toISOString(),
        event: 'blur'
      });
    });

    // Capturar cuando el usuario sale de la página
    window.addEventListener('beforeunload', () => {
      this.recordSessionEnd();
    });

    // Capturar cambios de visibilidad
    document.addEventListener('visibilitychange', () => {
      const event = document.hidden ? 'blur' : 'focus';
      this.focusEvents.push({
        timestamp: new Date().toISOString(),
        event
      });
    });
  }

  // === CAPTURA DE INFORMACIÓN DEL NAVEGADOR ===
  private async getBrowserFingerprint(): Promise<ForensicData['browserFingerprint']> {
    const nav = navigator as any;
    
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: Array.from(navigator.languages || [navigator.language]),
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory || undefined
    };
  }

  // === CAPTURA DE GEOLOCALIZACIÓN AUTOMÁTICA ===
  private async getGeolocation(): Promise<ForensicData['geolocation'] | undefined> {
    console.log('🗺️ [GEOLOCATION] Iniciando captura de ubicación...');

    // Verificar si geolocalización está disponible
    if (!navigator.geolocation) {
      console.log('⚠️ [GEOLOCATION] Geolocalización no soportada por este navegador');
      console.log('🔄 [GEOLOCATION] Usando IP como fallback');
      return this.getGeolocationByIP();
    }

    console.log('✅ [GEOLOCATION] API de geolocalización disponible');

    // Verificar estado actual del permiso
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      console.log('🔐 [GEOLOCATION] Estado del permiso:', permissionStatus.state);

      // Si ya está concedido, obtener ubicación inmediatamente
      if (permissionStatus.state === 'granted') {
        console.log('✅ [GEOLOCATION] Permiso concedido, obteniendo ubicación GPS...');
        return this.requestGPSLocation();
      }

      // Si está denegado, intentar automáticamente (usuario podría cambiar de opinión)
      if (permissionStatus.state === 'denied') {
        console.log('❌ [GEOLOCATION] Permiso denegado, intentando reintento automático...');
        // Intentar una vez más en caso de que el usuario haya cambiado de opinión
        const retryResult = await this.requestGPSLocationWithRetry();
        if (retryResult) return retryResult;

        console.log('❌ [GEOLOCATION] Reintento falló, usando IP como fallback');
        return this.getGeolocationByIP();
      }

      // Si está en prompt (primera vez), solicitar automáticamente con reintento
      console.log('🔄 [GEOLOCATION] Primera vez - solicitando permiso automáticamente...');
      return this.requestGPSLocationWithRetry();

    } catch (error) {
      // Fallback para navegadores que no soportan permissions API
      console.log('🔄 [GEOLOCATION] Navegador sin permissions API, solicitando GPS directamente...');
      console.log('⚠️ [GEOLOCATION] Error en permissions API:', error);
      return this.requestGPSLocation();
    }
  }

  // Solicitar ubicación GPS con configuración optimizada
  private async requestGPSLocation(): Promise<ForensicData['geolocation'] | undefined> {
    console.log('📡 [GPS] Solicitando ubicación GPS al navegador...');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ [GPS] Geolocalización GPS obtenida exitosamente');
          console.log('📍 [GPS] Coordenadas:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          });
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          const errorMessages: Record<number, string> = {
            1: 'Usuario denegó el permiso de ubicación',
            2: 'Posición no disponible',
            3: 'Tiempo de espera agotado'
          };
          const errorMessage = errorMessages[error.code] || error.message || 'Error desconocido';
          console.log(`⚠️ [GPS] Error ${error.code}: ${errorMessage}`);
          console.log('🔄 [GPS] Continuando con geolocalización por IP...');
          resolve(undefined);
        },
        {
          timeout: 10000, // 10 segundos (más tiempo para mejor precisión)
          enableHighAccuracy: true, // Solicitar máxima precisión
          maximumAge: 300000 // Cache de 5 minutos
        }
      );
    });
  }

  // Solicitar GPS con reintento automático
  private async requestGPSLocationWithRetry(): Promise<ForensicData['geolocation'] | undefined> {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Intento ${attempts}/${maxAttempts} de obtener GPS...`);

      const location = await this.requestGPSLocation();
      if (location) {
        return location;
      }

      // Esperar un poco antes del siguiente intento
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('⚠️ Todos los intentos de GPS fallaron, usando IP como fallback');
    return this.getGeolocationByIP();
  }

  // Geolocalización por IP como fallback
  private async getGeolocationByIP(): Promise<ForensicData['geolocation'] | undefined> {
    try {
      console.log('🌐 [IP-GEOLOCATION] Iniciando geolocalización por IP...');
      console.log('📡 [IP-GEOLOCATION] Intentando múltiples servicios de geolocalización...');

      // Intentar múltiples servicios para mejor fiabilidad
      const services = [
        'https://ipapi.co/json/',
        'https://ipinfo.io/json',
        'https://api.ipgeolocation.io/ipgeo'
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; TransferSecure/1.0)'
            }
          });

          if (!response.ok) continue;

          const data = await response.json();

          if (data.latitude && data.longitude) {
            console.log(`✅ Geolocalización por IP obtenida desde ${serviceUrl}`);
            return {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              accuracy: 5000, // IP geolocation ~5km precisión
              timestamp: Date.now()
            };
          }
        } catch (error) {
          console.log(`⚠️ Servicio ${serviceUrl} falló, intentando siguiente...`);
          continue;
        }
      }

      console.log('❌ Todos los servicios de geolocalización por IP fallaron');
      return undefined;

    } catch (error) {
      console.error('❌ Error en geolocalización por IP:', error);
      return undefined;
    }
  }

  // === CAPTURA DE INFORMACIÓN DE RED ===
  private getNetworkInfo(): { connectionType?: string; effectiveType?: string } {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (!connection) return {};
    
    return {
      connectionType: connection.type,
      effectiveType: connection.effectiveType
    };
  }

  // === OBTENER IP REAL DEL CLIENTE ===
  private async getClientIP(): Promise<{ clientIP: string; proxyIPs?: string[] }> {
    try {
      // SIEMPRE obtener IP real para cumplimiento legal
      // Intentar múltiples servicios de IP para redundancia
      
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://api.ip.sb/geoip',
        'https://ipinfo.io/json'
      ];

      let ipData: any = null;
      
      // Intentar con cada servicio hasta obtener respuesta
      for (const service of ipServices) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          // Extraer IP según el formato de cada servicio
          const ip = data.ip || data.query || data.ipAddress;
          if (ip) {
            ipData = {
              clientIP: ip,
              proxyIPs: data.proxy ? [data.proxy] : undefined,
              country: data.country || data.country_name,
              city: data.city,
              isp: data.isp || data.org,
              timezone: data.timezone
            };
            break;
          }
        } catch (err) {
          console.warn(`Servicio ${service} falló, intentando siguiente...`);
        }
      }

      if (!ipData) {
        // Fallback: intentar obtener del servidor backend si existe
        try {
          const response = await fetch('/api/get-client-ip');
          const data = await response.json();
          return data;
        } catch {
          // Si todo falla, registrar como desconocido pero con advertencia
          console.error('⚠️ ADVERTENCIA LEGAL: No se pudo obtener IP real del cliente');
          return { 
            clientIP: 'ERROR_OBTAINING_IP',
            proxyIPs: ['CHECK_SERVER_LOGS']
          };
        }
      }

      console.log('✅ IP REAL capturada para auditoría legal:', ipData.clientIP);
      return {
        clientIP: ipData.clientIP,
        proxyIPs: ipData.proxyIPs
      };
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO obteniendo IP:', error);
      // En caso de error, es mejor no procesar que tener datos falsos
      throw new Error('No se puede proceder sin IP real por requisitos legales');
    }
  }

  // === CAPTURA COMPLETA DE DATOS FORENSES ===
  public async captureForensicData(): Promise<ForensicData> {
    // Capturar datos básicos primero (más confiables)
    const [browserFingerprint, geolocation, ipInfo] = await Promise.all([
      this.getBrowserFingerprint(),
      this.getGeolocation(),
      this.getClientIP()
    ]);
    
    // Intentar detección avanzada pero no fallar si hay error
    let advancedIPData: any = {};
    try {
      advancedIPData = await AdvancedIPDetection.collectAllIPData();
      console.log('✅ Detección avanzada completada');

      // Log específico para WiFi si está disponible
      if (advancedIPData.wifiLocation) {
        console.log('📶 WiFi Geolocation obtenida:', {
          coordenadas: `${advancedIPData.wifiLocation.latitude}, ${advancedIPData.wifiLocation.longitude}`,
          precision: `±${advancedIPData.wifiLocation.accuracy}m`,
          redes: advancedIPData.wifiLocation.wifiCount,
          metodo: advancedIPData.wifiLocation.method
        });
      }
    } catch (error) {
      console.warn('⚠️ Detección avanzada falló, usando datos básicos:', error);
      advancedIPData = {
        webrtcLeakedIP: undefined,
        localIP: undefined,
        vpnDetected: false,
        vpnProvider: undefined,
        canvasFingerprint: undefined,
        wifiLocation: null,
        trustScore: 50
      };
    }

    const networkInfo = this.getNetworkInfo();

    const forensicData: ForensicData = {
      // Identificación
      accessId: this.accessId,
      linkId: this.linkId,
      auditId: this.auditId,

      // Red - DATOS REALES Y AVANZADOS
      clientIP: ipInfo.clientIP, // IP de VPN si usa VPN
      proxyIPs: ipInfo.proxyIPs,
      userAgent: navigator.userAgent,
      
      // NUEVOS CAMPOS DE DETECCIÓN AVANZADA
      realIP: advancedIPData.webrtcLeakedIP || undefined, // ⚠️ IP REAL SI HAY LEAK
      localIP: advancedIPData.localIP || undefined,
      vpnDetected: advancedIPData.vpnDetected,
      vpnProvider: advancedIPData.vpnProvider || undefined,
      canvasFingerprint: advancedIPData.canvasFingerprint,
      trustScore: advancedIPData.trustScore,

      // GEOLOCALIZACIÓN WIFI
      wifiLocation: advancedIPData.wifiLocation || undefined,

      // Navegador
      browserFingerprint,

      // Localización
      geolocation,

      // Sesión
      referer: document.referrer || 'direct',
      sessionStart: this.sessionStart,
      focusEvents: [...this.focusEvents],

      // Red
      connectionType: networkInfo.connectionType,
      effectiveType: networkInfo.effectiveType,

      // Metadatos
      createdAt: new Date().toISOString(),
      isDownloaded: false,
      accessCount: 1,

      // Página
      pageVisibility: document.visibilityState as any
    };

    console.log('🕵️ [FORENSE] Datos capturados:', {
      accessId: forensicData.accessId,
      clientIP: forensicData.clientIP,
      userAgent: forensicData.userAgent.substring(0, 50) + '...',
      timezone: forensicData.browserFingerprint.timezone,
      hasGeolocation: !!forensicData.geolocation
    });

    // === 🗄️ GUARDAR EN SUPABASE ===
    if (isSupabaseConfigured()) {
      try {
        const supabaseId = await ForensicService.storeForensicData(forensicData);
        if (supabaseId) {
          console.log('✅ [FORENSE] Datos guardados en Supabase:', supabaseId);
        } else {
          console.warn('⚠️ [FORENSE] No se pudo guardar en Supabase');
        }
      } catch (error) {
        console.error('❌ [FORENSE] Error guardando en Supabase:', error);
      }
    } else {
      console.log('🔧 [FORENSE] Supabase no configurado - Solo logs locales');
    }

    return forensicData;
  }

  // === REGISTRAR DESCARGA ===
  public async recordDownload(): Promise<void> {
    const downloadTime = new Date().toISOString();
    
    console.log('🕵️ [FORENSE] Descarga registrada:', {
      accessId: this.accessId,
      downloadTime
    });

    // === 🗄️ ACTUALIZAR EN SUPABASE ===
    if (isSupabaseConfigured()) {
      try {
        const success = await ForensicService.updateDownloadInfo(
          this.accessId,
          downloadTime,
          new Date().toISOString() // session_end
        );
        
        if (success) {
          console.log('✅ [FORENSE] Descarga actualizada en Supabase');
        } else {
          console.warn('⚠️ [FORENSE] No se pudo actualizar descarga en Supabase');
        }
      } catch (error) {
        console.error('❌ [FORENSE] Error actualizando descarga:', error);
      }
    }
  }

  // === REGISTRAR FIN DE SESIÓN ===
  public recordSessionEnd(): void {
    console.log('🕵️ [FORENSE] Sesión finalizada:', {
      accessId: this.accessId,
      sessionEnd: new Date().toISOString(),
      sessionDuration: Date.now() - new Date(this.sessionStart).getTime()
    });
  }

  // === OBTENER ID DE ACCESO ===
  public getAccessId(): string {
    return this.accessId;
  }
}

// === UTILIDADES PARA ANÁLISIS FORENSE ===
export const ForensicUtils = {
  // Analizar User-Agent
  parseUserAgent: (userAgent: string) => {
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const browser = userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || 'unknown';
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'unknown';
    
    return { isBot, isMobile, browser, os };
  },

  // Calcular distancia entre coordenadas
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  // Detectar patrones sospechosos
  detectSuspiciousActivity: (forensicData: ForensicData): string[] => {
    const warnings: string[] = [];
    
    // Detectar bots
    const userAgentAnalysis = ForensicUtils.parseUserAgent(forensicData.userAgent);
    if (userAgentAnalysis.isBot) {
      warnings.push('Posible bot detectado');
    }

    // Detectar proxies/VPNs (IPs múltiples)
    if (forensicData.proxyIPs && forensicData.proxyIPs.length > 0) {
      warnings.push('Uso de proxy/VPN detectado');
    }

    // Detectar acceso muy rápido
    const sessionDuration = forensicData.sessionEnd 
      ? new Date(forensicData.sessionEnd).getTime() - new Date(forensicData.sessionStart).getTime()
      : Date.now() - new Date(forensicData.sessionStart).getTime();
    
    if (sessionDuration < 2000) { // Menos de 2 segundos
      warnings.push('Acceso extremadamente rápido');
    }

    return warnings;
  }
};
