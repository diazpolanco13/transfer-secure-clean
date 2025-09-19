// 🐛 DEBUG SCRIPT PARA GEOLOCALIZACIÓN WIFI
// Ejecutar en consola del navegador para diagnosticar problemas

console.log('🔍 Iniciando diagnóstico de geolocalización WiFi...');

// 1. Verificar si las funciones están disponibles
console.log('📊 Estado de funciones:');
console.log('- AdvancedIPDetection disponible:', typeof window !== 'undefined' && window.AdvancedIPDetection);
console.log('- ForensicCapture disponible:', typeof window !== 'undefined' && window.ForensicCapture);

// 2. Verificar datos existentes en logs
async function checkExistingLogs() {
  try {
    console.log('📋 Verificando logs existentes...');

    // Simular consulta a Supabase (ajusta según tu implementación)
    if (typeof window !== 'undefined' && window.ForensicService) {
      const logs = await window.ForensicService.getForensicLogs();
      console.log('📊 Logs encontrados:', logs.length);

      logs.forEach((log, index) => {
        console.log(`🔍 Log ${index + 1}:`, {
          accessId: log.accessId?.slice(-8),
          hasWifiLocation: !!log.wifiLocation,
          hasGeolocation: !!log.geolocation,
          trustScore: log.trustScore,
          wifiLocation: log.wifiLocation,
          geolocation: log.geolocation
        });
      });
    } else {
      console.log('⚠️ ForensicService no disponible - usando datos simulados');

      // Datos simulados para testing
      const mockLogs = [
        {
          accessId: 'access-test-001',
          wifiLocation: {
            latitude: 10.5061,
            longitude: -66.9146,
            accuracy: 150,
            wifiCount: 3,
            method: 'wifi'
          },
          geolocation: null,
          trustScore: 85
        }
      ];

      console.log('📊 Datos simulados:', mockLogs);
    }
  } catch (error) {
    console.error('❌ Error verificando logs:', error);
  }
}

// 3. Probar geolocalización WiFi en tiempo real
async function testWifiGeolocation() {
  try {
    console.log('📶 Probando geolocalización WiFi en tiempo real...');

    if (typeof window !== 'undefined' && window.AdvancedIPDetection) {
      const wifiResult = await window.AdvancedIPDetection.getWifiLocation();

      if (wifiResult) {
        console.log('✅ WiFi geolocation exitosa:', {
          coordenadas: `${wifiResult.latitude}, ${wifiResult.longitude}`,
          precision: `±${wifiResult.accuracy}m`,
          redes: wifiResult.wifiCount,
          metodo: wifiResult.method
        });
      } else {
        console.log('⚠️ WiFi geolocation devolvió null - posibles causas:');
        console.log('  - GPS disponible (fallback automático)');
        console.log('  - Error en servicios de geolocalización');
        console.log('  - Falta API key de Google Maps');
        console.log('  - Problemas de conectividad');
      }
    } else {
      console.log('⚠️ AdvancedIPDetection no disponible');

      // Probar funciones básicas
      console.log('🧪 Probando funciones básicas...');

      // Verificar GPS
      if (navigator.geolocation) {
        console.log('✅ Geolocation API disponible');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ GPS exitoso:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.log('❌ GPS falló:', error.message);
          },
          { timeout: 10000 }
        );
      } else {
        console.log('❌ Geolocation API no disponible');
      }

      // Verificar WiFi APIs experimentales
      console.log('📡 APIs WiFi disponibles:');
      console.log('- mozWifiManager:', 'mozWifiManager' in navigator);
      console.log('- wifi API:', 'wifi' in navigator);
    }
  } catch (error) {
    console.error('❌ Error en test WiFi:', error);
  }
}

// 4. Verificar configuración de Supabase
function checkSupabaseConfig() {
  console.log('🗄️ Verificando configuración de Supabase...');

  try {
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase cliente disponible');

      // Verificar configuración
      const config = {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        url: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) + '...',
        key: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      };

      console.log('🔧 Configuración:', config);

    } else {
      console.log('⚠️ Supabase no disponible - usando modo simulado');
    }
  } catch (error) {
    console.error('❌ Error verificando Supabase:', error);
  }
}

// 5. Verificar API keys
function checkApiKeys() {
  console.log('🔑 Verificando API keys...');

  const apiKeys = {
    googleMaps: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  console.log('🔧 Estado de API keys:', apiKeys);

  if (!apiKeys.googleMaps) {
    console.log('⚠️ ADVERTENCIA: No hay API key de Google Maps - WiFi geolocation limitada');
  }
}

// FUNCIONES PRINCIPALES PARA EJECUTAR
window.debugWifiGeolocation = {
  checkExistingLogs,
  testWifiGeolocation,
  checkSupabaseConfig,
  checkApiKeys,

  // Función completa de diagnóstico
  async runFullDiagnostic() {
    console.log('🚀 Iniciando diagnóstico completo de WiFi geolocation...\n');

    await checkApiKeys();
    console.log('');

    await checkSupabaseConfig();
    console.log('');

    await checkExistingLogs();
    console.log('');

    await testWifiGeolocation();
    console.log('');

    console.log('✅ Diagnóstico completado. Revisa los logs arriba para identificar problemas.');
  }
};

// Instrucciones de uso
console.log('📋 INSTRUCCIONES:');
console.log('Ejecuta: debugWifiGeolocation.runFullDiagnostic()');
console.log('O ejecuta funciones individuales:');
console.log('- debugWifiGeolocation.checkExistingLogs()');
console.log('- debugWifiGeolocation.testWifiGeolocation()');
console.log('- debugWifiGeolocation.checkSupabaseConfig()');
console.log('- debugWifiGeolocation.checkApiKeys()');

console.log('\n🔍 Diagnóstico de geolocalización WiFi listo. Ejecuta las funciones para empezar.');
