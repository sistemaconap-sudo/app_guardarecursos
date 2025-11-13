import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export function EdgeFunctionDeployHelper() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const deployCommands = [
    {
      title: '0. Actualizar Rutas del Servidor (IMPORTANTE)',
      command: 'python3 fix-routes.py',
      description: '⚠️ EJECUTAR PRIMERO: Actualiza 83 rutas de make-server-276018ed a make-server-811550f1'
    },
    {
      title: '1. Instalar Supabase CLI',
      command: 'npm install -g supabase',
      description: 'Instala la herramienta de línea de comandos de Supabase'
    },
    {
      title: '2. Iniciar sesión en Supabase',
      command: 'supabase login',
      description: 'Autentica tu terminal con tu cuenta de Supabase'
    },
    {
      title: '3. Vincular tu proyecto',
      command: 'supabase link --project-ref twefwdiwaiwczutlkjvw',
      description: 'Conecta este directorio con tu proyecto de Supabase'
    },
    {
      title: '4. Desplegar la Edge Function',
      command: 'supabase functions deploy make-server-811550f1 --no-verify-jwt',
      description: 'Despliega la función actualizada al servidor de Supabase'
    }
  ];

  const copyToClipboard = async (command: string, index: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(`cmd-${index}`);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 border-2 border-red-200 dark:border-red-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Edge Function No Desplegada
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300">
                    La función del servidor no está desplegada en Supabase
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  Los errores HTTP 404 indican que la Edge Function <code className="font-mono bg-red-100 dark:bg-red-950 px-2 py-1 rounded">make-server-811550f1</code> no está desplegada en el servidor de Supabase.
                  Esto es normal en un nuevo proyecto y se soluciona desplegando la función.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Terminal className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle>Guía de Despliegue - Supabase Edge Function</CardTitle>
                  <CardDescription>
                    Sigue estos pasos para desplegar la función del servidor
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {deployCommands.map((cmd, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {cmd.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {cmd.description}
                  </p>
                  <div className="relative group">
                    <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                      <code>{cmd.command}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cmd.command, index)}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedCommand === `cmd-${index}` ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}

              <Alert>
                <AlertDescription className="space-y-2">
                  <p className="font-semibold">Notas importantes:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>CRÍTICO:</strong> Ejecuta PRIMERO el comando del Paso 0 (actualizar rutas)</li>
                    <li>Si no tienes Python, usa: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">node update-server-routes.js</code></li>
                    <li>Necesitas tener Node.js instalado en tu sistema</li>
                    <li>La bandera <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">--no-verify-jwt</code> es necesaria para este proyecto</li>
                    <li>El despliegue puede tomar 1-2 minutos</li>
                    <li>Después del despliegue, recarga esta página para usar la aplicación</li>
                    <li>Consulta <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">INSTRUCCIONES_ACTUALIZACION_RUTAS.md</code> para más detalles</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">¿Necesitas ayuda?</h4>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://supabase.com/docs/guides/functions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Documentación de Edge Functions
                  </a>
                  <a
                    href="https://supabase.com/docs/guides/cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Guía del CLI de Supabase
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full md:w-auto"
            >
              Recargar Página Después del Despliegue
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
