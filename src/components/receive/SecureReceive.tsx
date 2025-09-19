import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  DocumentIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
// import { MetaTags } from './MetaTags'; // Comentado para evitar errores

interface FileData {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  senderMessage?: string;
  expiresAt: string;
}

interface SecureReceiveProps {
  fileId: string;
}

export const SecureReceive: React.FC<SecureReceiveProps> = ({ fileId }) => {
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Simular datos del archivo basado en el ID
  useEffect(() => {
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
      uploadedAt: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
      senderMessage: 'Hola, te envío este documento importante que necesitas revisar. Es confidencial, por favor manéjalo con cuidado.',
      expiresAt: new Date(Date.now() + 6 * 24 * 3600000).toISOString(), // En 6 días
    };
    
    setFileData(mockFileData);
    setPreviewUrl(selectedType.previewUrl);
  }, [fileId]);

  // Simulación de descifrado
  useEffect(() => {
    if (isDecrypting) {
      const interval = setInterval(() => {
        setDecryptionProgress(prev => {
          if (prev >= 100) {
            setIsDecrypting(false);
            setIsDecrypted(true);
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15 + 5; // Progreso variable
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isDecrypting]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTimeUntilExpiry = () => {
    if (!fileData) return '';
    const now = new Date();
    const expiry = new Date(fileData.expiresAt);
    const diffHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 1) return `${diffDays} días`;
    if (diffHours > 1) return `${diffHours} horas`;
    return 'Menos de 1 hora';
  };

  const handleDownload = () => {
    if (isDownloaded) return;
    
    // Simular descarga
    setIsDownloaded(true);
    
    // En producción, aquí iría la descarga real
    const link = document.createElement('a');
    link.href = '#'; // URL real del archivo
    link.download = fileData?.originalName || 'archivo';
    // link.click(); // Descomenta para descarga real
    
    alert('🎉 Descarga iniciada! El enlace se ha desactivado permanentemente.');
  };

  const getFileIcon = () => {
    if (!fileData) return <DocumentIcon className="h-16 w-16 text-gray-400" />;
    
    if (fileData.fileType.includes('pdf')) {
      return <DocumentIcon className="h-16 w-16 text-red-500" />;
    }
    if (fileData.fileType.includes('image')) {
      return <DocumentIcon className="h-16 w-16 text-blue-500" />;
    }
    return <DocumentIcon className="h-16 w-16 text-gray-500" />;
  };

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Meta tags para previsualización en redes sociales */}
      {/* 
      {fileData && (
        <MetaTags
          fileName={fileData.originalName}
          fileType={fileData.fileType}
          fileSize={fileData.fileSize}
          previewUrl={previewUrl}
          senderMessage={fileData.senderMessage}
        />
      )}
      */}
      {/* Header de confianza */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Transfer Secure</h1>
              <p className="text-sm text-gray-600">Transferencia Segura de Documentos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de descifrado */}
        {isDecrypting && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <LockClosedIcon className="h-12 w-12 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Descifrando Documento Seguro
              </h2>
              <p className="text-gray-600 mb-6">
                Verificando integridad y descifrando con protocolo AES-256...
              </p>
              
              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(decryptionProgress, 100)}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-500">
                {Math.floor(Math.min(decryptionProgress, 100))}% completado
              </div>

              {/* Indicadores de seguridad durante descifrado */}
              <div className="mt-6 flex justify-center space-x-6 text-xs">
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Cifrado verificado
                </div>
                <div className="flex items-center text-blue-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Conexión segura
                </div>
                <div className="flex items-center text-purple-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Integridad confirmada
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal - Solo visible después del descifrado */}
        {isDecrypted && (
          <>
            {/* Previsualización automática del documento - PRIMERO */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">📄 Vista Previa del Documento</h2>
                <p className="text-gray-600">Revisa el contenido antes de descargar</p>
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
                          onLoad={(e) => {
                            const fallback = e.currentTarget.parentElement?.parentElement?.querySelector('.fallback-preview');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'none';
                            }
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.parentElement?.querySelector('.fallback-preview');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                        
                        {/* Overlay con metadatos informativos */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex items-end justify-center p-4">
                          <div className="text-center text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-3">
                              <p className="text-sm font-medium">📸 Vista previa limitada</p>
                              <p className="text-xs opacity-90">Descarga para ver en calidad completa</p>
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
                            <div className="text-gray-600">🔒 Cifrado</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fallback mejorado */}
                      <div className="fallback-preview" style={{ display: 'block' }}>
                        <div className="h-64 md:h-80 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center relative opacity-60">
                          <div className="text-center p-8">
                            <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">🖼️ {fileData.originalName}</h3>
                            <p className="text-blue-700 text-sm">Vista previa no disponible</p>
                          </div>
                          
                          {/* Metadatos para fallback */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-blue-600 font-semibold">Tipo</div>
                                <div className="text-gray-600">Imagen</div>
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
                                <div className="text-gray-600">🔒 Listo</div>
                              </div>
                            </div>
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
                            onLoad={() => {
                              const fallback = document.querySelector('.pdf-fallback');
                              if (fallback) {
                                (fallback as HTMLElement).style.display = 'none';
                              }
                            }}
                          />
                        </div>
                        
                        {/* Overlay con metadatos informativos para PDF */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex items-end justify-center p-4 pointer-events-none">
                          <div className="text-center text-white">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-3">
                              <p className="text-sm font-medium">📄 Vista previa limitada</p>
                              <p className="text-xs opacity-90">Descarga para acceso completo</p>
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
                        
                        {/* Fallback mejorado para PDF */}
                        <div className="pdf-fallback absolute inset-0 bg-gradient-to-br from-red-100 to-orange-200 rounded-lg flex items-center justify-center opacity-50">
                          <div className="text-center p-8">
                            <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-red-600" />
                            <h3 className="text-lg font-semibold text-red-900 mb-2">📄 {fileData.originalName}</h3>
                            <p className="text-red-700 text-sm">Vista previa no disponible</p>
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
                            <div className="text-gray-600">🔒 Cifrado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback para otros tipos de archivo - DESTACADO
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
                    Descargar Documento Completo
                  </button>
                ) : (
                  <div className="bg-gray-100 text-gray-500 px-8 py-3 rounded-lg font-semibold text-lg">
                    <CheckCircleIcon className="h-6 w-6 inline mr-2" />
                    Documento Descargado - Enlace Desactivado
                  </div>
                )}
                
                {isDownloaded && (
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ Descarga completada • Enlace bloqueado por seguridad
                  </p>
                )}
              </div>
            </div>

            {/* Información del archivo - COMPACTA */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {getFileIcon()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Documento Seguro Recibido
                    </h2>
                    <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Expira en {getTimeUntilExpiry()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Nombre del archivo:</span>
                      <p className="text-gray-900 font-medium">{fileData.originalName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tamaño:</span>
                      <p className="text-gray-900">{formatFileSize(fileData.fileSize)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Tipo:</span>
                      <p className="text-gray-900">{fileData.fileType.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Enviado:</span>
                      <p className="text-gray-900">{new Date(fileData.uploadedAt).toLocaleString('es-ES')}</p>
                    </div>
                  </div>

                  {/* Mensaje del remitente */}
                  {fileData.senderMessage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-900 mb-2">Mensaje del remitente:</h3>
                      <p className="text-blue-800 text-sm">{fileData.senderMessage}</p>
                    </div>
                  )}

                </div>
              </div>
            </div>


            {/* Garantías de seguridad */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">
                    🔒 Tu descarga está completamente protegida
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Cifrado Extremo a Extremo</div>
                        <div className="text-green-700">Protocolo AES-256 de grado militar</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Una Sola Descarga</div>
                        <div className="text-green-700">El enlace se desactiva automáticamente</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Auto-Eliminación</div>
                        <div className="text-green-700">Sin rastros en nuestros servidores</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advertencia de expiración */}
            {getTimeUntilExpiry().includes('hora') && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <div className="text-orange-800">
                    <span className="font-medium">¡Atención!</span> Este enlace expira en {getTimeUntilExpiry()}. 
                    Descarga el documento ahora para no perder el acceso.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
