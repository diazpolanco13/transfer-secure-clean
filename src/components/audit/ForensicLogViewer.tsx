// 🕵️ VISOR DE LOGS FORENSES PARA AUDITORÍA LEGAL
// Solo visible en modo desarrollo - En producción estará oculto

import React, { useState } from 'react';
import { 
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import type { ForensicData } from '../../types/forensic';
import { ForensicUtils } from '../../utils/forensicCapture';
import { ForensicMap } from './ForensicMap';

interface ForensicLogViewerProps {
  linkId: string;
  fileName: string;
  forensicLogs: ForensicData[];
  darkMode?: boolean;
}

export const ForensicLogViewer: React.FC<ForensicLogViewerProps> = ({
  linkId,
  fileName,
  forensicLogs,
  darkMode = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ForensicData | null>(null);
  // const [, setShowMap] = useState(false); // No usado actualmente
  const [openMaps, setOpenMaps] = useState<Set<number>>(new Set());

  // Mostrar logs forenses tanto en desarrollo como producción
  // (anteriormente estaba limitado solo a desarrollo)

  // Funciones para manejar múltiples mapas
  const toggleMap = (index: number) => {
    const newOpenMaps = new Set(openMaps);
    if (newOpenMaps.has(index)) {
      newOpenMaps.delete(index);
    } else {
      newOpenMaps.add(index);
    }
    setOpenMaps(newOpenMaps);
  };

  const getThemeClasses = () => ({
    background: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: darkMode ? 'text-white' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-400' : 'text-gray-600',
      muted: darkMode ? 'text-gray-500' : 'text-gray-500'
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      secondary: darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    },
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  });

  const theme = getThemeClasses();

  const formatTimestamp = (timestamp: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  const getLocationString = (forensicData: ForensicData) => {
    // Primero intentar geolocalización híbrida avanzada ⭐ NUEVO
    if (forensicData.hybridLocation) {
      const { latitude, longitude, accuracy, method, confidence, sources } = forensicData.hybridLocation;
      return `🔥 HÍBRIDA ${method.toUpperCase()}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m, ${confidence}% confianza, ${sources.length} fuentes)`;
    }

    // Si no hay híbrida, intentar GPS
    if (forensicData.geolocation) {
      const { latitude, longitude, accuracy } = forensicData.geolocation;
      return `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)}m)`;
    }

    // Si no hay GPS, intentar WiFi
    if (forensicData.wifiLocation) {
      const { latitude, longitude, accuracy, wifiCount, method } = forensicData.wifiLocation;
      return `WiFi ${method}: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)}m, ${wifiCount} redes)`;
    }

    return 'Ubicación no disponible';
  };

  const getSuspiciousWarnings = (forensicData: ForensicData) => {
    return ForensicUtils.detectSuspiciousActivity(forensicData);
  };

  // Debug function para WiFi
  const debugWifiData = async () => {
    console.log('🔍 [DEBUG] Verificando datos WiFi en logs...');

    forensicLogs.forEach((log, index) => {
      console.log(`📊 Log ${index + 1} (${log.accessId.slice(-8)}):`, {
        hasWifiLocation: !!log.wifiLocation,
        wifiLocation: log.wifiLocation,
        hasGeolocation: !!log.geolocation,
        geolocation: log.geolocation,
        trustScore: log.trustScore
      });
    });

    // Intentar ejecutar geolocalización WiFi en tiempo real
    try {
      console.log('📶 [DEBUG] Probando geolocalización WiFi en tiempo real...');
      const { AdvancedIPDetection } = await import('../../utils/advancedIPDetection');
      const wifiResult = await AdvancedIPDetection.getWifiLocation();

      if (wifiResult) {
        console.log('✅ [DEBUG] WiFi geolocation exitosa:', wifiResult);
      } else {
        console.log('⚠️ [DEBUG] WiFi geolocation devolvió null');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error en geolocalización WiFi:', error);
    }
  };

  const getTotalUniqueIPs = () => {
    const uniqueIPs = new Set(forensicLogs.map(log => log.clientIP));
    return uniqueIPs.size;
  };

  const getDownloadCount = () => {
    return forensicLogs.filter(log => log.isDownloaded).length;
  };

  const getWifiLocationCount = () => {
    return forensicLogs.filter(log => log.wifiLocation).length;
  };

  const getHybridLocationCount = () => {
    return forensicLogs.filter(log => log.hybridLocation).length;
  };

  const getHybridMethodsStats = () => {
    const methods: Record<string, number> = {};
    forensicLogs.forEach(log => {
      if (log.hybridLocation) {
        const method = log.hybridLocation.method;
        methods[method] = (methods[method] || 0) + 1;
      }
    });
    return methods;
  };

  const getAverageHybridConfidence = () => {
    const hybridLogs = forensicLogs.filter(log => log.hybridLocation);
    if (hybridLogs.length === 0) return 0;

    const totalConfidence = hybridLogs.reduce((sum, log) =>
      sum + (log.hybridLocation?.confidence || 0), 0
    );

    return Math.round(totalConfidence / hybridLogs.length);
  };

  if (!isExpanded) {
    return (
      <div className={`${theme.card} border rounded-lg p-4 mt-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
            <div>
              <h4 className={`font-medium ${theme.text.primary}`}>
                🕵️ Logs Forenses (DESARROLLO)
              </h4>
              <p className={`text-sm ${theme.text.secondary}`}>
                {forensicLogs.length} accesos • {getTotalUniqueIPs()} IPs únicas • {getDownloadCount()} descargas • {getWifiLocationCount()} WiFi • {getHybridLocationCount()} híbridos
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsExpanded(true)}
              className={`${theme.button.secondary} px-3 py-1 rounded text-sm font-medium transition-colors`}
            >
              <EyeIcon className="h-4 w-4 inline mr-1" />
              Ver Detalles
            </button>
            <button
              onClick={debugWifiData}
              className={`${theme.button.secondary} px-3 py-1 rounded text-sm font-medium transition-colors bg-cyan-600 hover:bg-cyan-700 text-white`}
              title="Debug WiFi geolocation"
            >
              📶 Debug WiFi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.card} border rounded-lg p-6 mt-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-6 w-6 text-yellow-500" />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
              🕵️ Auditoría Forense - {fileName}
            </h3>
            <p className={`text-sm ${theme.text.secondary} mb-2`}>
              Link ID: {linkId} • Para investigaciones legales
            </p>
            {/* Link rastreado - clickeable y copiable */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    🔗 LINK RASTREADO:
                  </span>
                  <a 
                    href={`${window.location.origin}/receive/${linkId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {window.location.origin}/receive/{linkId}
                  </a>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/receive/${linkId}`);
                    // Opcional: mostrar notificación de copiado
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Copiar link"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className={`${theme.button.secondary} px-3 py-2 rounded font-medium transition-colors`}
        >
          <EyeSlashIcon className="h-4 w-4 inline mr-1" />
          Ocultar
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-blue-500">{forensicLogs.length}</div>
          <div className={`text-sm ${theme.text.secondary}`}>Accesos Totales</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-green-500">{getTotalUniqueIPs()}</div>
          <div className={`text-sm ${theme.text.secondary}`}>IPs Únicas</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-purple-500">{getDownloadCount()}</div>
          <div className={`text-sm ${theme.text.secondary}`}>Descargas</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-cyan-500">{getWifiLocationCount()}</div>
          <div className={`text-sm ${theme.text.secondary}`}>WiFi Básico</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-orange-500">{getHybridLocationCount()}</div>
          <div className={`text-sm ${theme.text.secondary}`}>Híbrida Avanzada</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-emerald-500">{getAverageHybridConfidence()}%</div>
          <div className={`text-sm ${theme.text.secondary}`}>Confianza Promedio</div>
        </div>
        <div className={`${theme.card} border p-4 rounded-lg text-center`}>
          <div className="text-2xl font-bold text-red-500">
            {forensicLogs.reduce((acc, log) => acc + getSuspiciousWarnings(log).length, 0)}
          </div>
          <div className={`text-sm ${theme.text.secondary}`}>Alertas</div>
        </div>
      </div>

      {/* Estadísticas de Métodos Híbridos */}
      {getHybridLocationCount() > 0 && (
        <div className={`${theme.card} border p-4 rounded-lg mb-6`}>
          <h4 className={`font-semibold ${theme.text.primary} mb-3`}>🎯 Métodos de Geolocalización Híbrida Usados</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(getHybridMethodsStats()).map(([method, count]) => (
              <div key={method} className="text-center">
                <div className={`text-lg font-bold ${
                  method === 'gps' ? 'text-green-500' :
                  method === 'wifi' ? 'text-blue-500' :
                  method === 'bluetooth' ? 'text-purple-500' :
                  method === 'cell' ? 'text-orange-500' : 'text-gray-500'
                }`}>
                  {count}
                </div>
                <div className={`text-sm ${theme.text.secondary} capitalize`}>{method}</div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Lista de Logs */}
      <div className="space-y-3">
        <h4 className={`font-medium ${theme.text.primary} mb-3`}>Registro Detallado de Accesos</h4>
        
        {forensicLogs.map((log, index) => {
          const warnings = getSuspiciousWarnings(log);
          const userAgentAnalysis = ForensicUtils.parseUserAgent(log.userAgent);
          
          return (
            <div key={log.accessId} className={`${theme.card} border rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      log.isDownloaded 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className={`font-medium ${theme.text.primary}`}>
                      Acceso #{log.accessId.slice(-8)}
                    </div>
                    <div className={`text-sm ${theme.text.secondary}`}>
                      {formatTimestamp(log.createdAt)}
                    </div>
                  </div>
                </div>
                
                {/* Estado y Alertas */}
                <div className="flex items-center space-x-2">
                  {log.trustScore !== undefined && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.trustScore > 70 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      log.trustScore > 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      CONFIANZA: {log.trustScore}%
                    </span>
                  )}
                  {log.isDownloaded && (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                      DESCARGADO
                    </span>
                  )}
                  {warnings.length > 0 && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded text-xs font-medium">
                      {warnings.length} ALERTAS
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de Acciones */}
              <div className="flex justify-between mb-3">
                <button
                  onClick={() => setSelectedLog(selectedLog?.accessId === log.accessId ? null : log)}
                  className={`${theme.button.secondary} px-3 py-1 rounded text-sm transition-colors`}
                >
                  {selectedLog?.accessId === log.accessId ? 'Ocultar Detalles' : 'Ver Detalles Completos'}
                </button>
                <button
                  onClick={() => toggleMap(index)}
                  className={`${
                    openMaps.has(index) 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center`}
                >
                  <MapIcon className="h-4 w-4 mr-1" />
                  {openMaps.has(index) ? 'CERRAR MAPA' : 'MAPA'}
                </button>
              </div>

              {/* Información Técnica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className={`font-medium ${theme.text.primary} mb-1 flex items-center`}>
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Red
                    {log.vpnDetected && (
                      <span className="ml-2 px-1 py-0.5 bg-red-500 text-white text-xs rounded">VPN</span>
                    )}
                  </div>
                  <div className={`${theme.text.secondary} space-y-1`}>
                    <div><strong>IP Pública:</strong> {log.clientIP}</div>
                    {log.realIP && log.realIP !== log.clientIP && (
                      <div className="bg-yellow-500 bg-opacity-20 px-1 rounded">
                        <strong>⚠️ IP Real:</strong> {log.realIP}
                      </div>
                    )}
                    {log.localIP && (
                      <div><strong>IP Local:</strong> {log.localIP}</div>
                    )}
                    {log.vpnProvider && (
                      <div><strong>VPN:</strong> {log.vpnProvider}</div>
                    )}
                    {log.proxyIPs && (
                      <div><strong>Proxies:</strong> {log.proxyIPs.join(', ')}</div>
                    )}

                    {/* NUEVA INFORMACIÓN WIFI */}
                    {log.wifiLocation && (
                      <div className="bg-blue-500 bg-opacity-20 px-2 py-1 rounded mt-2 border-l-2 border-blue-500">
                        <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
                          <span className="text-sm font-semibold">📶 WiFi Geolocation</span>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div><strong>Coordenadas:</strong> {log.wifiLocation.latitude.toFixed(6)}, {log.wifiLocation.longitude.toFixed(6)}</div>
                          <div><strong>Precisión:</strong> ±{log.wifiLocation.accuracy}m</div>
                          <div><strong>Redes detectadas:</strong> {log.wifiLocation.wifiCount}</div>
                          <div><strong>Método:</strong> {log.wifiLocation.method.toUpperCase()}</div>
                        </div>
                      </div>
                    )}

                    <div><strong>Referrer:</strong> {log.referer || 'Directo'}</div>
                  </div>
                </div>

                {/* GEOLOCALIZACIÓN HÍBRIDA AVANZADA ⭐ NUEVO */}
                {log.hybridLocation && (
                  <div className="col-span-3 mt-3">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center text-orange-800 dark:text-orange-200 mb-2">
                        <span className="text-sm font-bold">🎯 GEOLOCALIZACIÓN HÍBRIDA AVANZADA</span>
                        <span className="ml-2 px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-xs rounded-full">
                          {log.hybridLocation.confidence}% confianza
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><strong>Método Final:</strong> {log.hybridLocation.method.toUpperCase()}</div>
                        <div><strong>Precisión:</strong> ±{log.hybridLocation.accuracy}m</div>
                        <div><strong>Fuentes:</strong> {log.hybridLocation.sources.join(', ')}</div>
                        <div><strong>Coordenadas:</strong> {log.hybridLocation.latitude.toFixed(6)}, {log.hybridLocation.longitude.toFixed(6)}</div>
                      </div>

                      {/* Detalles de triangulación si están disponibles */}
                      {log.hybridLocation.triangulationData && (
                        <div className="mt-2 pt-2 border-t border-orange-300 dark:border-orange-700">
                          <div className="text-xs text-orange-700 dark:text-orange-300 font-semibold mb-1">🔍 Datos de Triangulación:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {log.hybridLocation.triangulationData.gps && (
                              <div>GPS: ±{log.hybridLocation.triangulationData.gps.accuracy}m</div>
                            )}
                            {log.hybridLocation.triangulationData.wifi && (
                              <div>WiFi: {log.hybridLocation.triangulationData.wifi.count} redes</div>
                            )}
                            {log.hybridLocation.triangulationData.bluetooth && (
                              <div>Bluetooth: {log.hybridLocation.triangulationData.bluetooth.count} beacons</div>
                            )}
                            {log.hybridLocation.triangulationData.cell && (
                              <div>Cellular: {log.hybridLocation.triangulationData.cell.strength}/100</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className={`font-medium ${theme.text.primary} mb-1 flex items-center`}>
                    <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                    Dispositivo
                  </div>
                  <div className={`${theme.text.secondary} space-y-1`}>
                    <div><strong>OS:</strong> {userAgentAnalysis.os}</div>
                    <div><strong>Navegador:</strong> {userAgentAnalysis.browser}</div>
                    <div><strong>Mobile:</strong> {userAgentAnalysis.isMobile ? 'Sí' : 'No'}</div>
                    <div><strong>Pantalla:</strong> {log.browserFingerprint.screen.width}x{log.browserFingerprint.screen.height}</div>
                    {log.canvasFingerprint && (
                      <div><strong>Huella:</strong> <span className="font-mono text-xs">{log.canvasFingerprint.slice(0, 8)}...</span></div>
                    )}
                  </div>
                </div>

                <div>
                  <div className={`font-medium ${theme.text.primary} mb-1 flex items-center`}>
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Sesión
                  </div>
                  <div className={`${theme.text.secondary} space-y-1`}>
                    <div><strong>Inicio:</strong> {formatTimestamp(log.sessionStart)}</div>
                    {log.sessionEnd && (
                      <div><strong>Fin:</strong> {formatTimestamp(log.sessionEnd)}</div>
                    )}
                    {log.downloadTime && (
                      <div><strong>Descarga:</strong> {formatTimestamp(log.downloadTime)}</div>
                    )}
                    <div><strong>Ubicación:</strong> {getLocationString(log)}</div>
                    {log.browserFingerprint?.timezone && (
                      <div className={log.vpnDetected ? 'bg-yellow-500 bg-opacity-20 px-1 rounded mt-1' : ''}>
                        <strong>⏰ Timezone:</strong> 
                        <span className={log.vpnDetected ? 'font-bold text-yellow-600 dark:text-yellow-400' : ''}>
                          {log.browserFingerprint.timezone}
                        </span>
                        {log.vpnDetected && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">
                            (¡CLAVE! Revela ubicación real)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles Completos (si está seleccionado) */}
              {selectedLog?.accessId === log.accessId && (
                <div className={`mt-4 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                  <h5 className={`font-semibold mb-3 ${theme.text.primary}`}>Detalles Forenses Completos</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Access ID:</strong> {log.accessId}</div>
                    <div><strong>Link ID:</strong> {log.linkId}</div>
                    <div><strong>Audit ID:</strong> {log.auditId}</div>
                    <div><strong>Session End:</strong> {log.sessionEnd || 'N/A'}</div>
                    <div className="col-span-2"><strong>User Agent:</strong> <span className="font-mono text-xs">{log.userAgent}</span></div>
                    <div><strong>Languages:</strong> {log.browserFingerprint?.languages?.join(', ') || 'N/A'}</div>
                    <div><strong>Platform:</strong> {log.browserFingerprint?.platform || 'N/A'}</div>
                    <div><strong>Hardware:</strong> {log.browserFingerprint?.hardwareConcurrency || 'N/A'} cores</div>
                    <div><strong>Device Memory:</strong> {log.browserFingerprint?.deviceMemory || 'N/A'} GB</div>
                    <div><strong>Canvas Hash:</strong> {log.canvasFingerprint || 'N/A'}</div>

                    {/* Información WiFi en detalles completos */}
                    {log.wifiLocation && (
                      <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800 mt-2">
                        <div className="text-blue-800 dark:text-blue-200 font-semibold text-xs mb-1">📶 WiFi Geolocation Details</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Lat:</strong> {log.wifiLocation.latitude.toFixed(6)}</div>
                          <div><strong>Lng:</strong> {log.wifiLocation.longitude.toFixed(6)}</div>
                          <div><strong>Accuracy:</strong> ±{log.wifiLocation.accuracy}m</div>
                          <div><strong>WiFi Networks:</strong> {log.wifiLocation.wifiCount}</div>
                          <div><strong>Method:</strong> {log.wifiLocation.method}</div>
                          <div><strong>Source:</strong> Triangulación WiFi</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Alertas de Seguridad */}
              {warnings.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center text-red-800 dark:text-red-200 mb-2">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span className="font-medium">Alertas de Seguridad</span>
                  </div>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}


              {/* Detalles Expandidos */}
              {selectedLog === log && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h5 className={`font-medium ${theme.text.primary} mb-3`}>Información Técnica Completa</h5>
                  <div className="space-y-2 text-xs font-mono">
                    <div><strong>Access ID:</strong> {log.accessId}</div>
                    <div><strong>Link ID:</strong> {log.linkId}</div>
                    <div><strong>Audit ID:</strong> {log.auditId}</div>
                    <div><strong>User-Agent:</strong> {log.userAgent}</div>
                    <div><strong>Timezone:</strong> {log.browserFingerprint.timezone}</div>
                    <div><strong>Languages:</strong> {log.browserFingerprint.languages.join(', ')}</div>
                    <div><strong>Platform:</strong> {log.browserFingerprint.platform}</div>
                    <div><strong>Hardware Concurrency:</strong> {log.browserFingerprint.hardwareConcurrency}</div>
                    {log.browserFingerprint.deviceMemory && (
                      <div><strong>Device Memory:</strong> {log.browserFingerprint.deviceMemory}GB</div>
                    )}
                  </div>
                </div>
              )}

              {/* Mapa Individual del Registro */}
              {openMaps.has(index) && (
                <div className="mt-4">
                  <div className={`border-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden`}>
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} px-4 py-2 flex justify-between items-center`}>
                      <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        📍 Ubicación del Acceso #{index + 1} - {log.accessId.slice(-8)}
                      </span>
                      <button
                        onClick={() => toggleMap(index)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center"
                      >
                        <span className="mr-1">✕</span> Cerrar Mapa
                      </button>
                    </div>
                    <ForensicMap 
                      forensicLogs={[log]} 
                      darkMode={darkMode} 
                      linkId={linkId} 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {forensicLogs.length === 0 && (
          <div className="text-center py-8">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className={`${theme.text.secondary}`}>No hay logs de acceso registrados aún</p>
          </div>
        )}
      </div>

      {/* Disclaimer Legal */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <div className="font-medium mb-1">⚖️ Información Legal</div>
            <p>
              Esta información forense se captura automáticamente para fines de auditoría legal y cumplimiento normativo. 
              Los datos se almacenan de forma segura y solo son accesibles por personal autorizado para investigaciones 
              legales o requerimientos de autoridades competentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
