// 🗺️ MAPA FORENSE - Visualización de ubicaciones detectadas
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import type { ForensicData } from '../../types/forensic';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ForensicMapProps {
  forensicLogs: ForensicData[];
  darkMode?: boolean;
  linkId?: string;
}

// Componente para ajustar automáticamente el zoom
function AutoFitBounds({ locations }: { locations: LocationData[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      // Ajustar el mapa para mostrar todas las ubicaciones con padding
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [locations, map]);
  
  return null;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  type: 'gps' | 'ip' | 'vpn';
  label: string;
  timestamp: string;
  isVPN: boolean;
  realIP?: string;
  publicIP: string;
  timezone?: string;
  trustScore?: number;
  accessNumber: number;
  accessId: string;
}

export const ForensicMap: React.FC<ForensicMapProps> = ({ forensicLogs, darkMode = false, linkId }) => {
  const [mapStyle, setMapStyle] = React.useState<'light' | 'dark' | 'satellite'>('light');
  
  // Procesar logs para extraer ubicaciones con índices
  const locations: LocationData[] = forensicLogs
    .filter(log => log.geolocation)
    .map((log, index) => {
      // Número de acceso (1, 2, 3...)
      const accessNumber = index + 1;
      const accessId = log.accessId?.slice(-8) || `acc-${index}`; // Últimos 8 caracteres del ID
      
      return {
        lat: log.geolocation!.latitude,
        lng: log.geolocation!.longitude,
        accuracy: log.geolocation!.accuracy || (log.vpnDetected ? 5000 : 100),
        type: log.vpnDetected ? 'vpn' : 'gps' as const,
        label: log.vpnDetected 
          ? `Acceso #${accessNumber} - VPN: ${log.vpnProvider || 'Detectada'}` 
          : `Acceso #${accessNumber} - Ubicación`,
        timestamp: log.createdAt,
        isVPN: log.vpnDetected || false,
        realIP: log.realIP,
        publicIP: log.clientIP,
        timezone: log.browserFingerprint?.timezone,
        trustScore: log.trustScore,
        accessNumber,
        accessId
      };
    });

  // Calcular centro del mapa
  const centerLat = locations.length > 0 
    ? locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length
    : 10.4974; // Caracas por defecto
  const centerLng = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
    : -66.8834;

  // Crear iconos personalizados con número de acceso
  const createIcon = (color: string, isVPN: boolean = false, accessNumber: number = 1) => {
    const html = `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg); 
          color: white; 
          font-size: 18px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        ">
          ${accessNumber}
        </div>
        ${isVPN ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
            border: 2px solid white;
            font-size: 10px;
          ">🔒</div>
        ` : ''}
      </div>
    `;
    
    return L.divIcon({
      html,
      className: 'custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  // Determinar color según el tipo y confianza
  const getMarkerColor = (location: LocationData) => {
    if (location.type === 'gps') return '#10b981'; // Verde para GPS
    if (location.isVPN) return '#ef4444'; // Rojo para VPN
    if (location.trustScore && location.trustScore < 50) return '#f59e0b'; // Naranja para baja confianza
    return '#3b82f6'; // Azul para IP normal
  };

  // Agrupar ubicaciones cercanas
  const groupedLocations = locations.reduce((acc, loc) => {
    const key = `${Math.round(loc.lat * 100) / 100},${Math.round(loc.lng * 100) / 100}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(loc);
    return acc;
  }, {} as Record<string, LocationData[]>);

  // URLs de tiles según el estilo seleccionado
  const getTileUrl = () => {
    switch(mapStyle) {
      case 'dark':
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      case 'satellite':
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header del mapa */}
      <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
              <MapPinIcon className="h-5 w-5 mr-2 text-blue-500" />
              Mapa Forense de Ubicaciones
            </h3>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Visualización de todas las ubicaciones detectadas con radio de precisión
            </p>
          </div>
          
          {/* Selector de estilo de mapa */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setMapStyle('light')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mapStyle === 'light' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              🌞 Claro
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mapStyle === 'dark' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              🌙 Oscuro
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                mapStyle === 'satellite' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              🛰️ Satélite
            </button>
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>GPS Preciso</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>IP Normal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>VPN Detectada</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Baja Confianza</span>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div style={{ height: '500px', position: 'relative' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Desactivar control por defecto para posicionarlo manualmente
        >
          {/* Auto-ajustar zoom para mostrar todas las ubicaciones */}
          <AutoFitBounds locations={locations} />
          
          {/* Controles del mapa */}
          <ZoomControl position="topright" />
          <ScaleControl position="bottomleft" imperial={false} />
          
          <TileLayer
            key={mapStyle} // Forzar re-render cuando cambia el estilo
            url={getTileUrl()}
            attribution={
              mapStyle === 'satellite' 
                ? '&copy; <a href="https://www.esri.com/">Esri</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
          />

          {/* Renderizar marcadores y círculos de precisión */}
          {Object.entries(groupedLocations).map(([key, locs]) => {
            const mainLoc = locs[0];
            const color = getMarkerColor(mainLoc);
            
            return (
              <React.Fragment key={key}>
                {/* Círculo de precisión */}
                <Circle
                  center={[mainLoc.lat, mainLoc.lng]}
                  radius={mainLoc.accuracy}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.1,
                    color: color,
                    weight: 2,
                    opacity: 0.5
                  }}
                />
                
                {/* Marcador */}
                <Marker
                  position={[mainLoc.lat, mainLoc.lng]}
                  icon={createIcon(color, mainLoc.isVPN, mainLoc.accessNumber)}
                >
                  <Popup className="forensic-popup">
                    <div style={{ minWidth: '300px', maxWidth: '400px' }}>
                      <h4 className="font-bold text-lg mb-2">
                        Acceso #{mainLoc.accessNumber} - {mainLoc.isVPN ? '🔒 VPN DETECTADA' : '📍 Ubicación'}
                      </h4>
                      <div className="text-xs text-gray-500 mb-2">
                        ID: {mainLoc.accessId}
                      </div>
                      
                      {mainLoc.isVPN && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded mb-2 text-xs">
                          <strong>⚠️ ALERTA:</strong> Uso de VPN/Proxy detectado
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        <div><strong>Tipo:</strong> {mainLoc.label}</div>
                        <div className="bg-gray-100 p-1 rounded">
                          <strong>IP Pública (VPN):</strong> 
                          <span className="font-mono ml-1">{mainLoc.publicIP}</span>
                        </div>
                        
                        {mainLoc.realIP && mainLoc.realIP !== mainLoc.publicIP && (
                          <div className="bg-yellow-100 p-1 rounded text-red-600">
                            <strong>⚠️ IP REAL (Leak):</strong> 
                            <span className="font-mono ml-1">{mainLoc.realIP}</span>
                          </div>
                        )}
                        
                        {mainLoc.timezone && (
                          <div className="bg-yellow-50 p-1 rounded">
                            <strong>⏰ Timezone:</strong> {mainLoc.timezone}
                            <br />
                            <span className="text-xs text-yellow-700">
                              {mainLoc.isVPN ? '⚠️ No coincide con IP location' : '✓ Coincide con ubicación'}
                            </span>
                          </div>
                        )}
                        
                        <div><strong>Precisión:</strong> ±{mainLoc.accuracy}m</div>
                        <div><strong>Coordenadas:</strong> {mainLoc.lat.toFixed(4)}, {mainLoc.lng.toFixed(4)}</div>
                        
                        {mainLoc.trustScore !== undefined && (
                          <div className="mt-2 p-1 bg-gray-50 rounded">
                            <strong>Score de Confianza:</strong> 
                            <span className={`ml-1 font-bold ${
                              mainLoc.trustScore > 70 ? 'text-green-600' : 
                              mainLoc.trustScore > 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {mainLoc.trustScore}%
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              {mainLoc.trustScore < 50 && '⚠️ Baja confianza - Posible ocultación'}
                              {mainLoc.trustScore >= 50 && mainLoc.trustScore < 70 && '⚡ Confianza media'}
                              {mainLoc.trustScore >= 70 && '✅ Alta confianza'}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                          <strong>Fecha:</strong> {new Date(mainLoc.timestamp).toLocaleString()}
                        </div>
                        
                        {locs.length > 1 && (
                          <div className="mt-2 pt-2 border-t text-blue-600">
                            <strong>{locs.length} accesos</strong> desde esta ubicación
                          </div>
                        )}
                        
                        {/* Enlaces de verificación */}
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-1">Verificar externamente:</div>
                          <div className="flex gap-1">
                            <a
                              href={`https://www.iplocation.net/ip-lookup/${mainLoc.publicIP}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              IPLocation
                            </a>
                            <a
                              href={`https://ipinfo.io/${mainLoc.publicIP}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              IPInfo
                            </a>
                            {mainLoc.realIP && (
                              <a
                                href={`https://www.iplocation.net/ip-lookup/${mainLoc.realIP}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                IP Real
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Líneas conectando ubicaciones si hay múltiples */}
          {locations.length > 1 && (
            <Polyline
              positions={locations.map(loc => [loc.lat, loc.lng])}
              pathOptions={{
                color: darkMode ? '#9ca3af' : '#6b7280',
                weight: 2,
                opacity: 0.5,
                dashArray: '5, 10'
              }}
            />
          )}
        </MapContainer>

        {/* Overlay con estadísticas y alertas */}
        <div className="absolute top-2 right-2 z-[1000] space-y-2">
          {/* Panel de estadísticas */}
          <div className={`p-3 rounded-lg shadow-lg ${
            darkMode ? 'bg-gray-900/90' : 'bg-white/90'
          } backdrop-blur`}>
            <div className="text-xs space-y-1">
              <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                <strong>Total Accesos:</strong> {forensicLogs.length}
              </div>
              <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                <strong>Ubicaciones Únicas:</strong> {Object.keys(groupedLocations).length}
              </div>
              {locations.some(l => l.isVPN) && (
                <div className="text-red-500">
                  <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                  VPN Detectada
                </div>
              )}
            </div>
            
            {/* Lista de accesos */}
            <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-700">
              <div className="font-semibold text-xs mb-1 text-gray-700 dark:text-gray-300">
                Accesos en el mapa:
              </div>
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-bold mr-2 ${
                      loc.isVPN ? 'bg-red-500' : loc.type === 'gps' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {loc.accessNumber}
                    </span>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {new Date(loc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {loc.isVPN && <span className="text-red-500 text-xs">VPN</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Panel de detección VPN/Timezone */}
          {locations.some(l => l.isVPN || l.timezone) && (
            <div className="p-4 rounded-lg shadow-xl border-2 border-red-600 bg-white dark:bg-gray-900 backdrop-blur max-w-xs">
              <h4 className="font-bold text-red-600 dark:text-red-500 text-base mb-3 flex items-center bg-red-50 dark:bg-red-950 -m-4 mb-3 p-3 rounded-t-lg">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                DISCREPANCIA DETECTADA
              </h4>
              
              {/* Link siendo rastreado */}
              {linkId && (
                <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-300 dark:border-blue-800 mb-3">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                    🔗 LINK RASTREADO:
                  </div>
                  <a 
                    href={`${window.location.origin}/receive/${linkId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-600 dark:text-blue-300 hover:underline break-all"
                  >
                    {window.location.origin}/receive/{linkId}
                  </a>
                </div>
              )}
              
              {locations.filter(l => l.isVPN).map((loc, idx) => (
                <div key={idx} className="mb-3 space-y-2">
                  <div className="bg-red-100 dark:bg-red-950 p-2 rounded border border-red-300 dark:border-red-800">
                    <div className="font-semibold text-red-700 dark:text-red-400 text-sm">
                      🔒 VPN/PROXY ACTIVA
                    </div>
                    <div className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">
                      {loc.publicIP}
                    </div>
                  </div>
                  
                  {loc.realIP && (
                    <div className="bg-orange-100 dark:bg-orange-950 p-2 rounded border border-orange-300 dark:border-orange-800">
                      <div className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
                        ⚠️ IP REAL DETECTADA
                      </div>
                      <div className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {loc.realIP}
                      </div>
                    </div>
                  )}
                  
                  {loc.timezone && (
                    <div className="bg-yellow-100 dark:bg-yellow-950 p-2 rounded border border-yellow-300 dark:border-yellow-800">
                      <div className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm">
                        ⏰ TIMEZONE DISCREPANTE
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        <strong>Detectado:</strong> {loc.timezone}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                        ⚠️ No coincide con ubicación IP
                      </div>
                    </div>
                  )}
                  
                  {/* Botones de verificación externa */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <a
                      href={`https://www.iplocation.net/ip-lookup/${loc.publicIP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs inline-flex items-center"
                    >
                      🔍 Verificar IP
                    </a>
                    <a
                      href={`https://whatismyipaddress.com/ip/${loc.publicIP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs inline-flex items-center"
                    >
                      📍 WhatIsMyIP
                    </a>
                    <a
                      href={`https://www.abuseipdb.com/check/${loc.publicIP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs inline-flex items-center"
                    >
                      ⚠️ AbuseIPDB
                    </a>
                  </div>
                </div>
              ))}
              
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-3 border border-gray-300 dark:border-gray-700">
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-gray-100">📋 Nota Legal:</strong>
                  <div className="mt-1 text-gray-600 dark:text-gray-400">
                    La discrepancia entre timezone y ubicación IP es un indicador forense clave de uso de VPN/Proxy.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
