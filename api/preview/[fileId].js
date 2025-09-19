// 🎯 API ROUTE PARA PREVISUALIZACIÓN EN REDES SOCIALES
// Genera meta tags Open Graph dinámicos para crawlers

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para serverless function
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validar configuración
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [API] Variables de entorno de Supabase no configuradas');
  console.error('🔧 Configurar en Vercel: SUPABASE_URL y SUPABASE_ANON_KEY');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default async function handler(req, res) {
  try {
    // Verificar configuración de Supabase
    if (!supabase) {
      console.error('❌ [API] Supabase no configurado');
      return generateErrorPage(res, 'Servicio temporalmente no disponible');
    }

    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID requerido' });
    }

    console.log('🔍 [API] Generando preview para:', fileId);

    // Buscar el enlace compartido
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select('*')
      .eq('link_id', fileId)
      .single();

    if (linkError || !shareLink) {
      console.log('❌ [API] Enlace no encontrado:', fileId);
      return generateErrorPage(res, 'Enlace no válido');
    }

    // Verificar si el enlace ha expirado
    const now = new Date();
    const expiresAt = new Date(shareLink.expires_at);

    if (now > expiresAt) {
      console.log('⏰ [API] Enlace expirado:', fileId);
      return generateErrorPage(res, 'Enlace expirado');
    }

    // Buscar el archivo usando el audit_id
    const { data: file, error: fileError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('audit_id', shareLink.audit_id)
      .single();

    if (fileError || !file) {
      console.log('❌ [API] Archivo no encontrado:', shareLink.audit_id);
      return generateErrorPage(res, 'Archivo no encontrado');
    }

    console.log('✅ [API] Archivo encontrado:', file.original_name);

    // Generar meta tags dinámicos
    const metaTags = generateMetaTags(file, shareLink);

    // Generar HTML completo con meta tags
    const html = generateHTML(metaTags);

    // Responder con HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (error) {
    console.error('❌ [API] Error interno:', error);
    return generateErrorPage(res, 'Error interno del servidor');
  }
}

// 🏷️ GENERAR META TAGS OPEN GRAPH
function generateMetaTags(file, shareLink) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173';

  const fileUrl = `${baseUrl}/receive/${shareLink.link_id}`;

  // Información del archivo
  const fileName = file.original_name;
  const fileSize = formatFileSize(file.file_size);
  const fileType = file.file_type;

  // Título y descripción
  const title = `📎 ${fileName} - Archivo Compartido`;
  const description = shareLink.custom_message ||
    `Archivo compartido (${fileSize}) - Transfer Secure`;

  // URL de la imagen
  let imageUrl;
  if (fileType.includes('image')) {
    // Si es imagen, usar la imagen real
    imageUrl = file.secure_url;
  } else {
    // Si no es imagen, usar placeholder elegante
    const encodedFileName = encodeURIComponent(fileName);
    imageUrl = `https://via.placeholder.com/1200x630/2563eb/ffffff?text=${encodedFileName}`;
  }

  return {
    title,
    description,
    url: fileUrl,
    image: imageUrl,
    siteName: 'Transfer Secure',
    type: 'website',
    locale: 'es_ES'
  };
}

// 🎨 GENERAR HTML COMPLETO CON META TAGS
function generateHTML(meta) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Título -->
  <title>${meta.title}</title>

  <!-- Meta descripción -->
  <meta name="description" content="${meta.description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${meta.type}">
  <meta property="og:url" content="${meta.url}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:image" content="${meta.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="${meta.siteName}">
  <meta property="og:locale" content="${meta.locale}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${meta.url}">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${meta.image}">

  <!-- Favicon dinámico -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📎</text></svg>">

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      color: #1e293b;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .description {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 24px;
    }
    .button {
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      display: inline-block;
      transition: background-color 0.2s;
    }
    .button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📎</div>
    <h1 class="title">${meta.title}</h1>
    <p class="description">${meta.description}</p>
    <a href="${meta.url}" class="button">Ver Archivo</a>
  </div>
</body>
</html>`;
}

// ❌ PÁGINA DE ERROR
function generateErrorPage(res, message) {
  const errorHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Transfer Secure</title>
  <meta name="description" content="Enlace no válido o expirado">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #fef2f2;
      color: #dc2626;
      text-align: center;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Error</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(errorHtml);
}

// 🧮 FORMATEAR TAMAÑO DE ARCHIVO
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
