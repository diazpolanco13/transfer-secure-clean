import { generateReactHelpers } from "@uploadthing/react";

import type { OurFileRouter } from "../server/uploadthing/core";

// Para desarrollo local sin UploadThing, usaremos un mock
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Función mock para desarrollo sin servidor UploadThing
export const mockUploadFiles = async (files: File[]): Promise<any[]> => {
  console.log("🔧 MOCK UPLOAD - Simulando subida de archivos:", files);

  // Simular delay de subida
  await new Promise(resolve => setTimeout(resolve, 2000));

  // En modo desarrollo, devolver los archivos como objetos File para procesamiento local
  return files;
};
