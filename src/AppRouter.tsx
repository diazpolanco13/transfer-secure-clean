import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import ReceiveFile from './pages/ReceiveFile';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Ruta principal - Dashboard con login */}
      <Route path="/" element={<App />} />
      
      {/* Ruta pública para recibir archivos - SIN LOGIN */}
      <Route path="/receive/:fileId" element={<ReceiveFile />} />
      
      {/* Fallback para rutas no encontradas */}
      <Route path="*" element={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Página No Encontrada</h1>
            <p className="text-gray-600 mb-6">La página que buscas no existe o ha sido movida.</p>
            <a 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ir a Transfer Secure
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
};

export default AppRouter;
