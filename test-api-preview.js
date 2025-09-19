// 🧪 SCRIPT PARA PROBAR LAS API ROUTES DE PREVISUALIZACIÓN
// Ejecutar con: node test-api-preview.js

const https = require('https');

// Configuración de prueba
const TEST_FILE_ID = 'test-link-123'; // Cambiar por un ID real de tu base de datos
const BASE_URL = 'https://tu-dominio.vercel.app'; // Cambiar por tu URL real

// User agents de diferentes plataformas para simular crawlers
const CRAWLER_USER_AGENTS = {
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitter: 'Twitterbot/1.0',
  whatsapp: 'WhatsApp/2.19.81 A',
  telegram: 'TelegramBot (like TwitterBot)',
  linkedin: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)',
  discord: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  slack: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'
};

// Función para hacer request HTTP
function makeRequest(url, userAgent) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
          userAgent: userAgent
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Función principal de prueba
async function testPreviewAPI() {
  console.log('🧪 INICIANDO PRUEBA DE API ROUTES DE PREVISUALIZACIÓN\n');
  console.log('=' .repeat(60));

  const results = [];

  // 1. Probar con user agent normal (usuario real)
  console.log('👤 Probando con usuario normal...');
  try {
    const normalResult = await makeRequest(
      `${BASE_URL}/receive/${TEST_FILE_ID}`,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    console.log(`✅ Status: ${normalResult.status}`);
    console.log(`📄 Content-Type: ${normalResult.headers['content-type']}`);
    console.log(`📏 Content-Length: ${normalResult.data.length} caracteres\n`);

    results.push({ platform: 'Usuario Normal', result: normalResult });

  } catch (error) {
    console.log(`❌ Error con usuario normal: ${error.message}\n`);
  }

  // 2. Probar con diferentes crawlers
  for (const [platform, userAgent] of Object.entries(CRAWLER_USER_AGENTS)) {
    console.log(`🤖 Probando con ${platform}...`);

    try {
      const crawlerResult = await makeRequest(
        `${BASE_URL}/receive/${TEST_FILE_ID}`,
        userAgent
      );

      console.log(`✅ Status: ${crawlerResult.status}`);
      console.log(`📄 Content-Type: ${crawlerResult.headers['content-type']}`);
      console.log(`📏 Content-Length: ${crawlerResult.data.length} caracteres`);

      // Verificar si contiene meta tags
      const hasMetaTags = crawlerResult.data.includes('og:title') ||
                         crawlerResult.data.includes('og:image') ||
                         crawlerResult.data.includes('twitter:card');

      console.log(`🏷️  Meta tags Open Graph: ${hasMetaTags ? '✅' : '❌'}`);
      console.log('');

      results.push({ platform, result: crawlerResult, hasMetaTags });

    } catch (error) {
      console.log(`❌ Error con ${platform}: ${error.message}\n`);
    }

    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 3. Resumen de resultados
  console.log('=' .repeat(60));
  console.log('📊 RESUMEN DE RESULTADOS:');
  console.log('');

  results.forEach(({ platform, result, hasMetaTags }) => {
    const status = result.status === 200 ? '✅' : '❌';
    const metaStatus = hasMetaTags ? '✅ Meta tags' : '❌ Sin meta tags';
    console.log(`${status} ${platform}: ${result.status} - ${metaStatus}`);
  });

  console.log('');
  console.log('🎯 INTERPRETACIÓN:');
  console.log('- Usuario Normal debe recibir HTML de la aplicación React');
  console.log('- Crawlers deben recibir HTML con meta tags Open Graph');
  console.log('- Si todos los crawlers muestran "✅ Meta tags", ¡funciona perfecto!');

  console.log('\n' + '=' .repeat(60));
  console.log('✨ PRUEBA COMPLETADA');
}

// Ejecutar prueba
testPreviewAPI().catch(console.error);
