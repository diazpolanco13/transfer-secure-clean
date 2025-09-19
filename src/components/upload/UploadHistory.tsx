import React, { useState, useEffect } from "react";
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ForensicLogViewer } from '../audit/ForensicLogViewer';
import type { ForensicData } from '../../types/forensic';
import { ForensicService } from '../../services/forensicService';
import { FileService } from '../../services/fileService';
import { isSupabaseConfigured } from '../../lib/supabase';

interface UploadedFile {
  auditId: string;
  originalName: string;
  secureName: string;
  secureUrl: string;
  fileSize: number;
  fileType: string;
  clientIP: string;
  uploadedAt: string;
  processedAt: string;
  // === 🕵️ NUEVOS CAMPOS PARA AUDITORÍA FORENSE ===
  forensicLogs?: ForensicData[];
  shareLinks?: {
    id: string;
    url: string;
    accessCount: number;
    lastAccessed?: string;
  }[];
}

interface UploadHistoryProps {
  files: UploadedFile[];
  onDownload?: (file: UploadedFile) => void;
  onShare?: (file: UploadedFile) => void;
  onDelete?: (file: UploadedFile) => void;
  darkMode?: boolean;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  files: propFiles,
  onDownload,
  onShare,
  onDelete,
  darkMode = true,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(propFiles || []);
  const [expandedForensicLogs, setExpandedForensicLogs] = useState<string | null>(null);
  const [realForensicLogs, setRealForensicLogs] = useState<Record<string, ForensicData[]>>({});
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // === 🗄️ CARGAR ARCHIVOS DESDE SUPABASE ===
  useEffect(() => {
    const loadFilesFromSupabase = async () => {
      if (isSupabaseConfigured()) {
        setIsLoadingFiles(true);
        try {
          console.log('🗄️ [HISTORIAL] Cargando archivos desde Supabase...');
          const supabaseFiles = await FileService.getUploadedFiles();
          const convertedFiles = supabaseFiles.map(FileService.convertRowToUploadedFile);
          setFiles(convertedFiles);
          console.log(`✅ [HISTORIAL] ${convertedFiles.length} archivos cargados`);
        } catch (error) {
          console.error('❌ [HISTORIAL] Error cargando archivos:', error);
        } finally {
          setIsLoadingFiles(false);
        }
      } else {
        // Si no hay Supabase, usar los archivos que vienen como prop
        setFiles(propFiles || []);
      }
    };

    loadFilesFromSupabase();
  }, [propFiles]);

  // === 🔄 ACTUALIZAR CUANDO CAMBIEN LAS PROPS ===
  useEffect(() => {
    if (!isSupabaseConfigured() && propFiles) {
      setFiles(propFiles);
    }
  }, [propFiles]);
  // Generar clases dinámicas según el tema
  const getThemeClasses = () => ({
    text: {
      primary: darkMode ? 'text-white' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-400' : 'text-gray-600',
      muted: darkMode ? 'text-gray-500' : 'text-gray-500'
    },
    card: darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-md',
    button: {
      blue: darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500',
      green: darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500',
      red: darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'
    }
  })

  const theme = getThemeClasses()
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // === 🕵️ GENERAR DATOS FORENSES SIMULADOS PARA DESARROLLO ===
  const generateMockForensicLogs = (auditId: string): ForensicData[] => {
    const mockLogs: ForensicData[] = [];
    const accessCount = Math.floor(Math.random() * 5) + 1; // 1-5 accesos

    for (let i = 0; i < accessCount; i++) {
      const baseTime = Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000); // Últimos 7 días
      const isDownloaded = i === 0 || Math.random() > 0.6; // Primer acceso siempre descarga, otros 40% probabilidad

      mockLogs.push({
        accessId: `access-${baseTime}-${Math.random().toString(36).substring(2, 8)}`,
        linkId: `link-${auditId.split('-')[1]}`,
        auditId: auditId,
        clientIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
        proxyIPs: Math.random() > 0.8 ? [`10.0.0.${Math.floor(Math.random() * 255)}`] : undefined,
        userAgent: [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        ][Math.floor(Math.random() * 3)],
        browserFingerprint: {
          screen: {
            width: [1920, 1366, 1536, 375][Math.floor(Math.random() * 4)],
            height: [1080, 768, 864, 812][Math.floor(Math.random() * 4)],
            colorDepth: 24,
            pixelRatio: Math.random() > 0.5 ? 1 : 2
          },
          timezone: ['America/Argentina/Buenos_Aires', 'America/New_York', 'Europe/Madrid'][Math.floor(Math.random() * 3)],
          language: 'es-ES',
          languages: ['es-ES', 'es', 'en'],
          platform: ['Win32', 'MacIntel', 'iPhone'][Math.floor(Math.random() * 3)],
          cookieEnabled: true,
          doNotTrack: Math.random() > 0.7,
          hardwareConcurrency: [4, 8, 12][Math.floor(Math.random() * 3)],
          deviceMemory: Math.random() > 0.5 ? [4, 8, 16][Math.floor(Math.random() * 3)] : undefined
        },
        geolocation: Math.random() > 0.4 ? {
          latitude: -34.6118 + (Math.random() - 0.5) * 0.1, // Buenos Aires aprox
          longitude: -58.3960 + (Math.random() - 0.5) * 0.1,
          accuracy: Math.floor(Math.random() * 50) + 10,
          timestamp: baseTime
        } : undefined,
        referer: Math.random() > 0.3 ? 'https://wa.me/' : 'direct',
        sessionStart: new Date(baseTime).toISOString(),
        sessionEnd: isDownloaded ? new Date(baseTime + Math.random() * 300000).toISOString() : undefined, // 0-5 min
        downloadTime: isDownloaded ? new Date(baseTime + Math.random() * 60000).toISOString() : undefined, // 0-1 min
        connectionType: ['wifi', '4g', 'ethernet'][Math.floor(Math.random() * 3)],
        effectiveType: ['4g', '3g', 'slow-2g'][Math.floor(Math.random() * 3)],
        createdAt: new Date(baseTime).toISOString(),
        isDownloaded,
        accessCount: 1,
        pageVisibility: 'visible',
        focusEvents: [
          { timestamp: new Date(baseTime).toISOString(), event: 'focus' },
          { timestamp: new Date(baseTime + 30000).toISOString(), event: 'blur' }
        ]
      });
    }

    return mockLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // === 🗄️ CARGAR DATOS REALES DE SUPABASE ===
  const loadRealForensicLogs = async (auditId: string) => {
    if (isSupabaseConfigured() && !realForensicLogs[auditId]) {
      try {
        console.log('🗄️ [SUPABASE] Cargando logs forenses para:', auditId);
        const logs = await ForensicService.getForensicLogsByAuditId(auditId);
        const forensicData = logs.map(log => ForensicService.convertRowToForensicData(log));
        
        setRealForensicLogs(prev => ({
          ...prev,
          [auditId]: forensicData
        }));
        
        console.log('✅ [SUPABASE] Logs cargados:', forensicData.length);
      } catch (error) {
        console.error('❌ [SUPABASE] Error cargando logs:', error);
      }
    }
  };

  const handleViewForensicLogs = async (file: UploadedFile) => {
    if (expandedForensicLogs === file.auditId) {
      setExpandedForensicLogs(null);
    } else {
      setExpandedForensicLogs(file.auditId);
      // Cargar datos reales de Supabase
      await loadRealForensicLogs(file.auditId);
    }
  };

  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  };

  // === 🔄 INDICADOR DE CARGA ===
  if (isLoadingFiles) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin mx-auto h-12 w-12 text-blue-500">
          <svg fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 className={`mt-2 text-sm font-medium ${theme.text.primary}`}>Cargando archivos...</h3>
        <p className={`mt-1 text-sm ${theme.text.secondary}`}>
          Obteniendo datos desde Supabase
        </p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className={`mt-2 text-sm font-medium ${theme.text.primary}`}>No hay archivos subidos</h3>
        <p className={`mt-1 text-sm ${theme.text.secondary}`}>
          {isSupabaseConfigured() ? 'Sube tu primer archivo para comenzar' : 'Configura Supabase para persistencia de datos'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-medium ${theme.text.primary}`}>
          Archivos Subidos ({files.length})
        </h3>
        <div className={`text-sm ${theme.text.secondary}`}>
          Ordenados por fecha de subida
        </div>
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.auditId}
            className={`${theme.card} border rounded-lg p-4 transition-colors`}
          >
            <div className="flex items-start space-x-4">
              {/* Icono del archivo */}
              <div className="flex-shrink-0">
                {getFileIcon(file.fileType)}
              </div>

              {/* Información del archivo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${theme.text.primary} truncate`}>
                    {file.originalName}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onDownload?.(file)}
                      className={`${theme.button.blue} text-sm font-medium`}
                    >
                      Descargar
                    </button>
                    <button
                      onClick={() => onShare?.(file)}
                      className={`${theme.button.green} text-sm font-medium`}
                    >
                      Compartir
                    </button>
                    {/* === 🕵️ BOTÓN LOGS FORENSES (SOLO DESARROLLO) === */}
                    {import.meta.env.DEV && (
                      <button
                        onClick={() => handleViewForensicLogs(file)}
                        className={`${theme.button.blue} text-sm font-medium flex items-center`}
                        title="Ver logs de acceso forenses (solo desarrollo)"
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Logs
                      </button>
                    )}
                    <button
                      onClick={() => onDelete?.(file)}
                      className={`${theme.button.red} text-sm font-medium`}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Metadatos */}
                <div className={`mt-2 grid grid-cols-2 gap-4 text-xs ${theme.text.secondary}`}>
                  <div>
                    <span className={`font-medium ${theme.text.primary}`}>Tamaño:</span> {formatFileSize(file.fileSize)}
                  </div>
                  <div>
                    <span className={`font-medium ${theme.text.primary}`}>Tipo:</span> {file.fileType.toUpperCase()}
                  </div>
                  <div>
                    <span className={`font-medium ${theme.text.primary}`}>Subido:</span> {formatDate(file.uploadedAt)}
                  </div>
                  <div>
                    <span className={`font-medium ${theme.text.primary}`}>ID Auditoría:</span> {file.auditId.slice(0, 8)}...
                  </div>
                </div>

                {/* Información de seguridad */}
                <div className={`mt-3 flex items-center space-x-4 text-xs ${theme.text.muted}`}>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Archivo cifrado
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-blue-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Auditado legalmente
                  </div>
                </div>
              </div>
            </div>
            
            {/* === 🕵️ VISOR DE LOGS FORENSES === */}
            {expandedForensicLogs === file.auditId && (
              <ForensicLogViewer
                linkId={`link-${file.auditId.split('-')[1]}`}
                fileName={file.originalName}
                forensicLogs={
                  realForensicLogs[file.auditId] || 
                  file.forensicLogs || 
                  generateMockForensicLogs(file.auditId)
                }
                darkMode={darkMode}
                isDevelopment={import.meta.env.DEV}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
