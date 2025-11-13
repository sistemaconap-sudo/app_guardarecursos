/**
 * 🖼️ LOGO DE CONAP
 * 
 * Archivo centralizado que contiene la referencia al logo de CONAP
 * utilizado en toda la aplicación.
 * 
 * ⚠️ IMPORTANTE: Debes subir el archivo 'logo_conap.png' a la carpeta /src/
 * 
 * USO:
 * import { conapLogo } from '../src/logo';
 * import { conapLogo } from './src/logo';
 * 
 * COMPONENTES QUE LO USAN:
 * - /App.tsx (Sidebar y Favicon)
 * - /components/Login.tsx (Pantalla de login)
 * - /components/GeolocalizacionRutas.tsx (Reportes PDF)
 */

// Importa el logo desde el archivo PNG en esta misma carpeta
import conapLogoImage from './logo_conap.png';

/**
 * Logo oficial de CONAP (Consejo Nacional de Áreas Protegidas)
 * Formato: PNG
 * Ubicación: /src/logo_conap.png
 * Uso: Sidebar, Login, Favicon, Reportes PDF
 */
export const conapLogo = conapLogoImage;

/**
 * Información del logo para referencia
 */
export const logoInfo = {
  name: 'CONAP Logo',
  format: 'PNG',
  filename: 'logo_conap.png',
  location: '/src/logo_conap.png',
  description: 'Logo oficial del Consejo Nacional de Áreas Protegidas de Guatemala',
  usedIn: [
    'Sidebar (App.tsx)',
    'Login Screen (Login.tsx)',
    'Browser Favicon (App.tsx)',
    'PDF Reports (GeolocalizacionRutas.tsx)'
  ]
};