/**
 * 🚀 Edge Function Not Deployed Helper
 * 
 * Componente que se muestra cuando se detecta que la Edge Function no está desplegada.
 * Guía al usuario paso a paso para desplegarla.
 */

import { motion } from 'motion/react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, ExternalLink, Terminal, CheckCircle2 } from 'lucide-react';

export function EdgeFunctionNotDeployed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Edge Function No Desplegada</CardTitle>
              <CardDescription className="mt-1">
                La función de servidor <code className="bg-muted px-2 py-0.5 rounded text-xs">make-server-811550f1</code> no está disponible
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert Principal */}
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-900 dark:text-yellow-100">
              <strong>⚠️ Acción requerida:</strong> Necesitas desplegar la Edge Function en Supabase antes de poder usar la aplicación.
            </AlertDescription>
          </Alert>

          {/* Instrucciones Paso a Paso */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Pasos para desplegar la Edge Function:
            </h3>

            <div className="space-y-4">
              {/* Paso 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Instala Supabase CLI</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    npm install -g supabase
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Inicia sesión en Supabase</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    supabase login
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Vincula tu proyecto</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    supabase link --project-ref [tu-project-id]
                  </div>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Despliega la función</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
                    <div>cd supabase/functions</div>
                    <div className="text-green-600 dark:text-green-400">
                      supabase functions deploy make-server-811550f1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentación */}
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">📚 Recursos adicionales:</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                  <li>
                    Consulta <code className="bg-muted px-1 rounded">/DEPLOYMENT_GUIDE.md</code> para instrucciones detalladas
                  </li>
                  <li>
                    Revisa los logs en: Supabase Dashboard → Edge Functions → Logs
                  </li>
                  <li>
                    Verifica que las variables de entorno estén configuradas correctamente
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              🔄 Reintentar Conexión
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/docs/guides/functions/deploy', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Documentación
            </Button>
          </div>

          {/* Información de Contacto */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>¿Necesitas ayuda? Consulta la documentación de Supabase o contacta a tu administrador de sistemas.</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
