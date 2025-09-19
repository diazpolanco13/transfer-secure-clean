import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheckIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
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
  
  // === 🔍 ESTADOS PARA BÚSQUEDA Y FILTROS ===
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image'>('all');
  
  // === 📄 ESTADOS PARA PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // === 🔍 LÓGICA DE FILTRADO Y BÚSQUEDA ===
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(file => 
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.auditId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por tipo
    if (filterType !== 'all') {
      result = result.filter(file => {
        const fileType = file.fileType.toLowerCase();
        const fileName = file.originalName.toLowerCase();
        
        if (filterType === 'pdf') {
          return fileType.includes('pdf') || fileName.endsWith('.pdf');
        }
        if (filterType === 'image') {
          return fileType.includes('image') || 
                 fileType.includes('png') || 
                 fileType.includes('jpg') || 
                 fileType.includes('jpeg') || 
                 fileType.includes('gif') || 
                 fileType.includes('webp') ||
                 fileName.match(/\.(png|jpg|jpeg|gif|webp)$/);
        }
        return true;
      });
    }
    
    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [files, searchTerm, filterType, sortBy, sortOrder]);

  // === 📄 LÓGICA DE PAGINACIÓN ===
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortBy, sortOrder]);
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

  const getFileIcon = (fileType: string, fileName: string) => {
    const type = fileType.toLowerCase();
    const name = fileName.toLowerCase();
    
    // Verificar si es PDF
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <DocumentIcon className="h-6 w-6 text-red-500" />;
    }
    
    // Verificar si es imagen
    if (type.includes('image') || 
        type.includes('png') || 
        type.includes('jpg') || 
        type.includes('jpeg') || 
        type.includes('gif') || 
        type.includes('webp') ||
        name.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />;
    }
    
    // Por defecto, usar icono de documento
    return <DocumentIcon className="h-6 w-6 text-gray-500" />;
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

  if (filteredAndSortedFiles.length === 0) {
    return (
      <div className="space-y-6">
        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className={`mt-2 text-sm font-medium ${theme.text.primary}`}>No se encontraron archivos</h3>
          <p className={`mt-1 text-sm ${theme.text.secondary}`}>
            Intenta ajustar los filtros de búsqueda
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }}
            className={`mt-4 px-4 py-2 text-sm font-medium rounded-lg ${theme.button.blue}`}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* === 🎛️ CONTROLES DE BÚSQUEDA Y FILTROS === */}
      <div className="space-y-4">
        {/* Header con contador */}
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${theme.text.primary}`}>
            Archivos Subidos ({filteredAndSortedFiles.length})
          </h3>
          <div className={`text-sm ${theme.text.secondary}`}>
            Página {currentPage} de {totalPages}
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            title="Filtrar por tipo de archivo"
            className={`px-3 py-2 border rounded-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="all">Todos los tipos</option>
            <option value="pdf">Solo PDFs</option>
            <option value="image">Solo Imágenes</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            title="Ordenar archivos"
            className={`px-3 py-2 border rounded-lg ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="date-desc">Más reciente</option>
            <option value="date-asc">Más antiguo</option>
            <option value="name-asc">Nombre A-Z</option>
            <option value="name-desc">Nombre Z-A</option>
            <option value="size-desc">Mayor tamaño</option>
            <option value="size-asc">Menor tamaño</option>
          </select>
        </div>
      </div>

      {/* === 📋 VISTA DESKTOP - TABLA === */}
      <div className="hidden lg:block">
        <div className={`${theme.card} border rounded-lg overflow-hidden`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>
                  Archivo
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>
                  Detalles
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>
                  Estado
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium ${theme.text.secondary} uppercase tracking-wider`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedFiles.map((file) => (
                <React.Fragment key={file.auditId}>
                  <tr className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.fileType, file.originalName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${theme.text.primary} truncate max-w-xs`}>
                            {file.originalName}
                          </p>
                          <p className={`text-xs ${theme.text.secondary}`}>
                            ID: {file.auditId.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className={`text-xs ${theme.text.secondary}`}>
                          <span className="font-medium">Tamaño:</span> {formatFileSize(file.fileSize)}
                        </p>
                        <p className={`text-xs ${theme.text.secondary}`}>
                          <span className="font-medium">Subido:</span> {formatDate(file.uploadedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-green-400 rounded-full mr-1"></div>
                          <span className={`text-xs ${theme.text.secondary}`}>Cifrado</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-blue-400 rounded-full mr-1"></div>
                          <span className={`text-xs ${theme.text.secondary}`}>Auditado</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onDownload?.(file)}
                          className={`${theme.button.blue} text-xs px-2 py-1 rounded hover:underline`}
                          title="Descargar archivo"
                        >
                          Descargar
                        </button>
                        <button
                          onClick={() => onShare?.(file)}
                          className={`${theme.button.green} text-xs px-2 py-1 rounded hover:underline`}
                          title="Compartir archivo"
                        >
                          Compartir
                        </button>
                        {import.meta.env.DEV && (
                          <button
                            onClick={() => handleViewForensicLogs(file)}
                            className={`${theme.button.blue} text-xs px-2 py-1 rounded hover:underline flex items-center`}
                            title="Ver logs forenses"
                          >
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            Logs
                          </button>
                        )}
                        <button
                          onClick={() => onDelete?.(file)}
                          className={`${theme.button.red} text-xs px-2 py-1 rounded hover:underline`}
                          title="Eliminar archivo"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedForensicLogs === file.auditId && (
                    <tr>
                      <td colSpan={4} className={`px-4 py-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === 📱 VISTA MÓVIL - CARDS === */}
      <div className="lg:hidden space-y-3">
        {paginatedFiles.map((file) => (
          <div key={file.auditId} className={`${theme.card} border rounded-lg p-4`}>
            {/* Header del card */}
            <div className="flex items-start space-x-3 mb-3">
              <div className="flex-shrink-0">
                {getFileIcon(file.fileType, file.originalName)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${theme.text.primary} truncate`}>
                  {file.originalName}
                </h4>
                <p className={`text-xs ${theme.text.secondary} mt-1`}>
                  ID: {file.auditId.slice(-8)}
                </p>
              </div>
            </div>

            {/* Detalles del archivo */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <span className={`font-medium ${theme.text.primary}`}>Tamaño:</span>
                <p className={theme.text.secondary}>{formatFileSize(file.fileSize)}</p>
              </div>
              <div>
                <span className={`font-medium ${theme.text.primary}`}>Subido:</span>
                <p className={theme.text.secondary}>{formatDate(file.uploadedAt)}</p>
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                <span className={`text-xs ${theme.text.secondary}`}>Cifrado</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-400 rounded-full mr-2"></div>
                <span className={`text-xs ${theme.text.secondary}`}>Auditado</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onDownload?.(file)}
                className={`${theme.button.blue} text-xs px-3 py-1 rounded-md hover:underline flex-1 sm:flex-none`}
                title="Descargar archivo"
              >
                Descargar
              </button>
              <button
                onClick={() => onShare?.(file)}
                className={`${theme.button.green} text-xs px-3 py-1 rounded-md hover:underline flex-1 sm:flex-none`}
                title="Compartir archivo"
              >
                Compartir
              </button>
              {import.meta.env.DEV && (
                <button
                  onClick={() => handleViewForensicLogs(file)}
                  className={`${theme.button.blue} text-xs px-3 py-1 rounded-md hover:underline flex items-center justify-center flex-1 sm:flex-none`}
                  title="Ver logs forenses"
                >
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Logs
                </button>
              )}
              <button
                onClick={() => onDelete?.(file)}
                className={`${theme.button.red} text-xs px-3 py-1 rounded-md hover:underline flex-1 sm:flex-none`}
                title="Eliminar archivo"
              >
                Eliminar
              </button>
            </div>

            {/* Logs forenses expandibles */}
            {expandedForensicLogs === file.auditId && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === 📄 PAGINADOR RESPONSIVE === */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Información de resultados */}
          <div className={`text-sm ${theme.text.secondary} order-2 sm:order-1`}>
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedFiles.length)} de {filteredAndSortedFiles.length} archivos
          </div>
          
          {/* Controles de navegación */}
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              title="Página anterior"
              className={`p-2 rounded-lg border ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            {/* Números de página - responsive */}
            <div className="hidden sm:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentPage === pageNum
                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        : darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            {/* Indicador de página en móvil */}
            <div className={`sm:hidden px-3 py-1 text-sm ${theme.text.secondary}`}>
              {currentPage} / {totalPages}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              title="Página siguiente"
              className={`p-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
