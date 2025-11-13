/**
 * 🔧 Init Data Banner Component
 * 
 * Banner que se muestra cuando se detecta que faltan datos base (Estados y Roles)
 * Permite al usuario inicializar automáticamente los datos requeridos
 * 
 * @module components/InitDataBanner
 */

import { projectId } from '../utils/supabase/info';
import { API_ENDPOINTS } from '../utils/api-config';
import { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface InitDataBannerProps {
  onDataInitialized?: () => void;
}

export function InitDataBanner({ onDataInitialized }: InitDataBannerProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInitData = async () => {
    setIsInitializing(true);
    setError('');

    try {
      const response = await fetch(
        API_ENDPOINTS.initData,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${projectId}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al inicializar datos');
      }

      setIsSuccess(true);
      
      // Esperar 1 segundo para mostrar el mensaje de éxito
      setTimeout(() => {
        if (onDataInitialized) {
          onDataInitialized();
        }
      }, 1000);

    } catch (err: any) {
      console.error('Error al inicializar datos:', err);
      setError(err.message || 'Error al inicializar datos');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ✅ Datos base inicializados correctamente. Por favor, recargue la página.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
    >
      <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1">
          <AlertDescription className="text-yellow-900 dark:text-yellow-100 space-y-3">
            <p>
              <strong>⚠️ Base de datos sin inicializar</strong>
            </p>
            <p className="text-sm">
              La base de datos no tiene los datos base requeridos (Estados y Roles). 
              Haz clic en el botón para crearlos automáticamente.
            </p>
            
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                ❌ {error}
              </p>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleInitData}
                disabled={isInitializing}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  '🔧 Inicializar Datos Base'
                )}
              </Button>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    </motion.div>
  );
}