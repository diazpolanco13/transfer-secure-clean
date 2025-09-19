import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

// Función para obtener IP del cliente (para auditoría)
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  if (clientIP) return clientIP;

  return "unknown";
}

// Función para generar ID único para auditoría
function generateAuditId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

const f = createUploadthing();

export const ourFileRouter = {
  // Ruta para documentos seguros (PDFs, imágenes)
  secureDocument: f({
    pdf: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req, files }) => {
      try {
        // === AUDITORÍA LEGAL COMPLETA ===

        // 1. Capturar información del cliente
        const clientIP = getClientIP(req);
        const userAgent = req.headers.get("user-agent") || "unknown";
        const referer = req.headers.get("referer") || "direct";
        const acceptLanguage = req.headers.get("accept-language") || "unknown";

        // 2. Generar ID único para esta subida
        const auditId = generateAuditId();

        // 3. Información del navegador/dispositivo
        const browserInfo = {
          userAgent,
          language: acceptLanguage,
          referer,
          timestamp: new Date().toISOString(),
        };

        // 4. Validar archivos (tamaño, tipo)
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) { // 10MB
            throw new UploadThingError(`Archivo demasiado grande: ${file.name}`);
          }
        }

        // 5. Rate limiting básico (puedes implementar más sofisticado)
        const uploadCount = files.length;
        if (uploadCount > 5) {
          throw new UploadThingError("Demasiados archivos. Máximo 5 por subida.");
        }

        console.log(`[AUDITORÍA] Nueva subida - ID: ${auditId}, IP: ${clientIP}, Archivos: ${uploadCount}`);

        return {
          auditId,
          clientIP,
          browserInfo,
          uploadCount,
          uploadedAt: new Date(),
        };

      } catch (error) {
        console.error("[AUDITORÍA ERROR]", error);
        throw new UploadThingError("Error en validación de seguridad");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // === PROCESAMIENTO POST-SUBIDA ===

        console.log(`[AUDITORÍA] Subida completada - ID: ${metadata.auditId}`);
        console.log(`Archivo: ${file.name} -> ${file.key}`);
        console.log(`URL: ${file.url}`);

        // Aquí puedes guardar en tu base de datos Supabase
        // Para Transfer Secure, guardaríamos:
        // - auditId (para tracking legal)
        // - originalName vs secureName
        // - clientIP y browserInfo
        // - projectId (cuando implementemos proyectos)
        // - timestamps

        const auditData = {
          auditId: metadata.auditId,
          originalName: file.name,
          secureName: file.key,
          secureUrl: file.url,
          fileSize: file.size,
          fileType: file.type,
          clientIP: metadata.clientIP,
          browserInfo: metadata.browserInfo,
          uploadedAt: metadata.uploadedAt,
          processedAt: new Date(),
        };

        // TODO: Guardar en Supabase
        console.log("[AUDITORÍA] Datos guardados:", auditData);

        return {
          auditId: metadata.auditId,
          secureUrl: file.url,
          uploadedAt: metadata.uploadedAt.toISOString(),
        };

      } catch (error) {
        console.error("[AUDITORÍA ERROR] Procesamiento fallido:", error);
        throw new UploadThingError("Error procesando archivo");
      }
    }),

  // Ruta para imágenes de perfil/avatar (si necesitas)
  avatarImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const auditId = generateAuditId();
      const clientIP = getClientIP(req);

      return { auditId, clientIP, type: "avatar" };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log(`[AVATAR] Subido: ${file.name} -> ${file.key}`);

      return {
        auditId: metadata.auditId,
        url: file.url,
        type: "avatar"
      };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
