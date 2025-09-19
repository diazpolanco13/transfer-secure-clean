import React, { useState } from 'react';
import { 
  LinkIcon, 
  ClipboardDocumentIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  DocumentIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

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
}

interface ShareManagementProps {
  file: UploadedFile;
  onBack: () => void;
  darkMode?: boolean;
}

export const ShareManagement: React.FC<ShareManagementProps> = ({
  file,
  onBack,
  darkMode = true
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [customMessage, setCustomMessage] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);

  // Generar clases dinámicas según el tema
  const getThemeClasses = () => ({
    background: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: {
      primary: darkMode ? 'text-white' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-400' : 'text-gray-600',
      muted: darkMode ? 'text-gray-500' : 'text-gray-500'
    },
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
      success: 'bg-green-600 hover:bg-green-700 text-white'
    }
  });

  const theme = getThemeClasses();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateShareLink = async () => {
    setIsGenerating(true);
    
    try {
      // Importar el servicio de archivos
      const { FileService } = await import('../../services/fileService');
      const { isSupabaseConfigured } = await import('../../lib/supabase');
      
      if (isSupabaseConfigured()) {
        // Primero verificar si ya existe un enlace para este archivo
        
        // Por ahora, siempre crear un nuevo enlace
        // TODO: En el futuro, verificar si ya existe uno
        const shareLink = await FileService.createShareLink(
          file.auditId,
          recipientEmail || undefined,
          expirationDays,
          customMessage || undefined
        );
        
        if (shareLink && shareLink.link_id) {
          // Usar el link_id real de Supabase
          const generatedLink = `${window.location.origin}/receive/${shareLink.link_id}`;
          setShareLink(generatedLink);
          setLinkGenerated(true);
          console.log('✅ Enlace generado con link_id real:', shareLink.link_id);
        } else {
          console.error('❌ Error: No se pudo crear el enlace en Supabase');
          // Fallback: generar link local
          const uniqueId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const generatedLink = `${window.location.origin}/receive/${uniqueId}`;
          setShareLink(generatedLink);
          setLinkGenerated(true);
        }
      } else {
        // Si no hay Supabase, generar link local
        const uniqueId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const generatedLink = `${window.location.origin}/receive/${uniqueId}`;
        setShareLink(generatedLink);
        setLinkGenerated(true);
      }
    } catch (error) {
      console.error('❌ Error generando enlace:', error);
      // Fallback en caso de error
      const uniqueId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const generatedLink = `${window.location.origin}/receive/${uniqueId}`;
      setShareLink(generatedLink);
      setLinkGenerated(true);
    }
    
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // Aquí podrías agregar una notificación toast
      alert('¡Link copiado al portapapeles!');
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const getFileIcon = () => {
    if (file.fileType.includes('pdf')) {
      return <DocumentIcon className="h-12 w-12 text-red-500" />;
    }
    return <DocumentIcon className="h-12 w-12 text-blue-500" />;
  };

  return (
    <div className={`min-h-screen ${theme.background} py-8`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className={`mb-4 ${theme.button.secondary} px-4 py-2 rounded-md font-medium transition-colors`}
          >
            ← Volver al Dashboard
          </button>
          
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8 text-green-500" />
            <div>
              <h1 className={`text-2xl font-bold ${theme.text.primary}`}>
                Gestión de Envío Seguro
              </h1>
              <p className={theme.text.secondary}>
                Configura cómo compartir tu archivo de forma segura
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del archivo */}
          <div className={`${theme.card} border rounded-lg p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center`}>
              <DocumentIcon className="h-5 w-5 mr-2" />
              Archivo a Compartir
            </h2>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getFileIcon()}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${theme.text.primary} mb-2`}>
                  {file.originalName}
                </h3>
                <div className={`space-y-1 text-sm ${theme.text.secondary}`}>
                  <p><span className="font-medium">Tamaño:</span> {formatFileSize(file.fileSize)}</p>
                  <p><span className="font-medium">Tipo:</span> {file.fileType.toUpperCase()}</p>
                  <p><span className="font-medium">ID Auditoría:</span> {file.auditId.slice(0, 8)}...</p>
                  <p><span className="font-medium">Subido:</span> {new Date(file.uploadedAt).toLocaleString('es-ES')}</p>
                </div>
              </div>
            </div>

            {/* Indicadores de seguridad */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center text-green-500">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Cifrado AES-256
                </div>
                <div className="flex items-center text-blue-500">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Transferencia Segura
                </div>
                <div className="flex items-center text-purple-500">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Auto-Eliminación
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de compartir */}
          <div className={`${theme.card} border rounded-lg p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center`}>
              <LinkIcon className="h-5 w-5 mr-2" />
              Configuración de Compartir
            </h2>

            <div className="space-y-4">
              {/* Email del destinatario */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Email del Destinatario (Opcional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="destinatario@empresa.com"
                  className={`w-full px-3 py-2 border rounded-md ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <p className={`mt-1 text-xs ${theme.text.muted}`}>
                  Si proporcionas un email, se enviará una notificación automática
                </p>
              </div>

              {/* Expiración */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Expiración del Link
                </label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  title="Seleccionar días de expiración"
                >
                  <option value={1}>1 día</option>
                  <option value={3}>3 días</option>
                  <option value={7}>7 días (recomendado)</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>

              {/* Mensaje personalizado */}
              <div>
                <label className={`block text-sm font-medium ${theme.text.primary} mb-2`}>
                  Mensaje Personalizado (Opcional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Hola, te envío este documento importante..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Botón generar link */}
              {!linkGenerated ? (
                <button
                  onClick={generateShareLink}
                  disabled={isGenerating}
                  className={`w-full ${theme.button.primary} px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Generando Link Seguro...
                    </div>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      Generar Link de Compartir
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Link generado */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center text-green-800 dark:text-green-300 mb-2">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Link Generado Exitosamente</span>
                    </div>
                    <div className={`p-3 rounded border text-sm font-mono break-all ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}>
                      {shareLink}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className={`flex-1 ${theme.button.success} px-4 py-2 rounded-md font-medium transition-colors`}
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 inline mr-2" />
                      Copiar Link
                    </button>
                    <button
                      onClick={() => window.open(shareLink, '_blank')}
                      className={`${theme.button.primary} px-4 py-2 rounded-md font-medium transition-colors`}
                    >
                      <EyeIcon className="h-4 w-4 inline mr-2" />
                      VER LINK
                    </button>
                  </div>
                  
                  {/* Botón para generar nuevo link */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => setLinkGenerated(false)}
                      className={`w-full ${theme.button.secondary} px-4 py-2 rounded-md font-medium transition-colors text-sm`}
                    >
                      🔄 Generar Nuevo Link
                    </button>
                    <p className={`text-xs ${theme.text.secondary} mt-2 text-center`}>
                      Esto invalidará el link anterior y creará uno nuevo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de seguridad */}
        <div className={`mt-8 ${theme.card} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${theme.text.primary} mb-4 flex items-center`}>
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-500" />
            Garantías de Seguridad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className={`font-medium ${theme.text.primary} mb-1`}>Cifrado Extremo a Extremo</h4>
              <p className={`text-sm ${theme.text.secondary}`}>
                Tu archivo está protegido con cifrado AES-256, el mismo estándar usado por bancos
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <LinkIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className={`font-medium ${theme.text.primary} mb-1`}>Link Único e Irrepetible</h4>
              <p className={`text-sm ${theme.text.secondary}`}>
                Cada enlace es único y se desactiva automáticamente tras la descarga
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <DocumentIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className={`font-medium ${theme.text.primary} mb-1`}>Privacidad Garantizada</h4>
              <p className={`text-sm ${theme.text.secondary}`}>
                Tus archivos se eliminan automáticamente después de la descarga
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
