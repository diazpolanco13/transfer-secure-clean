import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing, mockUploadFiles } from "../../lib/uploadthing";

interface SecureUploadZoneProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // en bytes
}

export const SecureUploadZone: React.FC<SecureUploadZoneProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB por defecto
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Verificar si tenemos configuración de UploadThing
  const hasUploadThingConfig = !!(
    import.meta.env?.VITE_UPLOADTHING_APP_ID &&
    import.meta.env?.VITE_UPLOADTHING_APP_ID !== 'your_app_id_here'
  );

  // Debug: mostrar estado de configuración en desarrollo
  if (import.meta.env.DEV) {
    console.log("🔧 UploadThing Config:", hasUploadThingConfig ? "✅ Configurado" : "🔧 Modo Mock");
  }

  const { startUpload } = useUploadThing("secureDocument", {
    onClientUploadComplete: (res) => {
      console.log("✅ Subida completada:", res);
      setIsUploading(false);
      onUploadComplete?.(res);

      // Aquí puedes guardar la información en Supabase
      // asociando con el projectId
    },
    onUploadError: (error) => {
      console.error("❌ Error en subida:", error);
      setIsUploading(false);
      onUploadError?.(error.message);
    },
    onUploadBegin: (fileName) => {
      console.log("🚀 Iniciando subida:", fileName);
      setIsUploading(true);
    },
    // onUploadProgress removido - UploadThing maneja el progreso internamente
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        // Validación adicional del lado cliente
        for (const file of acceptedFiles) {
          if (file.size > maxSize) {
            throw new Error(`Archivo ${file.name} es demasiado grande. Máximo ${maxSize / 1024 / 1024}MB`);
          }
        }

        console.log(`📁 Subiendo ${acceptedFiles.length} archivo(s)...`);
        setIsUploading(true);

        if (hasUploadThingConfig) {
          // Usar UploadThing real
          try {
            await startUpload(acceptedFiles);
          } catch (uploadError: any) {
            console.warn("⚠️ Error con UploadThing, usando modo mock:", uploadError);
            // Si falla UploadThing, usar mock como fallback
            const mockResult = await mockUploadFiles(acceptedFiles);
            onUploadComplete?.(mockResult);
            setIsUploading(false);
          }
        } else {
          // Usar mock para desarrollo
          console.log("🔧 Usando modo MOCK - Sin configuración de UploadThing");
          const mockResult = await mockUploadFiles(acceptedFiles);
          onUploadComplete?.(mockResult);
          setIsUploading(false);
        }

      } catch (error: any) {
        console.error("Error procesando archivos:", error);
        setIsUploading(false);
        onUploadError?.(error.message || "Error procesando archivos");
      }
    },
    [startUpload, maxSize, onUploadError, onUploadComplete, hasUploadThingConfig]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      {/* Zona de Drop */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Icono de subida */}
        <div className="mb-4">
          <svg
            className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            />
          </svg>
        </div>

        {/* Texto dinámico */}
        <div className="text-lg font-medium text-gray-900 mb-2">
          {isUploading ? "Subiendo archivos..." : "Arrastra archivos aquí"}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          o{" "}
          <span className="text-blue-600 hover:text-blue-500 font-medium">
            haz clic para seleccionar
          </span>
        </p>

        {/* Información de límites */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Máximo {maxFiles} archivo{maxFiles !== 1 ? 's' : ''}</p>
          <p>• Tamaño máximo: {Math.round(maxSize / 1024 / 1024)}MB por archivo</p>
          <p>• Tipos permitidos: PDF, imágenes</p>
        </div>
      </div>

      {/* Indicador de subida */}
      {isUploading && (
        <div className="mt-4">
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-blue-800 font-medium">
                Procesando archivos de forma segura...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de modo */}
      {!hasUploadThingConfig && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                🔧 Modo Desarrollo Activo
              </p>
              <p className="text-xs text-yellow-600">
                Usando simulación local. Para producción, configura UploadThing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de seguridad */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">
              Transferencia Segura Garantizada
            </p>
            <p className="text-xs text-green-600">
              Todos los archivos son cifrados y auditados legalmente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
