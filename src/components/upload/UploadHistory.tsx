import React from "react";

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

interface UploadHistoryProps {
  files: UploadedFile[];
  onDownload?: (file: UploadedFile) => void;
  onShare?: (file: UploadedFile) => void;
  onDelete?: (file: UploadedFile) => void;
  darkMode?: boolean;
}

export const UploadHistory: React.FC<UploadHistoryProps> = ({
  files,
  onDownload,
  onShare,
  onDelete,
  darkMode = true,
}) => {
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

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className={`mt-2 text-sm font-medium ${theme.text.primary}`}>No hay archivos subidos</h3>
        <p className={`mt-1 text-sm ${theme.text.secondary}`}>
          Sube tu primer archivo para comenzar
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
          </div>
        ))}
      </div>
    </div>
  );
};
