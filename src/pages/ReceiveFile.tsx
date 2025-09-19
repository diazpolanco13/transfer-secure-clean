import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  DocumentIcon, 
  ClockIcon,
  LockClosedIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
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

  const title = `${getFileTypeEmoji(fileType)} ${fileName} - Transfer Secure`;
  const description = senderMessage || 
    `Documento seguro (${formatFileSize(fileSize)}) - Haz clic para ver y descargar de forma segura`;

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

  const handleDownload = () => {
    if (!fileData || isDownloaded) return;
    
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Enlace No Válido</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Verifica que el enlace esté completo y no haya expirado.
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
        {/* Header confiable */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-3">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transfer Secure</h1>
              <p className="text-green-600 font-medium">Transferencia Segura de Documentos</p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <div className="flex items-center text-green-800">
              <LockClosedIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Conexión cifrada end-to-end • Descarga única • Auto-eliminación</span>
            </div>
          </div>
        </div>

        {/* Proceso de descifrado */}
        {isDecrypting && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <LockClosedIcon className="h-16 w-16 mx-auto text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Descifrado Seguro en Progreso</h2>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(Math.round(decryptionProgress), 100)}%` }}
                ></div>
              </div>
              <p className="text-gray-600">
                Verificando integridad y descifrando documento... {Math.min(Math.round(decryptionProgress), 100)}%
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
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
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
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getFileIcon()}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Documento Seguro Recibido
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
                      <div className="text-sm text-blue-800 font-medium mb-1">Mensaje del remitente:</div>
                      <p className="text-blue-700">{fileData.senderMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer de seguridad */}
            <div className="bg-green-50 border-t border-green-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                <div className="flex items-center justify-center text-green-800">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  <span>Privacidad Garantizada</span>
                </div>
                <div className="flex items-center justify-center text-green-800">
                  <LockClosedIcon className="h-4 w-4 mr-1" />
                  <span>Transferencia Segura</span>
                </div>
                <div className="flex items-center justify-center text-green-800">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  <span>Auto-Eliminación</span>
                </div>
              </div>
              <p className="text-xs text-green-600 text-center mt-2">
                Tus archivos se eliminan automáticamente después de la descarga
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiveFile;
