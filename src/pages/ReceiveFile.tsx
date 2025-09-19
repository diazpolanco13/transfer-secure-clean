import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
  ClockIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { ForensicCapture } from '../utils/forensicCapture';
import type { ForensicData } from '../types/forensic';
import { FileService } from '../services/fileService';
import { isSupabaseConfigured } from '../lib/supabase';
// MetaTags component inline para evitar problemas de import
const MetaTags: React.FC<{
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string;
  senderMessage?: string;
}> = ({ fileName, fileType, fileSize, previewUrl, senderMessage }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeEmoji = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  const title = `${getFileTypeEmoji(fileType)} ${fileName} - Archivo Compartido`;
  const description = senderMessage ||
    `Archivo compartido (${formatFileSize(fileSize)}) - Haz clic para descargar`;

  useEffect(() => {
    // Actualizar título de la página
    document.title = title;
    
    // Función para crear o actualizar meta tags
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Meta tags básicos
    setMetaTag('description', description);
    
    // Open Graph para Facebook/WhatsApp
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', window.location.href, true);
    setMetaTag('og:site_name', 'Transfer Secure', true);
    setMetaTag('og:locale', 'es_ES', true);
    
    // Imagen de previsualización
    const imageUrl = fileType.includes('image') 
      ? previewUrl 
      : `https://via.placeholder.com/1200x630/2563eb/ffffff?text=${encodeURIComponent(fileName)}`;
    
    setMetaTag('og:image', imageUrl, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:image:type', fileType.includes('image') ? 'image/jpeg' : 'image/png', true);
    
    // Twitter Cards
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', imageUrl);
    
    // Favicon dinámico
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    const emoji = getFileTypeEmoji(fileType);
    favicon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
    
  }, [fileName, fileType, fileSize, previewUrl, senderMessage, title, description]);

  return null; // Este componente no renderiza nada visible
};

interface FileData {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  expiryDate: string;
  senderMessage?: string;
}

const ReceiveFile: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable' | 'completed'>('requesting');
  const [showLocationIndicator, setShowLocationIndicator] = useState(false);
  
  // === 🕵️ SISTEMA DE CAPTURA FORENSE ===
  const forensicCapture = useRef<ForensicCapture | null>(null);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);

  // === DETECTAR CRAWLERS Y REDIRIGIR ===
  const detectAndRedirectCrawlers = () => {
    if (typeof window === 'undefined') return; // Server-side, skip

    const userAgent = navigator.userAgent || '';
    const crawlers = [
      'facebookexternalhit',
      'facebookcatalog',
      'twitterbot',
      'linkedinbot',
      'whatsapp',
      'telegrambot',
      'discordbot',
      'slackbot',
      'googlebot',
      'bingbot',
      'yandexbot',
      'duckduckbot',
      'baiduspider'
    ];

    const isCrawler = crawlers.some(crawler =>
      userAgent.toLowerCase().includes(crawler)
    );

    if (isCrawler && fileId) {
      console.log('🤖 [CRAWLER] Detectado crawler, redirigiendo a preview API');

      // Redirigir a API route que sirve meta tags
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/api/preview/${fileId}`;
      return true; // Indica que se redirigió
    }

    return false; // Continuar normalmente
  };

  // === VERIFICAR PERMISO DE GEOLOCALIZACIÓN ===
  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationStatus(permission.state as any);

      // Escuchar cambios en el permiso
      permission.addEventListener('change', () => {
        setLocationStatus(permission.state as any);
      });
    } catch (error) {
      // Fallback para navegadores que no soportan permissions API
      setLocationStatus('requesting');
    }
  };

  // === REINTENTAR PERMISO DE GEOLOCALIZACIÓN ===
  const retryLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('requesting');
    setShowLocationIndicator(true);

    try {
      // Solicitar ubicación GPS directamente
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            timeout: 15000, // Más tiempo para dar oportunidad al usuario
            enableHighAccuracy: true,
            maximumAge: 0 // No usar cache
          }
        );
      });

      console.log('✅ Ubicación obtenida en reintento:', position.coords);
      setLocationStatus('completed');

      // Actualizar datos forenses si están disponibles
      if (forensicData) {
        const updatedForensicData = {
          ...forensicData,
          geolocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
        };
        setForensicData(updatedForensicData);
      }

    } catch (error: any) {
      console.log('⚠️ Reintento de geolocalización falló:', error.message);
      setLocationStatus('denied');
    }

    // Ocultar indicador después de 3 segundos
    setTimeout(() => setShowLocationIndicator(false), 3000);
  };

  // === 🕵️ INICIALIZAR CAPTURA FORENSE AL CARGAR LA PÁGINA ===
  useEffect(() => {
    if (fileId) {
      // PRIMERO: Detectar si es crawler y redirigir si es necesario
      const redirected = detectAndRedirectCrawlers();
      if (redirected) {
        console.log('🚫 Redirigiendo crawler, abortando inicialización normal');
        return; // No continuar con la inicialización normal
      }

      const initializeForensicCapture = async () => {
        try {
          // Mostrar indicador de ubicación
          setShowLocationIndicator(true);

          // === 🗄️ OBTENER DATOS REALES DESDE SUPABASE ===
          let auditId = `audit-${fileId.split('-')[0]}`; // Fallback

          console.log('🔍 [DEBUG] Verificando configuración de Supabase...');
          console.log('🔍 [DEBUG] isSupabaseConfigured():', isSupabaseConfigured());
          console.log('🔍 [DEBUG] VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL ? '✅ Configurado' : '❌ NO CONFIGURADO');
          console.log('🔍 [DEBUG] VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ NO CONFIGURADO');

          if (isSupabaseConfigured()) {
            console.log('🗄️ [SUPABASE] Obteniendo datos del archivo:', fileId);
            try {
              const { file, shareLink } = await FileService.getFileByLinkId(fileId);
              console.log('🔍 [DEBUG] Respuesta de getFileByLinkId:', { file: !!file, shareLink: !!shareLink });

              if (file && shareLink) {
                auditId = file.audit_id;
                console.log('✅ [SUPABASE] Archivo encontrado:', file.original_name);
                console.log('🔍 [DEBUG] Datos del archivo:', {
                  auditId: file.audit_id,
                  originalName: file.original_name,
                  fileSize: file.file_size,
                  fileType: file.file_type,
                  secureUrl: file.secure_url
                });

                // Actualizar datos del archivo con información real
                setFileData({
                  id: fileId,
                  originalName: file.original_name,
                  fileSize: file.file_size,
                  fileType: file.file_type,
                  uploadDate: file.uploaded_at,
                  expiryDate: shareLink.expires_at,
                  senderMessage: shareLink.custom_message || undefined
                });

                // Actualizar URL de previsualización
                setPreviewUrl(file.secure_url);
                console.log('✅ [SUPABASE] Datos del archivo actualizados correctamente');
              } else {
                console.warn('⚠️ [SUPABASE] Archivo no encontrado, usando datos simulados');
                console.log('🔍 [DEBUG] Detalles de búsqueda:', {
                  fileId,
                  fileExists: !!file,
                  shareLinkExists: !!shareLink
                });
              }
            } catch (error) {
              console.error('❌ [SUPABASE] Error obteniendo datos del archivo:', error);
              console.log('🔍 [DEBUG] Usando datos simulados por error');
            }
          } else {
            console.log('🔧 [SUPABASE] No configurado, usando datos simulados');
            console.log('💡 [DEBUG] Para solucionar: configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel');
          }

          // Verificar permiso de geolocalización
          await checkLocationPermission();

          // Inicializar sistema de captura forense
          forensicCapture.current = new ForensicCapture(fileId, auditId);

          // Capturar datos forenses inmediatamente (esto incluye geolocalización automática)
          const data = await forensicCapture.current.captureForensicData();
          setForensicData(data);

          // Actualizar estado de ubicación basado en los datos capturados
          if (data.geolocation) {
            setLocationStatus('completed');
          } else {
            setLocationStatus('denied');
          }

          console.log('🕵️ [FORENSE] Datos capturados:', {
            accessId: data.accessId,
            linkId: data.linkId,
            auditId: data.auditId,
            clientIP: data.clientIP,
            realIP: data.realIP || 'no detectada',
            vpnDetected: data.vpnDetected,
            geolocation: data.geolocation ? 'obtenida' : 'fallida',
            timestamp: data.createdAt
          });

          // Ocultar indicador después de completar
          setTimeout(() => setShowLocationIndicator(false), 2000);

          // IMPORTANTE: Los datos forenses se guardan automáticamente en captureForensicData()
          console.log('📝 [FORENSE] Verificar en Supabase si se guardaron los datos');

        } catch (error) {
          console.error('❌ [FORENSE] Error inicializando captura:', error);
          setError('Error cargando archivo');
          setLocationStatus('denied');
          setShowLocationIndicator(false);
        }
      };

      initializeForensicCapture();
    }
  }, [fileId]);

  // Simular datos del archivo basado en el ID
  useEffect(() => {
    if (!fileId) {
      setError('ID de archivo no válido');
      return;
    }

    // Simular diferentes tipos de archivos para demostración
    const fileTypes = [
      {
        originalName: 'contrato-confidencial.pdf',
        fileType: 'application/pdf',
        previewUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      },
      {
        originalName: 'imagen-documento.jpg', 
        fileType: 'image/jpeg',
        previewUrl: 'https://picsum.photos/800/600?random=1'
      }
    ];
    
    // Alternar entre PDF e imagen para demostración
    const selectedType = fileTypes[Math.floor(Date.now() / 10000) % 2];
    
    const mockFileData: FileData = {
      id: fileId,
      originalName: selectedType.originalName,
      fileSize: 2048576, // 2MB
      fileType: selectedType.fileType,
      uploadDate: '2025-09-19T20:08:10Z',
      expiryDate: '2025-09-24T20:08:10Z',
      senderMessage: 'Hola, te envío este documento importante que necesitas revisar. Es confidencial, por favor manéjalo con cuidado.'
    };
    
    setFileData(mockFileData);
    setPreviewUrl(selectedType.previewUrl);

    // Iniciar proceso de "descifrado" automáticamente después de 1 segundo
    const timer = setTimeout(() => {
      setIsDecrypting(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fileId]);

  // Simular progreso de descifrado
  useEffect(() => {
    if (isDecrypting && decryptionProgress < 100) {
      const interval = setInterval(() => {
        setDecryptionProgress(prev => {
          const newProgress = prev + Math.random() * 12 + 3; // Progreso variable más controlado
          
          if (newProgress >= 100) {
            // Completar el descifrado
            setTimeout(() => {
              setIsDecrypting(false);
              setIsDecrypted(true);
              console.log('Descifrado completado - mostrando contenido'); // Debug
            }, 500); // Pequeña pausa antes de mostrar el contenido
            clearInterval(interval);
            return 100;
          }
          
          return newProgress;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isDecrypting]);

  // Debug para verificar estados
  useEffect(() => {
    console.log('Estados:', { 
      isDecrypting, 
      isDecrypted, 
      decryptionProgress: Math.round(decryptionProgress),
      fileData: !!fileData 
    });
  }, [isDecrypting, isDecrypted, decryptionProgress, fileData]);

  const handleDownload = async () => {
    if (!fileData || isDownloaded) return;
    
    // === 🕵️ REGISTRAR DESCARGA EN SISTEMA FORENSE ===
    if (forensicCapture.current) {
      await forensicCapture.current.recordDownload();
    }
    
    // Actualizar datos forenses con información de descarga
    if (forensicData) {
      const updatedForensicData = {
        ...forensicData,
        isDownloaded: true,
        downloadTime: new Date().toISOString(),
        sessionEnd: new Date().toISOString()
      };
      setForensicData(updatedForensicData);
      
      console.log('🕵️ [FORENSE] Descarga completada y registrada:', {
        accessId: updatedForensicData.accessId,
        downloadTime: updatedForensicData.downloadTime,
        fileName: fileData.originalName
      });
      
      // TODO: Actualizar en base de datos
      // await updateForensicData(updatedForensicData);
    }
    
    // Simular descarga
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = fileData.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsDownloaded(true);
  };

  const getTimeUntilExpiry = () => {
    if (!fileData) return '';
    const now = new Date();
    const expiry = new Date(fileData.expiryDate);
    const diffInDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return `${diffInDays} días`;
  };

  const getFileIcon = () => {
    if (!fileData) return <DocumentIcon className="h-12 w-12 text-blue-600" />;
    
    if (fileData.fileType.includes('image')) {
      return <div className="text-4xl">🖼️</div>;
    } else if (fileData.fileType.includes('pdf')) {
      return <div className="text-4xl">📄</div>;
    }
    return <DocumentIcon className="h-12 w-12 text-blue-600" />;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Archivo No Disponible</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            El archivo puede haber expirado o el enlace puede ser incorrecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Meta tags para redes sociales */}
      {fileData && (
        <MetaTags 
          fileName={fileData.originalName}
          fileType={fileData.fileType}
          fileSize={fileData.fileSize}
          previewUrl={previewUrl}
          senderMessage={fileData.senderMessage}
        />
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header simple */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-3">
              <LockClosedIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archivo Compartido</h1>
              <p className="text-blue-600 font-medium">Documento listo para descargar</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <div className="flex items-center text-blue-800">
              <span className="font-medium">Archivo seguro listo para descarga</span>
            </div>
          </div>

          {/* Indicador de geolocalización */}
          {showLocationIndicator && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 inline-block">
              <div className="flex items-center justify-between text-gray-700">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    locationStatus === 'completed' ? 'bg-green-500' :
                    locationStatus === 'granted' ? 'bg-blue-500' :
                    locationStatus === 'denied' ? 'bg-red-500' :
                    locationStatus === 'unavailable' ? 'bg-gray-500' :
                    'bg-yellow-500 animate-pulse'
                  }`}></div>
                  <span className="text-sm">
                    {locationStatus === 'completed' ? 'Ubicación obtenida' :
                     locationStatus === 'granted' ? 'Localizando...' :
                     locationStatus === 'denied' ? 'Ubicación no disponible' :
                     locationStatus === 'unavailable' ? 'Geolocalización no soportada' :
                     'Solicitando ubicación...'}
                  </span>
                </div>

                {/* Botón de reintento para ubicación denegada */}
                {locationStatus === 'denied' && (
                  <button
                    onClick={retryLocationPermission}
                    className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Proceso de descifrado */}
        {isDecrypting && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <LockClosedIcon className="h-16 w-16 mx-auto text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cargando Archivo</h2>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                {/* eslint-disable-next-line react/style-prop-object */}
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(Math.round(decryptionProgress), 100)}%`,
                    // Progress bar width - dynamic based on decryption progress
                  } as const}
                ></div>
              </div>
              <p className="text-gray-600">
                Preparando archivo para descarga... {Math.min(Math.round(decryptionProgress), 100)}%
              </p>
            </div>
          </div>
        )}

        {/* Contenido principal - Solo visible después del descifrado */}
        {isDecrypted && fileData && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Vista previa del documento */}
            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">📄 Vista Previa</h2>
                <p className="text-gray-600">Revisa el archivo antes de descargar</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-6">
                {fileData?.fileType.includes('image') ? (
                  // Previsualización de imagen con opacidad y metadatos
                  <div className="text-center relative">
                    <div className="relative overflow-hidden rounded-lg">
                      {/* Contenedor con altura limitada (70% visible) */}
                      <div className="h-64 md:h-80 overflow-hidden relative">
                        <img 
                          src={previewUrl} 
                          alt={fileData.originalName}
                          className="w-full h-full object-cover opacity-60 transition-opacity duration-300 hover:opacity-75"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        
                        {/* Overlay con metadatos informativos */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex items-end justify-center p-4">
                          <div className="text-center text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-3">
                              <p className="text-sm font-medium">Vista previa</p>
                              <p className="text-xs opacity-90">Descarga para ver el archivo completo</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicador de contenido cortado */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-200 to-transparent flex items-end justify-center pb-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Metadatos informativos debajo */}
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-blue-600 font-semibold">Resolución</div>
                            <div className="text-gray-600">Alta calidad</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-semibold">Formato</div>
                            <div className="text-gray-600">JPEG</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-600 font-semibold">Tamaño</div>
                            <div className="text-gray-600">{Math.round(fileData.fileSize / 1024 / 1024 * 100) / 100} MB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-600 font-semibold">Estado</div>
                            <div className="text-gray-600">Listo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : fileData?.fileType.includes('pdf') ? (
                  // Previsualización de PDF con opacidad y metadatos
                  <div className="relative">
                    <div className="relative overflow-hidden rounded-lg">
                      {/* Contenedor PDF con altura limitada */}
                      <div className="h-64 md:h-80 relative overflow-hidden">
                        <div className="pdf-preview-container w-full h-full opacity-50 transition-opacity duration-300 hover:opacity-70">
                          <iframe
                            src={`${previewUrl}#view=FitH&pagemode=none&toolbar=0&zoom=75`}
                            className="w-full h-full border-0 rounded-lg"
                            title="Previsualización del PDF"
                          />
                        </div>
                        
                        {/* Overlay con metadatos informativos para PDF */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex items-end justify-center p-4 pointer-events-none">
                          <div className="text-center text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-3">
                              <p className="text-sm font-medium">Vista previa</p>
                              <p className="text-xs opacity-90">Descarga para ver el archivo completo</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicador de contenido cortado */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-200 to-transparent flex items-end justify-center pb-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Metadatos informativos para PDF */}
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-red-600 font-semibold">Páginas</div>
                            <div className="text-gray-600">Múltiples</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-semibold">Formato</div>
                            <div className="text-gray-600">PDF</div>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-600 font-semibold">Tamaño</div>
                            <div className="text-gray-600">{Math.round(fileData.fileSize / 1024 / 1024 * 100) / 100} MB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-600 font-semibold">Estado</div>
                            <div className="text-gray-600">Listo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback para otros tipos de archivo
                  <div className="text-center py-16 text-gray-500">
                    <DocumentIcon className="h-24 w-24 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">{fileData?.originalName}</h3>
                    <p className="text-lg mb-4">Tipo: {fileData?.fileType.toUpperCase()}</p>
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block">
                      Documento listo para descargar
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de descarga COMPACTO */}
              <div className="text-center mb-4">
                {!isDownloaded ? (
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    <ArrowDownTrayIcon className="h-6 w-6 inline mr-2" />
                    Descargar Archivo
                  </button>
                ) : (
                  <div className="bg-gray-100 text-gray-500 px-8 py-3 rounded-lg font-semibold text-lg">
                    <CheckCircleIcon className="h-6 w-6 inline mr-2" />
                    Archivo Descargado - Enlace Expirado
                  </div>
                )}
                
                {isDownloaded && (
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ Archivo descargado correctamente
                  </p>
                )}
              </div>
            </div>

            {/* Información del archivo - COMPACTA */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Archivo Compartido
                    </h2>
                    <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Expira en {getTimeUntilExpiry()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Nombre del archivo:</div>
                      <div className="font-medium text-gray-900">{fileData.originalName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tamaño:</div>
                      <div className="font-medium text-gray-900">
                        {Math.round(fileData.fileSize / 1024 / 1024 * 100) / 100} MB
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tipo:</div>
                      <div className="font-medium text-gray-900">{fileData.fileType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Enviado:</div>
                      <div className="font-medium text-gray-900">
                        {new Date(fileData.uploadDate).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>

                  {/* Mensaje del remitente */}
                  {fileData.senderMessage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-800 font-medium mb-1">Nota del remitente:</div>
                      <p className="text-blue-700">{fileData.senderMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer simple */}
            <div className="bg-gray-50 border-t border-gray-200 p-4">
              <div className="text-center text-sm text-gray-600">
                <p>Archivo listo para descarga segura</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReceiveFile;
