// 🚫 MIDDLEWARE PARA BLOQUEAR AUTENTICACIÓN EN RUTAS PÚBLICAS
// Este middleware asegura que las rutas de compartir sean públicas

export default function middleware(req) {
  const { pathname } = req.nextUrl;

  // 🟢 RUTAS QUE DEBEN SER PÚBLICAS (sin autenticación)
  const publicPaths = [
    /^\/receive\/.*/,      // /receive/file-id (enlaces compartidos)
    /^\/api\/preview\/.*/, // /api/preview/file-id (meta tags)
    /^\/api\/receive\/.*/, // /api/receive/file-id (API receive)
    /^\/$/,                // Homepage
    /^\/index\.html$/,     // Index HTML
  ];

  // Verificar si la ruta es pública
  const isPublicPath = publicPaths.some(pattern => pattern.test(pathname));

  if (isPublicPath) {
    console.log(`🟢 [MIDDLEWARE] Ruta pública permitida: ${pathname}`);

    // Asegurar headers para acceso público
    const response = new Response();

    // Headers de CORS para acceso público
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');

    // Headers de cache para enlaces compartidos
    if (pathname.startsWith('/receive/')) {
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutos
    }

    return response;
  }

  // 🔒 Para rutas protegidas, continuar normalmente
  console.log(`🔒 [MIDDLEWARE] Ruta protegida: ${pathname}`);
  return null;
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
