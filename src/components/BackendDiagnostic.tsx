/**
 * 🔍 Backend Diagnostic Component
 * 
 * Componente temporal para diagnosticar la conexión con el Edge Function.
 * Muestra información útil sobre la configuración y prueba los endpoints.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/api-config';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function BackendDiagnostic() {
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [healthMessage, setHealthMessage] = useState('');
  const [checkInitStatus, setCheckInitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkInitMessage, setCheckInitMessage] = useState('');

  const testHealth = async () => {
    setHealthStatus('loading');
    setHealthMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.health, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHealthStatus('success');
        setHealthMessage(`✅ Backend conectado correctamente: ${data.message || 'OK'}`);
      } else {
        setHealthStatus('error');
        setHealthMessage(`❌ Error ${response.status}: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      setHealthStatus('error');
      setHealthMessage(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const testCheckInit = async () => {
    setCheckInitStatus('loading');
    setCheckInitMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.checkInit, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCheckInitStatus('success');
        setCheckInitMessage(`✅ Check Init OK: ${JSON.stringify(data, null, 2)}`);
      } else {
        setCheckInitStatus('error');
        setCheckInitMessage(`❌ Error ${response.status}: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      setCheckInitStatus('error');
      setCheckInitMessage(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔍 Diagnóstico del Backend</CardTitle>
        <CardDescription>
          Información de configuración y pruebas de conectividad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información de Configuración */}
        <div className="space-y-2">
          <h3 className="font-semibold">📋 Configuración Actual:</h3>
          <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">Project ID:</span>{' '}
              <span className="text-foreground">{projectId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">API Base URL:</span>{' '}
              <span className="text-foreground break-all">{API_BASE_URL}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Anon Key:</span>{' '}
              <span className="text-foreground break-all">
                {publicAnonKey.substring(0, 20)}...{publicAnonKey.substring(publicAnonKey.length - 20)}
              </span>
            </div>
          </div>
        </div>

        {/* Prueba de Health Check */}
        <div className="space-y-2">
          <h3 className="font-semibold">🏥 Health Check:</h3>
          <div className="flex gap-2">
            <Button
              onClick={testHealth}
              disabled={healthStatus === 'loading'}
              variant="outline"
            >
              {healthStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                'Probar /health'
              )}
            </Button>
          </div>
          
          {healthStatus !== 'idle' && (
            <Alert variant={healthStatus === 'success' ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {healthStatus === 'loading' && <Loader2 className="w-4 h-4 mt-0.5 animate-spin" />}
                {healthStatus === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />}
                {healthStatus === 'error' && <XCircle className="w-4 h-4 mt-0.5" />}
                <AlertDescription className="flex-1 break-all">
                  {healthMessage}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Prueba de Check Init */}
        <div className="space-y-2">
          <h3 className="font-semibold">🔧 Check Init Data:</h3>
          <div className="flex gap-2">
            <Button
              onClick={testCheckInit}
              disabled={checkInitStatus === 'loading'}
              variant="outline"
            >
              {checkInitStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                'Probar /check-init'
              )}
            </Button>
          </div>
          
          {checkInitStatus !== 'idle' && (
            <Alert variant={checkInitStatus === 'success' ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {checkInitStatus === 'loading' && <Loader2 className="w-4 h-4 mt-0.5 animate-spin" />}
                {checkInitStatus === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />}
                {checkInitStatus === 'error' && <XCircle className="w-4 h-4 mt-0.5" />}
                <AlertDescription className="flex-1">
                  <pre className="whitespace-pre-wrap break-all text-xs">
                    {checkInitMessage}
                  </pre>
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Información Adicional */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">💡 Pasos para resolver errores 404:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Verifica que la Edge Function esté desplegada en Supabase</li>
                <li>Confirma que el nombre de la función sea exactamente: <code className="bg-muted px-1 rounded">make-server-811550f1</code></li>
                <li>Revisa los logs en Supabase Dashboard → Edge Functions → Logs</li>
                <li>Asegúrate de que las tablas estén creadas en PostgreSQL</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Endpoints Disponibles */}
        <div className="space-y-2">
          <h3 className="font-semibold">🔗 Endpoints Principales:</h3>
          <div className="bg-muted p-4 rounded-lg space-y-1 font-mono text-xs">
            <div>GET {API_ENDPOINTS.health}</div>
            <div>GET {API_ENDPOINTS.checkInit}</div>
            <div>POST {API_ENDPOINTS.initData}</div>
            <div>GET {API_ENDPOINTS.usuario('[email]')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
