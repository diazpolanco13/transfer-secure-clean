// 🐛 SCRIPT DE DIAGNÓSTICO PARA PRODUCCIÓN
// Ejecutar en la consola del navegador en producción

(function() {
  console.log('🔍 DIAGNÓSTICO DE PRODUCCIÓN - Transfer Secure');
  console.log('='.repeat(60));

  // 1. Verificar variables de entorno
  console.log('📋 VARIABLES DE ENTORNO:');
  console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL || '❌ NO CONFIGURADO');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');

  // 2. Verificar configuración de Supabase
  console.log('\n🗄️ CONFIGURACIÓN SUPABASE:');
  try {
    // Intentar importar la función de configuración
    import('./src/lib/supabase.js').then(module => {
      const { isSupabaseConfigured } = module;
      console.log('isSupabaseConfigured():', isSupabaseConfigured());

      if (!isSupabaseConfigured()) {
        console.log('❌ PROBLEMA: Supabase no está configurado correctamente');
        console.log('💡 SOLUCIÓN: Configurar variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel');
      } else {
        console.log('✅ Supabase está configurado correctamente');
      }
    }).catch(err => {
      console.log('❌ Error importando configuración de Supabase:', err);
    });
  } catch (error) {
    console.log('❌ Error accediendo a configuración:', error);
  }

  // 3. Verificar conectividad de red
  console.log('\n🌐 CONECTIVIDAD:');
  fetch('https://ipapi.co/json/')
    .then(response => {
      if (response.ok) {
        console.log('✅ API externa accesible');
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(data => {
      console.log('📍 Ubicación detectada:', data.city, data.country_name);
    })
    .catch(error => {
      console.log('❌ Error de conectividad:', error.message);
    });

  // 4. Verificar localStorage
  console.log('\n💾 LOCAL STORAGE:');
  try {
    const testKey = 'transfer-secure-test';
    localStorage.setItem(testKey, 'working');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (retrieved === 'working') {
      console.log('✅ localStorage funciona correctamente');
    } else {
      console.log('❌ localStorage no funciona');
    }
  } catch (error) {
    console.log('❌ Error con localStorage:', error.message);
  }

  // 5. Información del navegador
  console.log('\n🖥️ INFORMACIÓN DEL NAVEGADOR:');
  console.log('User Agent:', navigator.userAgent.substring(0, 100) + '...');
  console.log('URL actual:', window.location.href);
  console.log('Modo desarrollo:', import.meta.env?.DEV ? '✅' : '❌ (Producción)');

  console.log('\n' + '='.repeat(60));
  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('1. Verificar variables de entorno en Vercel');
  console.log('2. Si faltan, configurar: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.log('3. Redeploy desde Vercel');
  console.log('4. Probar nuevamente');

  console.log('\n📞 Si necesitas ayuda, comparte los resultados de arriba.');
})();
