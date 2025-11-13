import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Database, ExternalLink, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { BackendDiagnostic } from './BackendDiagnostic';
import { useState } from 'react';

interface SupabaseSetupHelperProps {
  error?: string;
}

export function SupabaseSetupHelper({ error }: SupabaseSetupHelperProps) {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const isTableError = error?.includes('relation') || error?.includes('does not exist') || error?.includes('Base de datos no configurada');
  const isAuthError = error?.includes('Usuario no encontrado en la base de datos');

  if (!isTableError && !isAuthError) {
    return null;
  }

  const steps = [
    {
      title: '1. Ejecutar script de inicialización',
      description: 'Crea las tablas base (rol, estado, area, usuario)',
      file: 'supabase_init.sql',
      done: !isTableError
    },
    {
      title: '2. Configurar Row Level Security',
      description: 'Habilita políticas de acceso a datos',
      file: 'supabase_rls_policies.sql',
      done: !isTableError
    },
    {
      title: '3. Crear usuario en Supabase Auth',
      description: 'Dashboard → Authentication → Users → Add User',
      done: !isAuthError && !isTableError
    },
    {
      title: '4. Insertar usuario en tabla',
      description: 'Ejecutar INSERT en SQL Editor',
      done: !isAuthError && !isTableError
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-slate-900 dark:to-emerald-950">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Configuración de Supabase Requerida</CardTitle>
          <CardDescription>
            La base de datos aún no está configurada. Sigue estos pasos para completar la configuración.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          <Alert variant="default" className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-800 dark:text-orange-400">Estado Actual</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              {error || 'Base de datos no configurada'}
            </AlertDescription>
          </Alert>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${step.done ? 'text-green-800 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {step.description}
                  </p>
                  {step.file && (
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded mt-1 inline-block">
                      /database/{step.file}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => window.open('https://supabase.com/dashboard/project/ctgcuhfqmuukezjwewwn/sql/new', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir SQL Editor
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDiagnostic(!showDiagnostic)}
            >
              {showDiagnostic ? 'Ocultar' : 'Mostrar'} Diagnóstico
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Recargar la página para verificar
                window.location.reload();
              }}
            >
              Verificar Configuración
            </Button>
          </div>

          {/* Backend Diagnostic */}
          {showDiagnostic && (
            <div className="pt-4">
              <BackendDiagnostic />
            </div>
          )}

          {/* Help Text */}
          <div className="text-center pt-4 border-t dark:border-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Necesitas ayuda?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Consulta el archivo SUPABASE_SETUP_GUIDE.md en la raíz del proyecto para instrucciones detalladas.');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver guía completa
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}