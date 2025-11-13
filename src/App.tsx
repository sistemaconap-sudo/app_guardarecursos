import { useState, lazy, Suspense, memo, useMemo, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger, useSidebar } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Toaster } from './components/ui/sonner';
import { CambiarContrasena } from './components/CambiarContrasena';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { conapLogo } from './src/logo';
import { filterNavigationByRole, getModulePermissions, type UserRole } from './utils/permissions';
import { dashboardStyles, headerStyles, containerStyles } from './styles/shared-styles';
import { setAuthToken, getAuthToken, removeAuthToken, showLastError } from './utils/base-api-service';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  Calendar,
  Activity,
  FileText,
  Camera,
  Route,
  Package,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  Shield,
  Briefcase,
  Eye,
  Settings2,
  ChevronRight,
  LayoutDashboard,
  Key,
  Trees,
  UserPlus,
  MapPin,
  FileSearch
} from 'lucide-react';

// Lazy load de módulos para mejor rendimiento
const RegistroGuardarecursos = lazy(() => import('./components/RegistroGuardarecursos').then(m => ({ default: m.RegistroGuardarecursos })));
const AsignacionZonas = lazy(() => import('./components/AsignacionZonas').then(m => ({ default: m.AsignacionZonas })));
const ControlEquipos = lazy(() => import('./components/ControlEquipos').then(m => ({ default: m.ControlEquipos })));
const PlanificacionActividades = lazy(() => import('./components/PlanificacionActividades').then(m => ({ default: m.PlanificacionActividades })));
const RegistroDiario = lazy(() => import('./components/RegistroDiario').then(m => ({ default: m.RegistroDiario })));
const GeolocalizacionRutas = lazy(() => import('./components/GeolocalizacionRutas').then(m => ({ default: m.GeolocalizacionRutas })));
const ReporteHallazgos = lazy(() => import('./components/ReporteHallazgos').then(m => ({ default: m.ReporteHallazgos })));
const RegistroIncidentes = lazy(() => import('./components/RegistroIncidentes').then(m => ({ default: m.RegistroIncidentes })));
const GestionUsuarios = lazy(() => import('./components/GestionUsuarios').then(m => ({ default: m.GestionUsuarios })));

/**
 * =============================================
 * ESTRUCTURA DE NAVEGACIÓN DEL SISTEMA
 * =============================================
 * 
 * Aquí se definen las 4 categorías principales del menú y sus módulos.
 * 
 * ⚠️ IMPORTANTE: Los IDs de los items deben coincidir con los módulos
 * definidos en /utils/permissions.ts
 * 
 * 📝 PARA AGREGAR UN NUEVO MÓDULO:
 * 1. Agrega el módulo aquí en la categoría correspondiente
 * 2. Crea el componente en /components
 * 3. Agrega el import lazy al inicio de este archivo
 * 4. Agrega el case en renderContent()
 * 5. Agrega los permisos en /utils/permissions.ts
 */
const navigationCategories = [
  // CATEGORÍA 1: Gestión de Personal
  {
    id: 'personal',
    title: 'Personal',
    icon: Shield,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-50/50 to-green-50/50',
    darkBgGradient: 'from-emerald-950/50 to-green-950/50',
    items: [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'registro-guarda', name: 'Guardarrecursos', icon: UserPlus },
      { id: 'asignacion-zonas', name: 'Áreas Protegidas', icon: MapPin },
      { id: 'control-equipos', name: 'Control de Equipos', icon: Package },
    ]
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    icon: Briefcase,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    bgGradient: 'from-blue-50/50 to-cyan-50/50',
    darkBgGradient: 'from-blue-950/50 to-cyan-950/50',
    items: [
      { id: 'planificacion', name: 'Planificación', icon: Calendar },
      { id: 'registro-diario', name: 'Registro Diario', icon: FileText },
      { id: 'geolocalizacion', name: 'Geolocalización', icon: Route },
    ]
  },
  {
    id: 'control',
    title: 'Control',
    icon: Eye,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    bgGradient: 'from-orange-50/50 to-amber-50/50',
    darkBgGradient: 'from-orange-950/50 to-amber-950/50',
    items: [
      { id: 'hallazgos', name: 'Hallazgos', icon: FileSearch },
      { id: 'incidentes', name: 'Incidentes', icon: AlertTriangle },
    ]
  },
  {
    id: 'admin',
    title: 'Administración',
    icon: Settings2,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    bgGradient: 'from-purple-50/50 to-violet-50/50',
    darkBgGradient: 'from-purple-950/50 to-violet-900/50',
    items: [
      { id: 'usuarios', name: 'Gestión de Usuarios', icon: Users },
    ]
  }
];

// Componentes memoizados para optimización de rendimiento
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Cargando módulo...</p>
    </div>
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

const AccessDenied = memo(() => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center p-8 rounded-xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 shadow-lg">
      <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-300">Acceso Denegado</h3>
      <p className="text-red-600 dark:text-red-400 mb-2">No tienes permisos para acceder a este módulo</p>
      <p className="text-sm text-red-500 dark:text-red-500">
        Contacta a un administrador si necesitas acceso
      </p>
    </div>
  </div>
));
AccessDenied.displayName = 'AccessDenied';

function AppContent({ currentUser, setCurrentUser, patrullajeEnProgreso, setPatrullajeEnProgreso, coordenadasRecuperadas, setCoordenadasRecuperadas }: { currentUser: any, setCurrentUser: (user: any) => void, patrullajeEnProgreso: any, setPatrullajeEnProgreso: (patrullaje: any) => void, coordenadasRecuperadas: any[], setCoordenadasRecuperadas: (coords: any[]) => void }) {
  // ===== VISTA INICIAL POR ROL =====
  // 
  // ⚠️ CONFIGURACIÓN DE VISTAS INICIALES:
  // - Administrador y Coordinador → Dashboard
  // - Guardarecurso → Registro Diario de Campo
  // 
  // Para cambiar la vista inicial de un rol, modifica estas líneas:
  const initialSection = currentUser.rol === 'Guardarecurso' ? 'registro-diario' : 'dashboard';
  const initialCategory = currentUser.rol === 'Guardarecurso' ? 'operaciones' : 'personal';
  
  // Estados de la aplicación
  const [activeSection, setActiveSection] = useState(initialSection);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(initialCategory);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  
  // Actualizar vista inicial cuando cambia el usuario (ej: al cambiar de cuenta)
  useEffect(() => {
    const newInitialSection = currentUser.rol === 'Guardarecurso' ? 'registro-diario' : 'dashboard';
    const newInitialCategory = currentUser.rol === 'Guardarecurso' ? 'operaciones' : 'personal';
    setActiveSection(newInitialSection);
    setExpandedCategory(newInitialCategory);
  }, [currentUser.rol]);

  // Validar estado del usuario - si está suspendido o desactivado, cerrar sesión
  useEffect(() => {
    if (currentUser && (currentUser.estado === 'Suspendido' || currentUser.estado === 'Desactivado')) {
      setCurrentUser(null);
      setActiveSection('dashboard');
    }
  }, [currentUser, setCurrentUser]);
  
  // Obtener rol del usuario actual
  const userRole = currentUser.rol as UserRole;
  
  // Filtrar categorías de navegación seg��n permisos
  const filteredCategories = filterNavigationByRole(navigationCategories, userRole);

  const renderContent = () => {
    // Obtener permisos para el módulo actual
    const permissions = getModulePermissions(userRole, activeSection);
    
    // Verificar si tiene acceso al módulo
    if (!permissions.canView) {
      return <AccessDenied />;
    }
    
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} currentUser={currentUser} />;
      
      // Módulos de Gestión de Personal
      case 'registro-guarda':
        return <Suspense fallback={<LoadingFallback />}><RegistroGuardarecursos userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      case 'asignacion-zonas':
        return <Suspense fallback={<LoadingFallback />}><AsignacionZonas userPermissions={permissions} /></Suspense>;
      case 'control-equipos':
        return <Suspense fallback={<LoadingFallback />}><ControlEquipos userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      
      // Módulos de Operaciones de Campo
      case 'planificacion':
        return <Suspense fallback={<LoadingFallback />}><PlanificacionActividades userPermissions={permissions} /></Suspense>;
      case 'registro-diario':
        return <Suspense fallback={<LoadingFallback />}><RegistroDiario userPermissions={permissions} currentUser={currentUser} patrullajeEnProgreso={patrullajeEnProgreso} coordenadasRecuperadas={coordenadasRecuperadas} onPatrullajeResumido={() => { setPatrullajeEnProgreso(null); setCoordenadasRecuperadas([]); }} /></Suspense>;
      case 'geolocalizacion':
        return <Suspense fallback={<LoadingFallback />}><GeolocalizacionRutas userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      
      // Módulos de Control y Seguimiento
      case 'hallazgos':
        return <Suspense fallback={<LoadingFallback />}><ReporteHallazgos userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      case 'incidentes':
        return <Suspense fallback={<LoadingFallback />}><RegistroIncidentes userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      
      // Módulos de Administración
      case 'usuarios':
        return <Suspense fallback={<LoadingFallback />}><GestionUsuarios userPermissions={permissions} currentUser={currentUser} /></Suspense>;
      
      default:
        return <Dashboard onNavigate={setActiveSection} currentUser={currentUser} />;
    }
  };

  const handleLogout = async () => {
    try {
      // Importar authService dinámicamente para evitar circular dependency
      const { authService } = await import('./utils/authService');
      
      // Cerrar sesión en Supabase y localStorage
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Eliminar token JWT de localStorage
      removeAuthToken();
      
      // Limpiar estado del usuario
      setCurrentUser(null);
      setActiveSection('dashboard');
      
      // Limpiar patrullaje en progreso
      setPatrullajeEnProgreso(null);
    }
    
    // Mostrar mensaje de confirmación
    toast.success('Sesión cerrada exitosamente');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleItemClick = (itemId: string) => {
    setActiveSection(itemId);
    // Si es el dashboard, expandir la categoría personal automáticamente
    if (itemId === 'dashboard') {
      setExpandedCategory('personal');
    }
    // Cerrar la sidebar después de seleccionar un módulo (tanto móvil como desktop)
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  // Función para obtener información del módulo actual
  const getCurrentModuleInfo = () => {
    for (const category of navigationCategories) {
      const item = category.items.find(i => i.id === activeSection);
      if (item) {
        return {
          name: item.name,
          icon: item.icon,
          category: category.title,
          color: category.color
        };
      }
    }
    return {
      name: 'Dashboard',
      icon: LayoutDashboard,
      category: 'Inicio',
      color: 'green'
    };
  };

  const currentModule = getCurrentModuleInfo();

  const renderNavigationCategories = () => {
    return (
      <div className="space-y-1">
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const hasActiveItem = category.items.some(item => item.id === activeSection);
          
          return (
            <div key={category.id} className="space-y-1">
              {/* Header de la categoría */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-200 group hover:bg-gray-50 dark:hover:bg-gray-800/50 relative"
              >
                {/* Barra indicadora sutil para categoría activa */}
                {hasActiveItem && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 sm:h-6 bg-green-500 rounded-full"></div>
                )}
                
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200 flex-shrink-0">
                  <category.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                    {category.title}
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {category.items.length} módulos
                  </div>
                </div>
                
                <div className={`transition-transform duration-200 flex-shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                }`}>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </button>

              {/* Items de la categoría (desplegable) */}
              {isExpanded && (
                <div className="ml-4 sm:ml-6 space-y-0.5 animate-fadeIn">
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 group hover:bg-gray-50 dark:hover:bg-gray-800/50 relative"
                    >
                      {/* Línea indicadora minimalista para item activo */}
                      {activeSection === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 sm:h-4 bg-green-500 rounded-full"></div>
                      )}
                      
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        activeSection === item.id
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                      }`}>
                        <item.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
                          activeSection === item.id
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      
                      <span className={`flex-1 text-left text-xs sm:text-sm transition-colors duration-200 truncate ${
                        activeSection === item.id
                          ? 'text-green-700 dark:text-green-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-slate-900 dark:to-emerald-950">
          
          <Sidebar className="border-r-0 shadow-xl backdrop-blur-xl bg-white/98 dark:bg-gray-900/98">
            <SidebarHeader className="border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-br from-green-50/80 via-emerald-50/80 to-blue-50/80 dark:from-green-950/80 dark:via-emerald-950/80 dark:to-blue-950/80 min-h-[60px] sm:h-[73px] flex items-center">
              <div className="flex items-center gap-2.5 sm:gap-3 w-full">
                <div className="relative flex-shrink-0">
                  <div className={dashboardStyles.logoContainer}>
                    <img 
                      src={conapLogo} 
                      alt="CONAP Logo" 
                      className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                    />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse-soft"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-sm sm:text-base bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 dark:from-green-400 dark:via-emerald-300 dark:to-green-400 bg-clip-text text-transparent leading-tight truncate">
                    CONAP
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium leading-tight truncate">Sistema de Guardarecursos</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="px-3 sm:px-4 py-4 sm:py-6">
              {renderNavigationCategories()}
            </SidebarContent>
          </Sidebar>
          
          <main className="flex-1 flex flex-col relative">
            <header className={headerStyles.container}>
              
              <div className={headerStyles.left}>
                {/* Botón de menú minimalista */}
                <SidebarTrigger className={headerStyles.menuButton}>
                  <Menu className={headerStyles.menuIcon} />
                </SidebarTrigger>
                
                {/* Icono del módulo actual */}
                <div className={headerStyles.moduleIcon}>
                  <currentModule.icon className={headerStyles.moduleIconSvg} />
                </div>
                
                {/* Título del módulo */}
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={headerStyles.moduleTitle}
                >
                  <h2 className={headerStyles.moduleName}>
                    {currentModule.name}
                  </h2>
                  <p className={headerStyles.moduleCategory}>
                    {currentModule.category}
                  </p>
                </button>
              </div>
              
              <div className={headerStyles.right}>
                {/* Info del usuario - Solo desktop */}
                <div className={headerStyles.userInfo}>
                  <div className={headerStyles.userName}>
                    {currentUser.nombre} {currentUser.apellido}
                  </div>
                  <div className={headerStyles.userRole}>
                    <div className={headerStyles.userRoleDot}></div>
                    <span>{currentUser.rol}</span>
                  </div>
                </div>
                
                {/* ThemeToggle */}
                <ThemeToggle variant="compact" />
                
                {/* Menú de usuario para desktop */}
                <div className={headerStyles.actions}>
                  {/* Avatar */}
                  <div className={headerStyles.avatar}>
                    <UserCheck className={headerStyles.avatarIcon} />
                  </div>
                  
                  {/* Botón cambiar contraseña */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPasswordDialogOpen(true)}
                    className={headerStyles.iconButton}
                    title="Cambiar contraseña"
                  >
                    <Key className={headerStyles.iconButtonIcon} />
                  </Button>
                  
                  {/* Botón logout */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className={headerStyles.iconButtonLogout}
                    title="Cerrar sesión"
                  >
                    <LogOut className={headerStyles.iconButtonIcon} />
                  </Button>
                </div>
                
                {/* Menú desplegable para móvil */}
                <div className={headerStyles.mobileMenu}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={headerStyles.mobileMenuButton}
                        aria-label="Menú de usuario"
                      >
                        <UserCheck className={headerStyles.iconButtonIcon} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={headerStyles.mobileMenuDropdown}>
                      <div className={headerStyles.mobileMenuLabel}>
                        <div className={headerStyles.mobileMenuUserContainer}>
                          <div className={headerStyles.mobileMenuAvatar}>
                            <UserCheck className={headerStyles.mobileMenuAvatarIcon} />
                          </div>
                          <div className={headerStyles.mobileMenuUserInfo}>
                            <div className={headerStyles.mobileMenuUserName}>
                              {currentUser.nombre} {currentUser.apellido}
                            </div>
                            <div className={headerStyles.mobileMenuUserRole}>
                              <div className={headerStyles.userRoleDot}></div>
                              {currentUser.rol}
                            </div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsPasswordDialogOpen(true)}
                        className={headerStyles.mobileMenuItem}
                      >
                        <Key className={`${headerStyles.mobileMenuItemIcon} text-blue-600 dark:text-blue-400`} />
                        <span>Cambiar contraseña</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogout} 
                        className={`text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 ${headerStyles.mobileMenuItem}`}
                      >
                        <LogOut className={headerStyles.mobileMenuItemIcon} />
                        <span>Cerrar sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
            
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto relative">
              <div className="relative z-10">
                {renderContent()}
              </div>
            </div>
          </main>
          <Toaster position="top-right" richColors />
          <CambiarContrasena 
            isOpen={isPasswordDialogOpen}
            onClose={() => setIsPasswordDialogOpen(false)}
            currentUser={currentUser}
          />
        </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [patrullajeEnProgreso, setPatrullajeEnProgreso] = useState<any>(null);
  const [coordenadasRecuperadas, setCoordenadasRecuperadas] = useState<any[]>([]);

  /**
   * =============================================
   * CONFIGURACIÓN DEL TÍTULO Y FAVICON
   * =============================================
   * 
   * Establece el título de la ventana del navegador
   */
  useEffect(() => {
    document.title = 'Sistema CONAP';
    
    // Mostrar último error si existe (para debugging)
    showLastError();
    
    // Actualizar el favicon
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = conapLogo;
    
    if (!document.querySelector("link[rel~='icon']")) {
      document.head.appendChild(link);
    }
  }, []);

  /**
   * =============================================
   * PERSISTENCIA DE SESIÓN CON SUPABASE
   * =============================================
   * 
   * Al cargar la aplicación, verifica si hay una sesión guardada
   * y restaura automáticamente usando Supabase
   * 
   * 🔒 SEGURIDAD:
   * - Valida que la sesión no haya expirado (24h)
   * - Verifica que el token JWT sea válido
   * - Limpia automáticamente sesiones inválidas
   */
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Importar authService
        const { authService } = await import('./utils/authService');
        
        // Intentar cargar sesión desde localStorage
        const session = authService.loadSession();
        
        if (session && session.user) {
          // Validar que la sesión tenga los datos mínimos requeridos
          if (!session.token || !session.user.email || !session.expiresAt) {
            console.error('❌ Sesión inválida detectada. Limpiando TODO...');
            
            // Limpiar TODOS los datos y caché
            await authService.clearAllData();
            removeAuthToken();
            setCurrentUser(null);
            setPatrullajeEnProgreso(null);
            setCoordenadasRecuperadas([]);
            setIsLoadingSession(false);
            
            alert('Sesión caducada. Por favor inicie sesión nuevamente.');
            return;
          }
          
          // Verificar si está cerca de expirar (menos de 1 hora)
          const timeUntilExpiry = session.expiresAt - Date.now();
          const oneHour = 60 * 60 * 1000;
          
          if (timeUntilExpiry < oneHour) {
            console.log(`⏰ Sesión expirará en ${Math.round(timeUntilExpiry / 1000 / 60)} minutos`);
          }
          
          // Configurar token en el cliente HTTP
          setAuthToken(session.token);
          
          // Restaurar usuario
          setCurrentUser(session.user);
          console.log('✅ Sesión restaurada:', session.user.email);

          // Verificar si hay patrullajes en progreso
          try {
            const { verificarPatrullajesEnProgreso } = await import('./utils/registroDiarioAPI');
            const resultado = await verificarPatrullajesEnProgreso(session.token);
            
            if (resultado.tienePatrullajeEnProgreso && resultado.patrullaje) {
              console.log('⚠️ Patrullaje en progreso detectado al restaurar sesión:', resultado.patrullaje);
              console.log('📍 Coordenadas recuperadas:', resultado.coordenadas);
              setPatrullajeEnProgreso(resultado.patrullaje);
              setCoordenadasRecuperadas(resultado.coordenadas || []);
            }
          } catch (error) {
            console.error('Error al verificar patrullajes en progreso:', error);
          }
        } else {
          // No hay sesión válida - limpiar todo
          console.log('ℹ️ No hay sesión guardada. Limpiando datos...');
          
          // Limpiar TODOS los datos por seguridad
          await authService.clearAllData();
          removeAuthToken();
          setCurrentUser(null);
          setPatrullajeEnProgreso(null);
          setCoordenadasRecuperadas([]);
        }
      } catch (error) {
        console.error('❌ Error al cargar sesión:', error);
        
        // Limpiar TODOS los datos en caso de error
        try {
          const { authService } = await import('./utils/authService');
          await authService.clearAllData();
        } catch (e) {
          console.error('❌ Error al limpiar datos:', e);
          // Fallback: limpiar manualmente
          localStorage.clear();
          sessionStorage.clear();
        }
        
        removeAuthToken();
        setCurrentUser(null);
        setPatrullajeEnProgreso(null);
        setCoordenadasRecuperadas([]);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  /**
   * =============================================
   * LISTENER DE SESIÓN EXPIRADA / LOGOUT FORZADO
   * =============================================
   * 
   * Escucha eventos que requieren logout inmediato:
   * - auth:unauthorized: Petición 401 (token expirado/inválido)
   * - auth:force-logout: Logout forzado desde cualquier componente
   * 
   * 🔒 SEGURIDAD: 
   * - Limpia completamente la sesión
   * - Elimina tokens JWT
   * - Limpia estado de patrullaje
   * - Muestra pantalla de Login
   */
  useEffect(() => {
    const handleForceLogout = async (event: any) => {
      console.log('👂 Evento de logout forzado recibido en App.tsx');
      console.log('📦 Detalles del evento:', event?.detail || 'Sin detalles');
      console.log('🔒 Iniciando limpieza COMPLETA de sesión y caché...');
      
      // 1. Limpiar estado de patrullaje en progreso PRIMERO
      setPatrullajeEnProgreso(null);
      setCoordenadasRecuperadas([]);
      console.log('✅ Estado de patrullaje limpiado');
      
      // 2. Limpiar sesión del usuario (muestra Login automáticamente)
      console.log('🔄 Estableciendo currentUser a null...');
      setCurrentUser(null);
      
      // 3. Limpiar TODOS los datos
      try {
        const { authService } = await import('./utils/authService');
        await authService.clearAllData();
        console.log('✅ Todos los datos y caché limpiados');
      } catch (error) {
        console.error('❌ Error al limpiar datos:', error);
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // 4. Limpiar token JWT
      removeAuthToken();
      console.log('✅ Token JWT eliminado');
      
      console.log('⚠️ Sesión completamente eliminada. Mostrando login.');
    };

    console.log('🎧 Registrando listeners de logout en App.tsx');
    
    // Escuchar AMBOS eventos
    window.addEventListener('auth:unauthorized', handleForceLogout);
    window.addEventListener('auth:force-logout', handleForceLogout);

    // Cleanup
    return () => {
      console.log('🧹 Limpiando listeners de logout');
      window.removeEventListener('auth:unauthorized', handleForceLogout);
      window.removeEventListener('auth:force-logout', handleForceLogout);
    };
  }, [setCurrentUser, setPatrullajeEnProgreso, setCoordenadasRecuperadas]);

  /**
   * Wrapper de setCurrentUser que también guarda el token y la sesión
   */
  const handleLogin = async (authResult: { user: any; token: string }) => {
    try {
      // Importar authService
      const { authService } = await import('./utils/authService');
      
      // Guardar sesión en localStorage (token + usuario)
      authService.saveSession(authResult.token, authResult.user);
      
      // Guardar token JWT en el cliente HTTP
      setAuthToken(authResult.token);
      
      // Guardar usuario en estado
      setCurrentUser(authResult.user);
      
      console.log('✅ Login exitoso:', authResult.user.email);

      // Verificar si hay patrullajes en progreso
      try {
        const { verificarPatrullajesEnProgreso } = await import('./utils/registroDiarioAPI');
        const resultado = await verificarPatrullajesEnProgreso(authResult.token);
        
        if (resultado.tienePatrullajeEnProgreso && resultado.patrullaje) {
          console.log('⚠️ Patrullaje en progreso detectado:', resultado.patrullaje);
          console.log('📍 Coordenadas recuperadas:', resultado.coordenadas);
          setPatrullajeEnProgreso(resultado.patrullaje);
          setCoordenadasRecuperadas(resultado.coordenadas || []);
          
          // Mostrar notificación al usuario
          toast.warning('Patrullaje en progreso', {
            description: 'Tienes un patrullaje en progreso. Se abrirá automáticamente.'
          });
        }
      } catch (error) {
        console.error('Error al verificar patrullajes en progreso:', error);
      }
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      
      // Guardar de todas formas (fallback)
      setAuthToken(authResult.token);
      setCurrentUser(authResult.user);
    }
  };

  // Mostrar loader mientras se carga la sesión
  if (isLoadingSession) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="conap-theme">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-slate-900 dark:to-emerald-950">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando sesión...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!currentUser) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="conap-theme">
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="conap-theme">
      <SidebarProvider defaultOpen={false}>
        <AppContent 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser}
          patrullajeEnProgreso={patrullajeEnProgreso}
          setPatrullajeEnProgreso={setPatrullajeEnProgreso}
          coordenadasRecuperadas={coordenadasRecuperadas}
          setCoordenadasRecuperadas={setCoordenadasRecuperadas}
        />
      </SidebarProvider>
    </ThemeProvider>
  );
}