import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRouter from './AppRouter.tsx'

// Importar debugger y test tools para desarrollo
if (import.meta.env.DEV) {
  import('./utils/debugForensic').then(() => {
    console.log('🔧 ForensicDebugger cargado para desarrollo');
  });
  import('./utils/testForensicInsert').then(() => {
    console.log('🧪 testForensicInsert cargado para desarrollo');
  });
  import('./utils/advancedIPDetection').then(() => {
    console.log('🔍 AdvancedIPDetection cargado para desarrollo');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </StrictMode>,
)
