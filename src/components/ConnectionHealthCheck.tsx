import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HealthStatus {
  health: 'checking' | 'ok' | 'error';
  ecosistemas: 'checking' | 'ok' | 'error';
  departamentos: 'checking' | 'ok' | 'error';
  message?: string;
}

export function ConnectionHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    health: 'checking',
    ecosistemas: 'checking',
    departamentos: 'checking'
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-811550f1`;

    // Check health endpoint
    try {
      const healthRes = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      setStatus(prev => ({
        ...prev,
        health: healthRes.ok ? 'ok' : 'error'
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        health: 'error',
        message: 'Edge Function no desplegada o inaccesible'
      }));
    }

    // Check ecosistemas endpoint
    try {
      const token = localStorage.getItem('conap_auth_token');
      const ecosistemasRes = await fetch(`${baseUrl}/ecosistemas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token || publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStatus(prev => ({
        ...prev,
        ecosistemas: ecosistemasRes.ok ? 'ok' : 'error'
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        ecosistemas: 'error'
      }));
    }

    // Check departamentos endpoint
    try {
      const token = localStorage.getItem('conap_auth_token');
      const departamentosRes = await fetch(`${baseUrl}/departamentos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token || publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStatus(prev => ({
        ...prev,
        departamentos: departamentosRes.ok ? 'ok' : 'error'
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        departamentos: 'error'
      }));
    }
  };

  const getStatusIcon = (state: 'checking' | 'ok' | 'error') => {
    if (state === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
    if (state === 'ok') return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const hasErrors = status.health === 'error' || status.ecosistemas === 'error' || status.departamentos === 'error';
  const isChecking = status.health === 'checking' || status.ecosistemas === 'checking' || status.departamentos === 'checking';

  if (isChecking || !hasErrors) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-2 border-red-200 dark:border-red-900 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
            <AlertCircle className="w-5 h-5" />
            Problemas de Conexión Detectados
          </CardTitle>
          <CardDescription>
            No se puede conectar con el servidor backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Health Check:</span>
              {getStatusIcon(status.health)}
            </div>
            <div className="flex items-center justify-between">
              <span>Ecosistemas:</span>
              {getStatusIcon(status.ecosistemas)}
            </div>
            <div className="flex items-center justify-between">
              <span>Departamentos:</span>
              {getStatusIcon(status.departamentos)}
            </div>
          </div>

          {status.message && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {status.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Terminal className="w-4 h-4 mr-2" />
              {showDetails ? 'Ocultar' : 'Ver'} Solución
            </Button>

            {showDetails && (
              <Alert>
                <AlertTitle className="text-sm">Pasos para Solucionar:</AlertTitle>
                <AlertDescription className="text-xs space-y-1 mt-2">
                  <p className="font-semibold">1. Actualizar rutas del servidor:</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded my-1">
                    python3 fix-routes.py
                  </code>
                  
                  <p className="font-semibold mt-2">2. Desplegar Edge Function:</p>
                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded my-1">
                    supabase functions deploy make-server-811550f1 --no-verify-jwt
                  </code>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    📚 Consulta <strong>README_ACTUALIZACION_URGENTE.md</strong> para más detalles
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={checkHealth}
            >
              Verificar Nuevamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
