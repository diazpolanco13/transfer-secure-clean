// 🔍 DETECCIÓN AVANZADA DE IP REAL - TÉCNICAS FORENSES
// Para cumplimiento legal y detección de fraudes

export class AdvancedIPDetection {
  
  // === TÉCNICA 1: WebRTC Leak Detection ===
  // WebRTC puede revelar la IP real incluso con VPN
  static async detectWebRTCLeak(): Promise<{localIP?: string, publicIP?: string}> {
    return new Promise((resolve) => {
      const ips: Set<string> = new Set();
      
      // Crear conexión RTC
      const pc = new RTCPeerConnection({
        iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
      });
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          // Procesar IPs encontradas
          const detectedIPs = Array.from(ips);
          const localIP = detectedIPs.find(ip => 
            ip.startsWith('192.168.') || 
            ip.startsWith('10.') || 
            ip.startsWith('172.')
          );
          const publicIP = detectedIPs.find(ip => 
            !ip.startsWith('192.168.') && 
            !ip.startsWith('10.') && 
            !ip.startsWith('172.')
          );
          
          pc.close();
          resolve({ localIP, publicIP });
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/g;
        const foundIPs = candidate.match(ipRegex);
        
        if (foundIPs) {
          foundIPs.forEach(ip => ips.add(ip));
        }
      };
      
      // Crear oferta para iniciar detección
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      // Timeout de seguridad
      setTimeout(() => {
        pc.close();
        resolve({ localIP: undefined, publicIP: undefined });
      }, 5000);
    });
  }
  
  // === TÉCNICA 2: DNS Leak Detection ===
  // Detecta si el DNS revela información
  static async detectDNSLeak(): Promise<{dnsProvider?: string, realISP?: string}> {
    try {
      // Intentar resolver un dominio único que registre el DNS usado
      const uniqueId = Math.random().toString(36).substring(7);
      // const testDomain = `dns-leak-test-${uniqueId}.dnsleaktest.com`; // Para uso futuro
      
      // Este servicio registraría qué DNS hizo la consulta
      const response = await fetch(`https://dnsleaktest.com/api/check/${uniqueId}`);
      const data = await response.json();
      
      return {
        dnsProvider: data.dns_provider || 'unknown',
        realISP: data.isp || 'unknown'
      };
    } catch (error) {
      return { dnsProvider: undefined, realISP: undefined };
    }
  }
  
  // === TÉCNICA 3: Timezone vs IP Location Mismatch ===
  // Detecta discrepancias entre timezone y ubicación de IP
  static detectTimezoneMismatch(ipLocation: string): boolean {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Mapa COMPLETO de países a timezones esperados
    const timezoneMap: Record<string, string[]> = {
      'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
      'VE': ['America/Caracas'],
      'ES': ['Europe/Madrid', 'Atlantic/Canary'],
      'MX': ['America/Mexico_City', 'America/Cancun', 'America/Monterrey', 'America/Tijuana'],
      'AR': ['America/Argentina/Buenos_Aires'],
      'CO': ['America/Bogota'],
      'PE': ['America/Lima'],
      'CL': ['America/Santiago'],
      'BR': ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza'],
      'CA': ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg'],
      'GB': ['Europe/London'],
      'FR': ['Europe/Paris'],
      'DE': ['Europe/Berlin'],
      'IT': ['Europe/Rome'],
      'RU': ['Europe/Moscow', 'Asia/Vladivostok'],
      'CN': ['Asia/Shanghai', 'Asia/Urumqi'],
      'JP': ['Asia/Tokyo'],
      'AU': ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'],
      'IN': ['Asia/Kolkata'],
      // ... más países
    };
    
    // Si el timezone no coincide con el país de la IP, probable VPN
    const expectedTimezones = timezoneMap[ipLocation] || [];
    const mismatch = expectedTimezones.length > 0 && !expectedTimezones.includes(browserTimezone);
    
    console.log(`🕐 Timezone Check: Browser=${browserTimezone}, IP Country=${ipLocation}, Match=${!mismatch}`);
    
    return mismatch;
  }
  
  // === TÉCNICA 4: TCP/IP Fingerprinting ===
  // Analiza características únicas de la conexión
  static async detectTCPFingerprint(): Promise<any> {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (!connection) return null;
    
    return {
      effectiveType: connection.effectiveType,
      rtt: connection.rtt, // Round-trip time
      downlink: connection.downlink,
      saveData: connection.saveData,
      // RTT alto + buena velocidad = posible VPN
      possibleVPN: connection.rtt > 100 && connection.downlink > 10
    };
  }
  
  // === TÉCNICA 5: Canvas Fingerprinting Avanzado ===
  // Identifica el dispositivo único incluso con VPN
  static getCanvasFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unavailable';
    
    // Texto único que genera diferentes pixeles según hardware/OS
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Transfer Secure 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Transfer Secure 🔒', 4, 17);
    
    const dataURL = canvas.toDataURL();
    
    // Generar hash único
    let hash = 0;
    for (let i = 0; i < dataURL.length; i++) {
      const char = dataURL.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }
  
  // === TÉCNICA 6: Detección de Proxies Conocidos ===
  static async checkKnownVPNs(ip: string): Promise<{isVPN: boolean, provider?: string}> {
    try {
      // Servicios que detectan VPNs conocidas
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      // Lista de ASNs conocidos de VPNs
      const knownVPNProviders: Record<string, string> = {
        'AS9009': 'M247 Ltd (Common VPN)',
        'AS13335': 'Cloudflare',
        'AS16509': 'Amazon AWS',
        'AS15169': 'Google',
        'AS8075': 'Microsoft Azure',
        // ... más proveedores
      };
      
      const asn = data.asn || '';
      const isVPN = !!knownVPNProviders[asn] || data.proxy || data.hosting;
      
      return {
        isVPN,
        provider: knownVPNProviders[asn] || data.org
      };
    } catch {
      return { isVPN: false };
    }
  }
  
  // === RECOLECCIÓN COMPLETA DE DATOS ===
  static async collectAllIPData(): Promise<any> {
    console.log('🔍 Iniciando detección avanzada de IP...');
    
    // Ejecutar cada detección con manejo de errores individual
    let webrtcLeak: { localIP?: string; publicIP?: string } = { localIP: undefined, publicIP: undefined };
    let tcpFingerprint: any = null;
    let publicIPData: any = { 
      ip: 'unknown',
      country: undefined,
      isp: undefined,
      org: undefined,
      asn: undefined
    };
    
    try {
      webrtcLeak = await this.detectWebRTCLeak();
    } catch (error) {
      console.warn('WebRTC detection failed:', error);
    }
    
    try {
      tcpFingerprint = await this.detectTCPFingerprint();
    } catch (error) {
      console.warn('TCP fingerprint failed:', error);
    }
    
    try {
      publicIPData = await this.getPublicIPWithDetails();
    } catch (error) {
      console.warn('Public IP detection failed:', error);
    }
    
    const canvasFingerprint = this.getCanvasFingerprint();
    const timezoneMismatch = this.detectTimezoneMismatch(publicIPData.country || '');
    
    // Verificar si es VPN
    const vpnCheck = await this.checkKnownVPNs(publicIPData.ip);
    
    const result = {
      // IPs detectadas
      publicIP: publicIPData.ip,
      localIP: webrtcLeak.localIP,
      webrtcLeakedIP: webrtcLeak.publicIP, // ⚠️ ESTA PODRÍA SER LA IP REAL
      
      // Información de red
      isp: publicIPData.isp,
      org: publicIPData.org,
      asn: publicIPData.asn,
      
      // Detección de VPN
      vpnDetected: vpnCheck.isVPN || timezoneMismatch,
      vpnProvider: vpnCheck.provider,
      timezoneMismatch,
      
      // Fingerprinting
      canvasFingerprint,
      tcpFingerprint,
      
      // Análisis de confianza
      trustScore: this.calculateTrustScore({
        vpnDetected: vpnCheck.isVPN,
        timezoneMismatch,
        webrtcLeak: !!webrtcLeak.publicIP,
        tcpSuspicious: tcpFingerprint?.possibleVPN
      })
    };
    
    // LOG FORENSE
    console.log('📊 ANÁLISIS FORENSE COMPLETO:', {
      'IP Pública (VPN)': result.publicIP,
      'IP Local (Red)': result.localIP,
      'IP Real (WebRTC Leak)': result.webrtcLeakedIP || 'No detectada',
      'VPN Detectada': result.vpnDetected ? 'SÍ' : 'NO',
      'Proveedor VPN': result.vpnProvider || 'N/A',
      'Score de Confianza': result.trustScore + '%'
    });
    
    return result;
  }
  
  // === OBTENER IP PÚBLICA CON DETALLES ===
  static async getPublicIPWithDetails(): Promise<any> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      return await response.json();
    } catch {
      return { ip: 'unknown' };
    }
  }
  
  // === CALCULAR SCORE DE CONFIANZA ===
  static calculateTrustScore(factors: any): number {
    let score = 100;
    
    if (factors.vpnDetected) score -= 30;
    if (factors.timezoneMismatch) score -= 20;
    if (factors.webrtcLeak) score -= 25;
    if (factors.tcpSuspicious) score -= 15;
    
    return Math.max(0, score);
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  (window as any).AdvancedIPDetection = AdvancedIPDetection;
  console.log('🔍 AdvancedIPDetection disponible en window.AdvancedIPDetection');
}
