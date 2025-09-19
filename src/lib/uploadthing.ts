import { generateReactHelpers } from "@uploadthing/react";

import type { OurFileRouter } from "../server/uploadthing/core";

// Para desarrollo local sin UploadThing, usaremos un mock
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Función mock para desarrollo sin servidor UploadThing
export const mockUploadFiles = async (files: File[]): Promise<any[]> => {
  console.log("🔧 MOCK UPLOAD - Simulando subida de archivos:", files);

  // Simular delay de subida
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simular respuesta de UploadThing
  return files.map((file, index) => ({
    name: file.name,
    size: file.size,
    key: `mock-${Date.now()}-${index}`,
    url: `https://mock-storage.example.com/${file.name}`,
    customId: `audit-${Date.now()}-${index}`,
    serverData: {
      auditId: `audit-${Date.now()}-${index}`,
      secureUrl: `https://mock-storage.example.com/${file.name}`,
      uploadedAt: new Date().toISOString(),
    }
  }));
};
