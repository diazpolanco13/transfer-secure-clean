import { useState, useEffect } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  DocumentArrowUpIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  LockClosedIcon,
  SunIcon,
  MoonIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { SecureUploadZone } from './components/upload/SecureUploadZone'
import { UploadHistory } from './components/upload/UploadHistory'
import { ShareManagement } from './components/share/ShareManagement'
import { FileService } from './services/fileService'
import { isSupabaseConfigured, getClientIP } from './lib/supabase'

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

const navigation = [
  { name: 'Subir Archivos', href: 'upload', icon: DocumentArrowUpIcon, current: true },
  { name: 'Historial', href: 'history', icon: ClockIcon, current: false },
  { name: 'Gestión Envío', href: 'share', icon: ShareIcon, current: false },
  { name: 'Estadísticas', href: 'stats', icon: ChartBarIcon, current: false },
  { name: 'Seguridad', href: 'security', icon: ShieldCheckIcon, current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'share' | 'stats' | 'security'>('upload')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [, setIsLoadingFiles] = useState(false)

  // === 🗄️ CARGAR ARCHIVOS DESDE SUPABASE AL INICIAR ===
  useEffect(() => {
    const loadFilesFromSupabase = async () => {
      if (isSupabaseConfigured()) {
        setIsLoadingFiles(true);
        try {
          console.log('🗄️ [SUPABASE] Cargando archivos desde base de datos...');
          const files = await FileService.getUploadedFiles();
          const convertedFiles = files.map(FileService.convertRowToUploadedFile);
          setUploadedFiles(convertedFiles);
          console.log(`✅ [SUPABASE] ${convertedFiles.length} archivos cargados`);
        } catch (error) {
          console.error('❌ [SUPABASE] Error cargando archivos:', error);
        } finally {
          setIsLoadingFiles(false);
        }
      }
    };

    loadFilesFromSupabase();
  }, []);

  // Cargar preferencia de tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('transfer-secure-theme')
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Guardar preferencia y actualizar clase del body
  useEffect(() => {
    localStorage.setItem('transfer-secure-theme', darkMode ? 'dark' : 'light')
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.body.className = 'h-full bg-gray-900'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.className = 'h-full bg-gray-50'
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Funciones para generar clases dinámicas según el tema
  const getThemeClasses = () => ({
    background: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    sidebar: darkMode ? 'bg-gray-900' : 'bg-white border-r border-gray-200',
    sidebarInner: darkMode ? 'bg-black/10 border-r border-white/10' : 'bg-white border-r border-gray-200',
    text: {
      primary: darkMode ? 'text-white' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-400' : 'text-gray-600',
      muted: darkMode ? 'text-gray-500' : 'text-gray-500'
    },
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    button: {
      active: darkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-600',
      inactive: darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }
  })

  const theme = getThemeClasses()

  const handleUploadComplete = async (files: any[]) => {
    try {
      const clientIP = await getClientIP();
      const now = new Date().toISOString();
      
      // Crear datos de archivos con auditoría completa
      const newFiles: UploadedFile[] = await Promise.all(files.map(async (file, index) => {
        // Si es un archivo real (File object), convertirlo a base64
        let fileUrl = file.url;
        
        if (file instanceof File) {
          // Convertir archivo a base64 para almacenamiento temporal
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          fileUrl = await base64Promise;
        }
        
        return {
          auditId: `audit-${Date.now()}-${index}`,
          originalName: file.name,
          secureName: file.key || file.name,
          secureUrl: fileUrl || `data:application/octet-stream;base64,`, // Usar data URL si no hay URL real
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          clientIP: clientIP,
          uploadedAt: now,
          processedAt: now,
        };
      }));

      // === 🗄️ GUARDAR EN SUPABASE ===
      if (isSupabaseConfigured()) {
        console.log('🗄️ [SUPABASE] Guardando archivos en base de datos...');
        
        for (const file of newFiles) {
          const supabaseId = await FileService.storeUploadedFile(file);
          if (supabaseId) {
            console.log(`✅ [SUPABASE] Archivo guardado: ${file.originalName}`);
            
            // Crear enlace de compartir automáticamente
            const shareLink = await FileService.createShareLink(file.auditId);
            if (shareLink) {
              console.log(`🔗 [SUPABASE] Enlace creado: ${shareLink.link_id}`);
            }
          }
        }
      } else {
        console.log('🔧 [SUPABASE] No configurado - Solo guardando localmente');
      }

      // Actualizar estado local
      setUploadedFiles(prev => [...newFiles, ...prev]);
      
      // Automáticamente redirigir a gestión del archivo recién subido
      setActiveTab('share');
      
    } catch (error) {
      console.error('❌ [UPLOAD] Error procesando archivos:', error);
    }
  }

  const handleUploadError = (error: string) => {
    alert(`Error en la subida: ${error}`)
  }

  const handleDownload = async (file: UploadedFile) => {
    try {
      console.log('📥 Descargando archivo:', file.originalName);
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = file.secureUrl;
      link.download = file.originalName;
      link.target = '_blank';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Descarga iniciada para:', file.originalName);
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error);
      alert('Error al descargar el archivo. Por favor, intenta de nuevo.');
    }
  }

  const handleShare = (file: UploadedFile) => {
    console.log('🔗 Compartiendo archivo:', file.originalName);
    
    // Cambiar a la sección de gestión de envío
    setActiveTab('share');
    
    console.log('✅ Navegando a gestión de envío para:', file.auditId);
  }

  const handleDelete = async (file: UploadedFile) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar "${file.originalName}"?\n\nEsta acción no se puede deshacer y eliminará:\n- El archivo y sus metadatos\n- Todos los enlaces compartidos\n- Los logs de auditoría forense\n\n¿Continuar?`
    );

    if (!confirmDelete) return;

    try {
      console.log('🗑️ Eliminando archivo:', file.originalName);
      
      if (isSupabaseConfigured()) {
        // Eliminar de Supabase
        const success = await FileService.deleteUploadedFile(file.auditId);
        if (!success) {
          throw new Error('Error eliminando archivo de Supabase');
        }
        console.log('✅ Archivo eliminado de Supabase');
      }
      
      // Actualizar estado local
      setUploadedFiles(prev => prev.filter(f => f.auditId !== file.auditId));
      
      console.log('✅ Archivo eliminado del estado local');
      alert(`Archivo "${file.originalName}" eliminado correctamente.`);
      
    } catch (error) {
      console.error('❌ Error al eliminar archivo:', error);
      alert('Error al eliminar el archivo. Por favor, intenta de nuevo.');
    }
  }

  // Actualizar navegación según tab activo
  const updateNavigation = (activeHref: string) => {
    return navigation.map(item => ({
      ...item,
      current: item.href === activeHref
    }))
  }

  const currentNavigation = updateNavigation(activeTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold ${theme.text.primary} mb-2`}>
                Subir Archivos de Forma Segura
              </h2>
              <p className={theme.text.secondary}>
                Todos los archivos son cifrados automáticamente y auditados legalmente
              </p>
            </div>
            <SecureUploadZone
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        )
      
      case 'history':
        return (
          <div className="max-w-6xl mx-auto">
            <UploadHistory
              files={uploadedFiles}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          </div>
        )
      
      case 'share':
        return (
          <div className="max-w-6xl mx-auto">
            {uploadedFiles.length > 0 ? (
              <ShareManagement
                file={uploadedFiles[0]} // Usar el primer archivo como demo
                onBack={() => setActiveTab('upload')}
                darkMode={darkMode}
              />
            ) : (
              <div className="text-center py-12">
                <ShareIcon className={`mx-auto h-12 w-12 ${theme.text.muted}`} />
                <h3 className={`mt-2 text-sm font-medium ${theme.text.primary}`}>
                  No hay archivos para gestionar
                </h3>
                <p className={`mt-1 text-sm ${theme.text.secondary}`}>
                  Sube un archivo primero para poder gestionarlo
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`mt-4 ${theme.button.active} px-4 py-2 rounded-md text-sm font-medium`}
                >
                  Ir a Subir Archivos
                </button>
              </div>
            )}
          </div>
        )
      
      case 'stats':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`${theme.card} border rounded-lg p-6`}>
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="h-8 w-8 text-blue-400" />
                  <div className="ml-4">
                    <div className={`text-2xl font-bold ${theme.text.primary}`}>{uploadedFiles.length}</div>
                    <div className={theme.text.secondary}>Archivos subidos</div>
                  </div>
                </div>
              </div>
              <div className={`${theme.card} border rounded-lg p-6`}>
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-green-400" />
                  <div className="ml-4">
                    <div className={`text-2xl font-bold ${theme.text.primary}`}>
                      {Math.round(uploadedFiles.reduce((total, file) => total + file.fileSize, 0) / 1024 / 1024 * 100) / 100}
                    </div>
                    <div className={theme.text.secondary}>MB transferidos</div>
                  </div>
                </div>
              </div>
              <div className={`${theme.card} border rounded-lg p-6`}>
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-purple-400" />
                  <div className="ml-4">
                    <div className={`text-2xl font-bold ${theme.text.primary}`}>100%</div>
                    <div className={theme.text.secondary}>Seguridad</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'security':
        return (
          <div className="max-w-4xl mx-auto">
            <div className={`${theme.card} border rounded-lg p-6`}>
              <h3 className={`text-lg font-medium ${theme.text.primary} mb-4 flex items-center`}>
                <ShieldCheckIcon className="h-6 w-6 text-green-400 mr-2" />
                Compromiso de Seguridad Transfer Secure
              </h3>
              <div className={`space-y-4 ${theme.text.secondary}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <strong className={theme.text.primary}>Cifrado automático:</strong> Todos los archivos son cifrados antes de almacenarse
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <strong className={theme.text.primary}>Auditoría legal completa:</strong> IP, navegador, ubicación y timestamps registrados
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <strong className={theme.text.primary}>Enlaces únicos:</strong> Cada archivo tiene un enlace seguro de un solo uso
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <strong className={theme.text.primary}>Rate limiting:</strong> Protección contra abuso y ataques
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <div>
                    <strong className={theme.text.primary}>Compliance:</strong> Preparado para regulaciones de protección de datos
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      <div className={`min-h-screen ${theme.background}`}>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              {/* Mobile Sidebar */}
              <div className={`relative flex grow flex-col gap-y-5 overflow-y-auto ${theme.sidebar} px-6 pb-2 ${darkMode ? 'ring-1 ring-white/10' : ''}`}>
                <div className="relative flex h-16 shrink-0 items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <LockClosedIcon className="h-8 w-8 text-blue-400" />
                    <div>
                      <h1 className={`text-lg font-bold ${theme.text.primary}`}>Transfer Secure</h1>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`p-2 rounded-md ${theme.button.inactive}`}
                  >
                    {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                  </button>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {currentNavigation.map((item) => (
                          <li key={item.name}>
                            <button
                              onClick={() => {
                                setActiveTab(item.href as any)
                                setSidebarOpen(false)
                              }}
                              className={classNames(
                                item.current
                                  ? theme.button.active
                                  : theme.button.inactive,
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left',
                              )}
                            >
                              <item.icon aria-hidden="true" className="size-6 shrink-0" />
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop Sidebar */}
        <div className={`hidden ${theme.sidebar} lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col`}>
          <div className={`flex grow flex-col gap-y-5 overflow-y-auto ${theme.sidebarInner} px-6`}>
            <div className="flex h-16 shrink-0 items-center justify-between">
              <div className="flex items-center space-x-3">
                <LockClosedIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <h1 className={`text-lg font-bold ${theme.text.primary}`}>Transfer Secure</h1>
                  <p className={`text-xs ${theme.text.secondary}`}>Envío seguro de documentos</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-md ${theme.button.inactive} transition-colors`}
                title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {currentNavigation.map((item) => (
                      <li key={item.name}>
                        <button
                          onClick={() => setActiveTab(item.href as any)}
                          className={classNames(
                            item.current ? theme.button.active : theme.button.inactive,
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left',
                          )}
                        >
                          <item.icon aria-hidden="true" className="size-6 shrink-0" />
                          {item.name}
                          {item.href === 'history' && uploadedFiles.length > 0 && (
                            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                              {uploadedFiles.length}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className={`sticky top-0 z-40 flex items-center gap-x-6 ${theme.sidebar} px-4 py-4 shadow-sm sm:px-6 lg:hidden`}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`-m-2.5 p-2.5 ${theme.button.inactive} lg:hidden`}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <div className={`flex-1 text-sm/6 font-semibold ${theme.text.primary}`}>
            {currentNavigation.find(item => item.current)?.name}
          </div>
        </div>

        {/* Main Content */}
        <main className="py-10 lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  )
}

export default App
