/**
 * Estilos compartidos para la aplicación CONAP
 * Centraliza todos los estilos comunes para mantener consistencia
 */

// ============================================================================
// CARDS - Diseño Minimalista
// ============================================================================

export const cardStyles = {
  // Card base minimalista (sin overflow)
  base: "hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700",
  
  // Card base con overflow (para líneas decorativas)
  baseWithOverflow: "relative overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700",
  
  // Card con sombra más fuerte (ej. Dashboard)
  dashboardCard: "border-0 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
  
  // Card de detalle con borde
  detailCard: "border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
  
  // Card de imagen/evidencia
  imageCard: "overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700",
  
  // Línea decorativa superior
  topLine: {
    base: "absolute top-0 left-0 right-0 h-1",
    blue: "absolute top-0 left-0 right-0 h-1 bg-blue-500",
    green: "absolute top-0 left-0 right-0 h-1 bg-green-500",
    red: "absolute top-0 left-0 right-0 h-1 bg-red-500",
    orange: "absolute top-0 left-0 right-0 h-1 bg-orange-500",
    yellow: "absolute top-0 left-0 right-0 h-1 bg-yellow-500",
    purple: "absolute top-0 left-0 right-0 h-1 bg-purple-500",
    cyan: "absolute top-0 left-0 right-0 h-1 bg-cyan-500",
    emerald: "absolute top-0 left-0 right-0 h-1 bg-emerald-500",
    gray: "absolute top-0 left-0 right-0 h-1 bg-gray-600",
  },
  
  // Headers con gradiente (para cards de detalle)
  gradientHeader: {
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 sm:p-2",
    green: "bg-gradient-to-r from-emerald-500 to-emerald-600 p-1.5 sm:p-2",
    cyan: "bg-gradient-to-r from-cyan-500 to-cyan-600 p-1.5 sm:p-2",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 p-1.5 sm:p-2",
    orange: "bg-gradient-to-r from-orange-500 to-orange-600 p-1.5 sm:p-2",
  },
  
  // Padding del contenido - Mejorado para móvil
  content: "p-4 sm:p-5 md:p-6 pt-5 sm:pt-6 md:pt-7", // Con línea superior
  contentNormal: "p-4 sm:p-5 md:p-6", // Normal
  contentSmall: "p-3 sm:p-3.5 md:p-4", // Pequeño (para filtros, etc.)
  contentXSmall: "p-2.5 sm:p-3", // Extra pequeño
};

// ============================================================================
// BOTONES - Estilo CONAP Estándar (Verde)
// ============================================================================

export const buttonStyles = {
  // Botón primario estándar (VERDE - Estilo CONAP)
  primary: "h-10 whitespace-nowrap text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white",
  
  // Botones estándar
  outline: "h-9 text-xs",
  
  // Botones con solo icono
  iconOnly: "h-9 px-3",
  iconOnlySmall: "h-8 w-8 p-0",
  
  // Botones de ancho completo
  fullWidth: "w-full h-10 whitespace-nowrap text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white",
  fullWidthLarge: "w-full h-10",
  
  // Botones de acción en cards
  cardAction: "flex-1 h-9",
  cardActionSmall: "flex-1 h-8 text-xs",
  
  // Botón primario responsive (para crear/nueva) - h-11 para coincidir con inputs
  createButton: "w-full sm:w-auto h-11 whitespace-nowrap text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white",
  
  // Botones del header (App.tsx)
  headerButton: "text-white border-white/20 hover:bg-white/20 hover:border-white/40 active:bg-white/30 bg-white/10 backdrop-blur-sm transition-all duration-200 h-9 w-9 md:h-10 md:w-10 lg:h-10 lg:w-10 p-0 flex items-center justify-center rounded-lg shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
  headerButtonDanger: "text-white border-white/20 hover:bg-red-500/80 hover:border-red-400/50 active:bg-red-600/80 bg-white/10 backdrop-blur-sm transition-all duration-200 h-9 w-9 md:h-10 md:w-10 lg:h-10 lg:w-10 p-0 flex items-center justify-center rounded-lg shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
  
  // Botón flotante de tema
  themeToggleMobile: "sm:hidden text-white border-white/20 hover:bg-white/20 hover:border-white/40 active:bg-white/30 bg-white/10 backdrop-blur-sm transition-all duration-200 h-9 w-9 p-0 flex items-center justify-center rounded-lg shadow-sm hover:shadow-md active:scale-95 touch-manipulation",
  themeToggleTablet: "hidden sm:flex lg:hidden text-white border-white/20 hover:bg-white/20 hover:border-white/40 active:bg-white/30 bg-white/10 backdrop-blur-sm transition-all duration-200 h-9 w-9 md:h-10 md:w-10 p-0 items-center justify-center rounded-lg shadow-sm hover:shadow-md active:scale-95 touch-manipulation",
  themeToggleFloating: "sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg border border-white/60 dark:border-gray-700/60 transition-all duration-300 hover:shadow-xl active:scale-95 h-12 w-12 p-0 flex items-center justify-center touch-manipulation",
  
  // Botón de carga masiva (secundario con icono)
  bulkUploadButton: "w-full sm:w-auto h-11 whitespace-nowrap text-xs sm:text-sm border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600",
};

// ============================================================================
// BADGES
// ============================================================================

export const badgeStyles = {
  // Badge base minimalista
  base: "text-xs font-normal px-2.5 py-0.5",
  
  // Estados
  estado: {
    reportado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700 text-xs font-normal px-2.5 py-0.5",
    enProgreso: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700 text-xs font-normal px-2.5 py-0.5",
    enAtencion: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700 text-xs font-normal px-2.5 py-0.5",
    pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 text-xs font-normal px-2.5 py-0.5",
    completada: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-normal px-2.5 py-0.5",
    resuelto: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-normal px-2.5 py-0.5",
    activo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-normal px-2.5 py-0.5",
    escalado: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs font-normal px-2.5 py-0.5",
    inactivo: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-700 text-xs font-normal px-2.5 py-0.5",
    cancelada: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700 text-xs font-normal px-2.5 py-0.5",
    // Estados de Hallazgos
    enInvestigacion: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-700 text-xs font-normal px-2.5 py-0.5",
    enProceso: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 text-xs font-normal px-2.5 py-0.5",
  },
  
  // Gravedad (para incidentes)
  gravedad: {
    critico: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700 text-xs font-normal px-2.5 py-0.5",
    grave: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs font-normal px-2.5 py-0.5",
    moderado: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 text-xs font-normal px-2.5 py-0.5",
    leve: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-normal px-2.5 py-0.5",
  },
  
  // Prioridad (debe coincidir con gravedad para estandarización)
  prioridad: {
    alta: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs font-normal px-2.5 py-0.5",
    media: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 text-xs font-normal px-2.5 py-0.5",
    baja: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700 text-xs font-normal px-2.5 py-0.5",
  },
};

// ============================================================================
// ICONOS
// ============================================================================

export const iconStyles = {
  // Icono pequeño (estándar para cards) - Mejorado para móvil
  small: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  
  // Icono mediano - Mejorado para móvil
  medium: "h-4 w-4 sm:h-5 sm:w-5",
  
  // Icono grande - Mejorado para móvil
  large: "h-5 w-5 sm:h-6 sm:w-6",
  
  // Icono en gris (para información secundaria) - Mejorado para móvil
  muted: "h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5",
  
  // Icono con margen derecho - Mejorado para móvil
  withMargin: "h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5",
};

// ============================================================================
// TIPOGRAFÍA
// ============================================================================

export const textStyles = {
  // Títulos de cards - Mejorado para móvil
  cardTitle: "text-sm sm:text-base font-medium mb-2.5 sm:mb-3 line-clamp-2",
  cardTitleLarge: "text-base sm:text-lg font-semibold mb-2.5 sm:mb-3 line-clamp-2",
  cardTitleSmall: "text-xs sm:text-sm font-medium mb-2 line-clamp-2",
  
  // Títulos de sección - Mejorado para móvil
  sectionTitle: "text-base sm:text-lg font-semibold",
  sectionTitleSmall: "text-sm sm:text-base font-semibold",
  
  // Texto principal - Mejorado para móvil
  primary: "text-sm sm:text-base text-gray-600 dark:text-gray-400",
  primaryDark: "text-sm sm:text-base text-gray-900 dark:text-gray-100",
  
  // Texto secundario - Mejorado para móvil
  secondary: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 mt-0.5",
  secondaryNoMargin: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-500",
  
  // Texto muted - Mejorado para móvil
  muted: "text-xs sm:text-sm text-gray-500 dark:text-gray-400",
  mutedSmall: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-400",
  
  // Etiquetas/Labels - Mejorado para móvil
  label: "text-xs sm:text-sm font-medium",
  labelSmall: "text-[11px] sm:text-xs font-medium",
  
  // Descripciones - Mejorado para móvil
  description: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2",
  descriptionLong: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-3",
};

// ============================================================================
// LAYOUT
// ============================================================================

export const layoutStyles = {
  // Contenedor principal con spacing - Mejorado para móvil
  container: "space-y-3 sm:space-y-3.5 md:space-y-4",
  containerSmall: "space-y-2.5 sm:space-y-3 md:space-y-4",
  
  // Grid de cards (responsive) - Mejorado para móvil
  cardGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5 md:gap-4",
  cardGridSmall: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4",
  cardGridTight: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3",
  
  // Flex layouts - Mejorado para móvil
  flexGap: "flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm",
  flexCenter: "flex items-center gap-1.5 sm:gap-2",
  flexBetween: "flex items-center justify-between gap-2",
  flexWrap: "flex flex-wrap gap-1.5 sm:gap-2",
  
  // Spacing vertical - Mejorado para móvil
  verticalSpacing: "space-y-2.5 sm:space-y-3",
  verticalSpacingSmall: "space-y-2",
  verticalSpacingLarge: "space-y-3.5 sm:space-y-4",
  
  // Separador sutil - Mejorado para móvil
  separator: "border-t border-gray-100 dark:border-gray-800",
  separatorWithPadding: "pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800",
  separatorWithMargin: "mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800",
  
  // Headers de sección - Mejorado para móvil
  sectionHeader: "flex items-center justify-between gap-2 mb-3 sm:mb-4",
  sectionHeaderSmall: "flex items-center justify-between gap-2 mb-2.5 sm:mb-3",
};

// ============================================================================
// ANIMACIONES (Motion React)
// ============================================================================

export const animationStyles = {
  // Animación de entrada para cards
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: (index: number) => ({ duration: 0.3, delay: index * 0.05 }),
  },
  
  // Animación hover sutil
  hoverScale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
  
  // Props para motion.div de cards
  cardMotion: (index: number = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: index * 0.05 },
  }),
};

// ============================================================================
// DASHBOARD - Estilos específicos
// ============================================================================

export const dashboardStyles = {
  // Gradientes para cards de estadísticas
  gradients: {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    green: "bg-gradient-to-br from-green-500 to-green-600",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600",
    cyan: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    red: "bg-gradient-to-br from-red-500 to-red-600",
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  },
  
  // Logo container del header
  logoContainer: "w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
  
  // Avatar container del header
  avatarContainer: "w-9 h-9 md:w-10 md:h-10 lg:w-10 lg:w-10 xl:w-11 xl:h-11 bg-white/15 backdrop-blur-sm rounded-full items-center justify-center hidden lg:flex transition-all duration-200 hover:bg-white/25 active:bg-white/30 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95",
  
  // Switch de tema (desktop)
  themeSwitch: "hidden sm:flex items-center gap-2 sm:gap-2.5 md:gap-3 px-2.5 py-2 md:px-3 md:py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg md:rounded-xl shadow-lg border border-white/60 dark:border-gray-700/60 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100 min-h-[44px]",
};

// ============================================================================
// FILTROS Y BÚSQUEDA - Diseño Minimalista CONAP
// ============================================================================
// 
// PATRÓN DE USO ESTÁNDAR:
// 
// <div className={filterStyles.filterGroupNoBorder}>
//   {/* Búsqueda */}
//   <div className={filterStyles.searchContainer}>
//     <div className={filterStyles.searchContainerWrapper}>
//       <Search className={filterStyles.searchIcon} />
//       <Input className={filterStyles.searchInput} placeholder="Buscar..." />
//     </div>
//   </div>
//   
//   {/* Filtro Select */}
//   <div className={filterStyles.selectWrapper}>
//     <Select>
//       <SelectTrigger className={filterStyles.selectTrigger}>
//         <SelectValue placeholder="Filtrar..." />
//       </SelectTrigger>
//       <SelectContent>...</SelectContent>
//     </Select>
//   </div>
//   
//   {/* Botón Acción */}
//   <Button className={buttonStyles.createButton}>
//     <Plus className="h-4 w-4 mr-2" />
//     Nuevo
//   </Button>
// </div>
//
// ============================================================================

export const filterStyles = {
  // Contenedor de filtros - más espaciado y limpio
  container: "flex flex-col sm:flex-row gap-3 items-start sm:items-center",
  containerTight: "flex flex-col gap-2",
  
  // Barra de búsqueda minimalista - altura fija h-11 (44px)
  searchContainer: "flex-1 w-full",
  searchContainerWrapper: "relative h-11",
  searchIcon: "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500",
  searchInput: "pl-10 h-11 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:border-gray-300 dark:focus:border-gray-600 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500",
  
  // Select/Filtros minimalistas - altura fija !h-11 (44px) - !important para sobrescribir shadcn
  selectWrapper: "w-full sm:w-48",
  selectWrapperSmall: "w-full sm:w-40",
  selectTrigger: "!h-11 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:border-gray-300 dark:focus:border-gray-600 transition-all duration-200 text-gray-600 dark:text-gray-400",
  
  // Grupo de filtros (búsqueda + selects) con fondo sutil
  filterGroup: "bg-white dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm",
  filterGroupNoBorder: "flex flex-col sm:flex-row gap-3 items-stretch sm:items-center",
};

// ============================================================================
// COLORES DINÁMICOS
// ============================================================================

export const getEstadoBadgeClass = (estado: string): string => {
  const estadoLower = estado.toLowerCase().replace(/\s+/g, '');
  
  switch (estadoLower) {
    // Estados de guardarecursos
    case 'activo':
    case 'activa':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700';
    case 'suspendido':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700';
    case 'desactivado':
    case 'inactivo':
    case 'inactiva':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700';
    
    // Estados de hallazgos
    case 'reportado':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-300 dark:border-blue-700';
    case 'eninvestigación':
    case 'eninvestigacion':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-300 dark:border-gray-700';
    case 'enproceso':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700';
    case 'resuelto':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700';
    
    // Estados de actividades
    case 'programada':
      return badgeStyles.estado.reportado;
    case 'enprogreso':
      return badgeStyles.estado.enProgreso;
    case 'enatencion':
      return badgeStyles.estado.inactivo;
    case 'pendiente':
      return badgeStyles.estado.pendiente;
    case 'completada':
      return badgeStyles.estado.completada;
    case 'escalado':
      return badgeStyles.estado.escalado;
    case 'cancelada':
      return badgeStyles.estado.cancelada;
    default:
      return badgeStyles.estado.inactivo;
  }
};

export const getGravedadBadgeClass = (gravedad: string): string => {
  const gravedadLower = gravedad.toLowerCase();
  
  switch (gravedadLower) {
    case 'crítico':
    case 'critico':
      return badgeStyles.gravedad.critico;
    case 'grave':
      return badgeStyles.gravedad.grave;
    case 'moderado':
      return badgeStyles.gravedad.moderado;
    case 'leve':
      return badgeStyles.gravedad.leve;
    default:
      return badgeStyles.gravedad.leve;
  }
};

export const getPrioridadBadgeClass = (prioridad: string): string => {
  const prioridadLower = prioridad.toLowerCase();
  
  switch (prioridadLower) {
    case 'crítica':
    case 'critica':
    case 'crítico':
    case 'critico':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700 text-xs font-normal px-2.5 py-0.5';
    case 'alta':
    case 'grave':
      return badgeStyles.prioridad.alta;
    case 'media':
    case 'moderado':
      return badgeStyles.prioridad.media;
    case 'baja':
    case 'leve':
      return badgeStyles.prioridad.baja;
    default:
      return badgeStyles.prioridad.baja;
  }
};

export const getTopLineColor = (gravedad: string): string => {
  const gravedadLower = gravedad.toLowerCase();
  
  switch (gravedadLower) {
    case 'crítico':
    case 'critico':
      return cardStyles.topLine.red;
    case 'grave':
      return cardStyles.topLine.orange;
    case 'moderado':
      return cardStyles.topLine.yellow;
    case 'leve':
      return cardStyles.topLine.green;
    default:
      return cardStyles.topLine.blue;
  }
};

export const getEstadoTopLineColor = (estado: string): string => {
  const estadoLower = estado.toLowerCase().replace(/\s+/g, '');
  
  switch (estadoLower) {
    case 'activo':
    case 'activa':
    case 'operativo':
    case 'habilitado':
      return cardStyles.topLine.green;
    case 'suspendido':
    case 'enreparacion':
    case 'enreparación':
      return cardStyles.topLine.orange;
    case 'desactivado':
    case 'inactivo':
    case 'inactiva':
    case 'inhabilitado':
      return cardStyles.topLine.red;
    default:
      return cardStyles.topLine.blue;
  }
};

export const getActividadTopLineColor = (estado: string): string => {
  const estadoLower = estado.toLowerCase().replace(/\s+/g, '');
  
  switch (estadoLower) {
    case 'programada':
      return cardStyles.topLine.blue;
    case 'enprogreso':
      return cardStyles.topLine.yellow;
    case 'completada':
      return cardStyles.topLine.green;
    default:
      return cardStyles.topLine.blue;
  }
};

export const getTopLineColorByEstado = (estado: string): string => {
  const estadoLower = estado.toLowerCase().replace(/\\s+/g, '');
  
  switch (estadoLower) {
    case 'reportado':
      return cardStyles.topLine.blue;
    case 'enatencion':
    case 'enatención':
      return cardStyles.topLine.purple;
    case 'escalado':
      return cardStyles.topLine.orange;
    case 'resuelto':
      return cardStyles.topLine.green;
    default:
      return cardStyles.topLine.blue;
  }
};

// ============================================================================
// IMÁGENES Y EVIDENCIAS
// ============================================================================

export const imageStyles = {
  // Contenedor de imagen con aspect ratio
  container: "aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative group cursor-pointer",
  containerRounded: "aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative group cursor-pointer rounded-lg overflow-hidden",
  
  // Placeholder de imagen
  placeholder: "aspect-square bg-gray-100 dark:bg-gray-800",
  
  // Overlay para hover
  overlay: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center",
  
  // Grid de imágenes
  grid: "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4",
  gridTight: "grid grid-cols-2 sm:grid-cols-3 gap-2",
};

// ============================================================================
// CONTENEDORES ESPECIALES
// ============================================================================

export const containerStyles = {
  // Sidebar trigger (menú)
  sidebarTrigger: "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white transition-all duration-200 border-0 backdrop-blur-sm flex-shrink-0 active:scale-95 shadow-sm hover:shadow-md",
  
  // Contenedores con borde
  bordered: "border border-gray-200 dark:border-gray-700 rounded-lg p-4",
  borderedSmall: "border border-gray-200 dark:border-gray-700 rounded-lg p-3",
  
  // Contenedor de grupo de botones
  buttonGroup: "flex gap-2",
  buttonGroupTight: "flex gap-1.5",
};

// ============================================================================
// ESTADOS Y FEEDBACK
// ============================================================================

export const stateStyles = {
  // Estados de carga
  loading: "opacity-50 pointer-events-none",
  disabled: "opacity-50 cursor-not-allowed",
  
  // Estados visuales
  active: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
  inactive: "bg-gray-50 dark:bg-gray-900/20 border-gray-300",
  
  // Hover genérico
  hover: "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200",
};

// ============================================================================
// CARDS DE LISTADO - Diseño Estándar CONAP (Basado en Áreas Protegidas)
// ============================================================================

export const listCardStyles = {
  // Card principal de listado
  card: "hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700",
  
  // Contenido del card (con padding-top extra para línea decorativa) - Mejorado para móvil
  content: "p-4 sm:p-5 md:p-6 pt-5 sm:pt-6 md:pt-7",
  
  // Header del card (título y acciones) - Mejorado para móvil
  header: "flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4",
  headerContent: "flex-1 min-w-0",
  headerActions: "flex gap-1 sm:gap-1.5 flex-shrink-0",
  
  // Título del card - Mejorado para móvil
  title: "text-sm sm:text-base font-bold mb-2.5 sm:mb-3",
  
  // Badge/Estado - Mejorado para móvil
  badge: "text-[11px] sm:text-xs font-normal px-2 sm:px-2.5 py-0.5",
  badgeContainer: "flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2",
  
  // Sección de información (iconos + texto) - Mejorado para móvil
  infoSection: "space-y-2.5 sm:space-y-3",
  infoItem: "flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm",
  infoIcon: "h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5",
  infoText: "text-gray-600 dark:text-gray-400 text-xs sm:text-sm",
  
  // Descripción/Footer del card - Mejorado para móvil
  description: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800",
  
  // Botones de acción - Mejorado para móvil (área táctil más grande)
  actionButton: "h-9 w-9 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 touch-manipulation",
  actionButtonEdit: "h-9 w-9 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 touch-manipulation",
  actionButtonDelete: "h-9 w-9 sm:h-8 sm:w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 touch-manipulation",
  actionButtonToggle: "h-9 w-9 sm:h-8 sm:w-8 touch-manipulation",
  
  // Botones de activar/desactivar (estandarizado para guardarecursos y áreas) - Mejorado para móvil
  actionButtonDeactivate: "h-9 w-9 sm:h-8 sm:w-8 text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 touch-manipulation",
  actionButtonActivate: "h-9 w-9 sm:h-8 sm:w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 touch-manipulation",
};

// ============================================================================
// FORMULARIOS - Diseño Minimalista CONAP
// ============================================================================
// 
// PATRÓN DE USO ESTÁNDAR:
// 
// <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//   <DialogContent className={formStyles.dialogContent}>
//     <DialogHeader className={formStyles.dialogHeader}>
//       <DialogTitle className={formStyles.dialogTitle}>Título</DialogTitle>
//       <DialogDescription className={formStyles.dialogDescription}>Descripción</DialogDescription>
//     </DialogHeader>
//     
//     <form onSubmit={handleSubmit} className={formStyles.form}>
//       {/* Alerta informativa opcional */}
//       <div className={formStyles.alert}>Mensaje informativo</div>
//       
//       {/* Sección de campos */}
//       <div className={formStyles.section}>
//         <h3 className={formStyles.sectionTitle}>Título de Sección</h3>
//         <div className={formStyles.grid}>
//           <div className={formStyles.field}>
//             <Label className={formStyles.label}>Campo *</Label>
//             <Input className={formStyles.input} />
//           </div>
//         </div>
//       </div>
//       
//       {/* Footer con botones */}
//       <div className={formStyles.footer}>
//         <Button variant="outline" className={formStyles.cancelButton}>Cancelar</Button>
//         <Button className={formStyles.submitButton}>Guardar</Button>
//       </div>
//     </form>
//   </DialogContent>
// </Dialog>

export const formStyles = {
  // Dialog/Modal del formulario (2 tamaños: estándar y pequeño) - Mejorado para móvil
  dialogContent: "w-[98vw] sm:w-[95vw] md:w-[90vw] max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6",
  dialogContentLarge: "w-[98vw] sm:w-[95vw] md:w-[90vw] max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6",
  
  // Header del dialog (minimalista) - Mejorado para móvil
  dialogHeader: "pb-2.5 sm:pb-3 border-b border-gray-200 dark:border-gray-700",
  dialogTitle: "text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white leading-tight",
  dialogDescription: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1",
  
  // Formulario principal (espaciado compacto) - Mejorado para móvil
  form: "space-y-3.5 sm:space-y-4 pt-2.5 sm:pt-3",
  
  // Secciones del formulario - Mejorado para móvil
  section: "space-y-2.5 sm:space-y-3",
  sectionTitle: "font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300 pb-1.5 sm:pb-2 border-b border-gray-100 dark:border-gray-800",
  
  // Grid de campos (responsive) - Mejorado para móvil
  grid: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3",
  gridSingle: "grid grid-cols-1 gap-2.5 sm:gap-3",
  gridTriple: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3",
  
  // Campo individual (espaciado minimalista) - Mejorado para móvil
  field: "space-y-1.5",
  fieldFullWidth: "space-y-1.5 sm:col-span-2",
  fieldFullWidthTriple: "space-y-1.5 sm:col-span-2 lg:col-span-3",
  
  // Labels (minimalistas, texto pequeño) - Mejorado para móvil
  label: "text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400",
  labelWithIcon: "text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5",
  
  // Valores de solo lectura (para vistas de detalles) - Mejorado para móvil
  readOnlyValue: "text-xs sm:text-sm text-gray-900 dark:text-gray-100 mt-1",
  
  // Inputs (altura fija 40px móvil, 44px táctil) - Mejorado para móvil
  input: "h-11 text-sm sm:text-base",
  inputPassword: "h-11 pr-10 text-sm sm:text-base",
  
  // Textarea - Mejorado para móvil
  textarea: "min-h-[80px] text-sm sm:text-base",
  textareaLarge: "min-h-[120px] text-sm sm:text-base",
  
  // Select (altura consistente con inputs) - Mejorado para móvil
  selectTrigger: "h-11 text-sm sm:text-base",
  
  // Botón de calendario (para date picker) - Mejorado para móvil
  calendarButton: "w-full justify-start text-left h-11 text-sm sm:text-base",
  
  // Botón de toggle de password - Mejorado para móvil (área táctil más grande)
  passwordToggle: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md active:bg-gray-100 dark:active:bg-gray-800",
  
  // Footer de botones (espaciado reducido) - Mejorado para móvil
  footer: "flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700",
  
  // Botones del footer (altura consistente 44px táctil) - Mejorado para móvil
  cancelButton: "w-full sm:w-auto h-11 text-sm sm:text-base",
  submitButton: "w-full sm:w-auto h-11 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base",
  
  // Alerts informativos (minimalistas) - Mejorado para móvil
  alert: "rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2.5 sm:p-3 text-xs sm:text-sm text-green-800 dark:text-green-300",
  alertWarning: "rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-2.5 sm:p-3 text-xs sm:text-sm text-yellow-800 dark:text-yellow-300",
  alertError: "rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-2.5 sm:p-3 text-xs sm:text-sm text-red-800 dark:text-red-300",
  alertInfo: "rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-2.5 sm:p-3 text-xs sm:text-sm text-blue-800 dark:text-blue-300",
  
  // Alert con contenido estructurado (con icono) - Mejorado para móvil
  alertWithIcon: "rounded-lg p-2.5 sm:p-3 md:p-4",
  alertWithIconContainer: "flex gap-2 sm:gap-2.5 md:gap-3",
  alertWithIconIcon: "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5",
  alertWithIconContent: "flex-1 min-w-0",
  alertWithIconTitle: "text-xs sm:text-sm font-medium",
  alertWithIconList: "text-xs sm:text-sm mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 list-decimal list-inside",
  
  // Código inline en alerts - Mejorado para móvil
  codeInline: "px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono",
};

// ============================================================================
// FORMULARIOS DE CAMBIO DE CONTRASEÑA - Diseño Ultra Minimalista CONAP
// ============================================================================
//
// PATRÓN DE USO PARA CAMBIO DE CONTRASEÑA:
//
// <Dialog open={isOpen} onOpenChange={handleClose}>
//   <DialogContent className={passwordFormStyles.dialogContent}>
//     <DialogHeader className={passwordFormStyles.dialogHeader}>
//       <DialogTitle className={passwordFormStyles.dialogTitle}>Cambiar Contraseña</DialogTitle>
//       <DialogDescription className={passwordFormStyles.dialogDescription}>Descripción</DialogDescription>
//     </DialogHeader>
//     
//     <form onSubmit={handleSubmit} className={passwordFormStyles.form}>
//       {/* Alerta de usuario objetivo (solo para admin) */}
//       <div className={passwordFormStyles.userInfoAlert}>
//         <div className={passwordFormStyles.userInfoContainer}>
//           <User className={passwordFormStyles.userInfoIcon} />
//           <div className={passwordFormStyles.userInfoContent}>
//             <span className={passwordFormStyles.userInfoName}>Juan Pérez</span>
//             <div className={passwordFormStyles.userInfoRole}>
//               <Shield className="h-3 w-3" />
//               Coordinador
//             </div>
//             <span className={passwordFormStyles.userInfoEmail}>juan@example.com</span>
//           </div>
//         </div>
//       </div>
//       
//       {/* Campos de contraseña */}
//       <div className={passwordFormStyles.field}>
//         <Label className={passwordFormStyles.label}>Nueva Contraseña *</Label>
//         <div className="relative">
//           <Input className={passwordFormStyles.inputPassword} />
//           <button className={passwordFormStyles.passwordToggle}>...</button>
//         </div>
//         <p className={passwordFormStyles.hint}>Mínimo 6 caracteres</p>
//       </div>
//       
//       {/* Footer */}
//       <div className={passwordFormStyles.footer}>
//         <Button variant="outline" className={passwordFormStyles.cancelButton}>Cancelar</Button>
//         <Button className={passwordFormStyles.submitButton}>Cambiar Contraseña</Button>
//       </div>
//     </form>
//   </DialogContent>
// </Dialog>

export const passwordFormStyles = {
  // Dialog (tamaño mediano compacto) - Mejorado para móvil
  dialogContent: "w-[98vw] sm:w-[95vw] md:w-[90vw] max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6",
  
  // Header - Mejorado para móvil
  dialogHeader: "pb-2.5 sm:pb-3 border-b border-gray-200 dark:border-gray-700",
  dialogTitle: "text-base sm:text-lg md:text-xl font-medium text-gray-900 dark:text-white leading-tight",
  dialogDescription: "text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1",
  
  // Form - Mejorado para móvil
  form: "space-y-3.5 sm:space-y-4 pt-2.5 sm:pt-3",
  
  // Alerta de información del usuario (para admin) - Mejorado para móvil
  userInfoAlert: "rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-2.5 sm:p-3",
  userInfoContainer: "flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm",
  userInfoIcon: "h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400",
  userInfoContent: "flex flex-col gap-0.5 sm:gap-1 text-blue-800 dark:text-blue-300 min-w-0",
  userInfoName: "font-medium truncate",
  userInfoRole: "flex items-center gap-1 text-[11px] sm:text-xs opacity-90",
  userInfoEmail: "text-[11px] sm:text-xs opacity-80 truncate",
  
  // Campos - Mejorado para móvil
  field: "space-y-1.5",
  label: "text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400",
  inputPassword: "h-11 pr-10 text-sm sm:text-base",
  passwordToggle: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md active:bg-gray-100 dark:active:bg-gray-800",
  hint: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1",
  
  // Footer - Mejorado para móvil
  footer: "flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700",
  cancelButton: "w-full sm:w-auto h-11 text-sm sm:text-base",
  submitButton: "w-full sm:w-auto h-11 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base",
};

// ============================================================================
// HEADER/TOPBAR - Diseño Ultra Minimalista CONAP
// ============================================================================
//
// PATRÓN DE USO PARA HEADER:
//
// <header className={headerStyles.container}>
//   <div className={headerStyles.left}>
//     <SidebarTrigger className={headerStyles.menuButton}>
//       <Menu className={headerStyles.menuIcon} />
//     </SidebarTrigger>
//     <div className={headerStyles.moduleIcon}>
//       <Icon className={headerStyles.moduleIconSvg} />
//     </div>
//     <button className={headerStyles.moduleTitle}>
//       <h2 className={headerStyles.moduleName}>Título</h2>
//       <p className={headerStyles.moduleCategory}>Categoría</p>
//     </button>
//   </div>
//   <div className={headerStyles.right}>
//     <div className={headerStyles.userInfo}>
//       <div className={headerStyles.userName}>Usuario</div>
//       <div className={headerStyles.userRole}>Rol</div>
//     </div>
//     <ThemeToggle />
//     <Button className={headerStyles.iconButton}>...</Button>
//   </div>
// </header>

export const headerStyles = {
  // Header principal (minimalista, altura fija 56px)
  container: "sticky top-0 z-20 border-b border-green-700 dark:border-green-900 px-3 sm:px-4 md:px-5 py-2.5 h-14 flex items-center justify-between bg-green-600 dark:bg-green-800 shadow-sm",
  
  // Sección izquierda (menú + módulo)
  left: "flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0",
  
  // Botón de menú (hamburger)
  menuButton: "flex items-center justify-center w-9 h-9 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors border-0 flex-shrink-0",
  menuIcon: "h-4 w-4",
  
  // Icono del módulo actual
  moduleIcon: "hidden sm:flex items-center justify-center w-9 h-9 rounded-md bg-white/10 flex-shrink-0",
  moduleIconSvg: "h-4.5 w-4.5 text-white",
  
  // Título del módulo (clickeable para scroll to top)
  moduleTitle: "text-left hover:opacity-90 transition-opacity min-w-0 flex-1",
  moduleName: "text-sm sm:text-base font-medium text-white truncate leading-tight",
  moduleCategory: "text-xs text-green-50/80 truncate hidden sm:block leading-tight",
  
  // Sección derecha (usuario + acciones)
  right: "flex items-center gap-2 flex-shrink-0",
  
  // Info del usuario (visible en desktop y tablet)
  userInfo: "text-right hidden md:block",
  userName: "font-medium text-white text-sm leading-tight",
  userRole: "text-xs text-green-50/80 flex items-center gap-1.5 justify-end leading-tight",
  userRoleDot: "w-1.5 h-1.5 rounded-full bg-green-300",
  
  // Contenedor de botones de acción
  actions: "hidden sm:flex items-center gap-2",
  
  // Avatar de usuario (desktop)
  avatar: "w-9 h-9 bg-white/10 rounded-full items-center justify-center hidden lg:flex hover:bg-white/20 transition-colors cursor-pointer",
  avatarIcon: "h-4 w-4 text-white",
  
  // Botones de acción (cambiar contraseña, logout)
  iconButton: "text-white border-white/20 hover:bg-white/20 bg-white/10 transition-colors h-9 w-9 p-0 flex items-center justify-center rounded-md",
  iconButtonLogout: "text-white border-white/20 hover:bg-red-500/90 bg-white/10 transition-colors h-9 w-9 p-0 flex items-center justify-center rounded-md",
  iconButtonIcon: "h-4 w-4",
  
  // Menú móvil (dropdown)
  mobileMenu: "sm:hidden",
  mobileMenuButton: "text-white border-white/20 hover:bg-white/20 bg-white/10 transition-colors h-9 w-9 p-0 flex items-center justify-center rounded-md",
  mobileMenuDropdown: "w-56 mt-2",
  mobileMenuLabel: "px-2 py-2",
  mobileMenuUserContainer: "flex items-center gap-2.5",
  mobileMenuAvatar: "w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0",
  mobileMenuAvatarIcon: "h-4 w-4 text-green-600 dark:text-green-400",
  mobileMenuUserInfo: "flex flex-col gap-0.5 min-w-0 flex-1",
  mobileMenuUserName: "text-sm font-medium leading-none truncate text-gray-900 dark:text-gray-100",
  mobileMenuUserRole: "text-xs leading-none text-gray-600 dark:text-gray-400 flex items-center gap-1.5",
  mobileMenuItem: "py-2 cursor-pointer",
  mobileMenuItemIcon: "mr-2 h-4 w-4",
};

// ============================================================================
// TABLAS - Diseño Minimalista CONAP
// ============================================================================

export const tableStyles = {
  // Contenedor de la tabla - Mejorado para móvil
  container: "overflow-x-auto -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6",
  card: "border-gray-200 dark:border-gray-700",
  cardContent: "p-0",
  
  // Headers de la tabla - Mejorado para móvil
  header: "border-b border-gray-200 dark:border-gray-700 hover:bg-transparent",
  headerCell: "text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 h-10 sm:h-11 whitespace-nowrap",
  headerCellMin: "min-w-[160px] sm:min-w-[180px] text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 h-10 sm:h-11 whitespace-nowrap",
  headerCellRight: "text-right min-w-[120px] sm:min-w-[140px] text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 h-10 sm:h-11 whitespace-nowrap",
  
  // Filas de la tabla - Mejorado para móvil
  row: "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors",
  cell: "py-3 sm:py-3.5",
  
  // Avatar circular en tabla (guardarecursos/usuarios)
  // Variante por defecto (verde - Activo)
  avatar: {
    container: "w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0",
    icon: "h-4 w-4 text-green-700 dark:text-green-400",
  },
  
  // Avatar por estado
  avatarByEstado: {
    // Activo - Verde
    activo: {
      container: "w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center flex-shrink-0",
      icon: "h-4 w-4 text-green-700 dark:text-green-400",
    },
    // Suspendido - Naranja
    suspendido: {
      container: "w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center flex-shrink-0",
      icon: "h-4 w-4 text-orange-700 dark:text-orange-400",
    },
    // Desactivado - Gris
    desactivado: {
      container: "w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 flex items-center justify-center flex-shrink-0",
      icon: "h-4 w-4 text-gray-700 dark:text-gray-400",
    },
  },
  
  // Información del usuario en tabla - Mejorado para móvil
  userInfo: {
    container: "flex items-center gap-2 sm:gap-2.5",
    content: "min-w-0",
    name: "text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
    email: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 truncate",
  },
  
  // Estado badge en tabla - Mejorado para móvil
  badge: "text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 whitespace-nowrap",
  
  // Info con icono en tabla - Mejorado para móvil
  infoWithIcon: {
    container: "flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400",
    icon: "h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0",
    text: "truncate",
    textMono: "font-mono text-[11px] sm:text-xs",
  },
  
  // Acciones en tabla - Mejorado para móvil (área táctil más grande)
  actions: {
    container: "flex items-center justify-end gap-0.5 sm:gap-1",
    button: "h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation",
    buttonView: "h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 touch-manipulation",
    buttonEdit: "h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 touch-manipulation",
    buttonPassword: "h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 touch-manipulation",
    buttonDelete: "h-9 w-9 sm:h-8 sm:w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 touch-manipulation",
    buttonState: (estado: string) => {
      const baseClasses = "h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation";
      if (estado === 'Activo') {
        return `${baseClasses} hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400`;
      } else if (estado === 'Suspendido') {
        return `${baseClasses} hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400`;
      } else {
        return `${baseClasses} hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400`;
      }
    },
    icon: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  },
  
  // Estado vacío en tabla - Mejorado para móvil
  emptyState: {
    container: "text-center py-8 sm:py-10 md:py-12 text-muted-foreground border-t border-gray-100 dark:border-gray-800",
    iconContainer: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
    icon: "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-gray-400 dark:text-gray-600",
    title: "text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1",
    description: "text-[11px] sm:text-xs text-gray-500 dark:text-gray-500",
  },
};

// ============================================================================
// ALERTAS/CONFIRMACIONES - Diseño Unificado CONAP
// ============================================================================

export const alertDialogStyles = {
  // Contenedor del AlertDialog (tamaño estándar) - Mejorado para móvil
  content: "w-[96vw] sm:w-[95vw] max-w-md p-5 sm:p-6",
  contentLarge: "w-[96vw] sm:w-[95vw] max-w-lg p-5 sm:p-6",
  
  // Header del alert - Mejorado para móvil
  header: "space-y-2 sm:space-y-3",
  title: "text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight",
  titleWithIcon: "flex items-center gap-2 text-base sm:text-lg",
  
  // Descripción del alert - Mejorado para móvil
  description: "space-y-3 sm:space-y-4",
  descriptionText: "text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed",
  
  // Info box genérico (para mensajes importantes) - Mejorado para móvil
  infoBox: "p-2.5 sm:p-3 rounded-lg border",
  infoBoxGreen: "p-2.5 sm:p-3 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
  infoBoxOrange: "p-2.5 sm:p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
  infoBoxRed: "p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  infoBoxGray: "p-2.5 sm:p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
  infoBoxBlue: "p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  
  // Texto dentro del info box - Mejorado para móvil
  infoText: "text-xs sm:text-sm",
  infoTextGreen: "text-xs sm:text-sm text-green-700 dark:text-green-400",
  infoTextOrange: "text-xs sm:text-sm text-orange-700 dark:text-orange-400",
  infoTextRed: "text-xs sm:text-sm text-red-700 dark:text-red-400",
  infoTextGray: "text-xs sm:text-sm text-gray-700 dark:text-gray-400",
  infoTextBlue: "text-xs sm:text-sm text-blue-700 dark:text-blue-400",
  
  // Highlight del estado/texto importante
  highlight: "font-semibold",
  highlightGreen: "font-semibold text-green-600 dark:text-green-400",
  highlightOrange: "font-semibold text-orange-600 dark:text-orange-400",
  highlightRed: "font-semibold text-red-600 dark:text-red-400",
  highlightGray: "font-semibold text-gray-600 dark:text-gray-400",
  highlightBlue: "font-semibold text-blue-600 dark:text-blue-400",
  
  // Footer con botones - Mejorado para móvil
  footer: "flex-col-reverse sm:flex-row gap-2 mt-2 sm:mt-3",
  
  // BOTONES ESTÁNDAR PARA TODOS LOS ALERTDIALOGS - Mejorado para móvil (44px táctil)
  // Botón de Cancelar (outline gris) - ESTÁNDAR GLOBAL
  cancelButton: "w-full sm:w-auto h-11 text-sm sm:text-base border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800",
  
  // Botón de Confirmar (verde CONAP) - ESTÁNDAR GLOBAL
  confirmButton: "w-full sm:w-auto h-11 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white",
  
  // Variantes de botón confirmar (para casos especiales)
  confirmButtonOrange: "w-full sm:w-auto h-11 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 text-white",
  confirmButtonRed: "w-full sm:w-auto h-11 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white",
  confirmButtonBlue: "w-full sm:w-auto h-11 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white",
};

// ============================================================================
// ALERTAS DE CAMBIO DE ESTADO - Funciones Helper (Retrocompatibilidad)
// ============================================================================

export const estadoAlertStyles = {
  // Contenedor del AlertDialog
  content: alertDialogStyles.content,
  
  // Header del alert
  header: alertDialogStyles.header,
  title: alertDialogStyles.title,
  
  // Descripción del alert
  description: alertDialogStyles.description,
  descriptionText: alertDialogStyles.descriptionText,
  
  // Info box con color según estado
  infoBox: (nuevoEstado: string) => {
    if (nuevoEstado === 'Activo' || nuevoEstado === 'Operativo' || nuevoEstado === 'Habilitado') {
      return alertDialogStyles.infoBoxGreen;
    } else if (nuevoEstado === 'Suspendido' || nuevoEstado === 'En Reparación') {
      return alertDialogStyles.infoBoxOrange;
    } else if (nuevoEstado === 'Desactivado' || nuevoEstado === 'Fuera de Servicio' || nuevoEstado === 'Inhabilitado') {
      return alertDialogStyles.infoBoxGray;
    } else {
      return alertDialogStyles.infoBoxBlue;
    }
  },
  
  // Texto dentro del info box
  infoText: (nuevoEstado: string) => {
    if (nuevoEstado === 'Activo' || nuevoEstado === 'Operativo' || nuevoEstado === 'Habilitado') {
      return alertDialogStyles.infoTextGreen;
    } else if (nuevoEstado === 'Suspendido' || nuevoEstado === 'En Reparación') {
      return alertDialogStyles.infoTextOrange;
    } else if (nuevoEstado === 'Desactivado' || nuevoEstado === 'Fuera de Servicio' || nuevoEstado === 'Inhabilitado') {
      return alertDialogStyles.infoTextGray;
    } else {
      return alertDialogStyles.infoTextBlue;
    }
  },
  
  // Highlight del estado en el texto
  estadoHighlight: (nuevoEstado: string) => {
    if (nuevoEstado === 'Activo' || nuevoEstado === 'Operativo' || nuevoEstado === 'Habilitado') {
      return alertDialogStyles.highlightGreen;
    } else if (nuevoEstado === 'Suspendido' || nuevoEstado === 'En Reparación') {
      return alertDialogStyles.highlightOrange;
    } else if (nuevoEstado === 'Desactivado' || nuevoEstado === 'Fuera de Servicio' || nuevoEstado === 'Inhabilitado') {
      return alertDialogStyles.highlightGray;
    } else {
      return alertDialogStyles.highlightBlue;
    }
  },
  
  // Footer con botones
  footer: alertDialogStyles.footer,
  
  // Botones
  cancelButton: alertDialogStyles.cancelButton,
  confirmButton: alertDialogStyles.confirmButton,
};

// ============================================================================
// GALERÍA DE EVIDENCIAS FOTOGRÁFICAS - Diseño Minimalista CONAP
// ============================================================================

export const galleryStyles = {
  // Grid de galería (responsive) - Más columnas para cards más pequeños
  grid: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4",
  gridCompact: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
  
  // Card de foto (minimalista)
  photoCard: "overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700",
  
  // Contenedor de imagen placeholder - Más pequeño
  imageContainer: "aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative group cursor-pointer",
  imagePlaceholderIcon: "h-10 w-10 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors duration-200",
  
  // Overlay de hover simple
  imageOverlay: "absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center",
  imageOverlayButton: "opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg",
  imageOverlayIcon: "h-4 w-4 text-gray-700 dark:text-gray-300",
  
  // Contenido del card - Menos padding
  photoContent: "p-3",
  photoTitle: "text-xs font-medium line-clamp-2 mb-2",
  
  // Información de la foto (iconos + texto) - Más compacto
  photoInfoSection: "space-y-2",
  photoInfoItem: "flex items-start gap-1.5 text-xs",
  photoInfoIcon: "h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5",
  photoInfoText: "text-gray-600 dark:text-gray-400 text-xs truncate",
  
  // Botones de acción en la foto - Más pequeños
  photoActions: "flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800",
  photoActionButton: "flex-1 h-7 text-xs px-2",
  photoActionButtonIcon: "h-7 w-7 p-0",
  
  // Área de carga de fotos (drag & drop)
  uploadArea: "border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
  uploadIcon: "h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500",
  uploadText: "text-sm text-gray-600 dark:text-gray-400 mb-3",
  uploadHint: "text-xs text-gray-500 dark:text-gray-500 mt-2",
  
  // Dialog de vista detallada
  viewDialog: "w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6",
  viewImageContainer: "aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg relative",
  viewImagePlaceholder: "h-16 w-16 sm:h-24 sm:w-24 text-gray-300 dark:text-gray-600",
  
  // Info grid en vista detallada
  viewInfoGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
  viewInfoSection: "space-y-3 sm:space-y-4",
  viewInfoLabel: "text-xs text-gray-500 dark:text-gray-400",
  viewInfoValue: "mt-1 text-sm",
  
  // Usuario en vista detallada
  viewUserContainer: "mt-1 flex items-center gap-2",
  viewUserAvatar: "w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0",
  viewUserAvatarIcon: "h-4 w-4 text-green-600 dark:text-green-400",
  viewUserInfo: "min-w-0",
  viewUserName: "text-sm font-medium truncate",
  viewUserRole: "text-xs text-gray-500 dark:text-gray-400 truncate",
};

// ============================================================================
// TABS MINIMALISTAS - Diseño CONAP
// ============================================================================
// 
// PATRÓN DE USO ESTÁNDAR:
// 
// <div className={tabStyles.container}>
//   <button className={tabStyles.tab(activeTab === 'activos')}>
//     <Activity className={tabStyles.icon} />
//     Activos
//   </button>
//   <button className={tabStyles.tab(activeTab === 'historial')}>
//     <History className={tabStyles.icon} />
//     Historial
//   </button>
// </div>
//
// ============================================================================

export const tabStyles = {
  // Contenedor de tabs (pills horizontales) - Mejorado para móvil
  container: "inline-flex items-center gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
  
  // Tab individual (función que recibe si está activo) - Mejorado para móvil
  tab: (isActive: boolean) => 
    isActive
      ? "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation"
      : "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-xs sm:text-sm touch-manipulation",
  
  // Icono dentro del tab - Mejorado para móvil
  icon: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  
  // Variante compacta (más pequeña) - Mejorado para móvil
  containerCompact: "inline-flex items-center gap-1 sm:gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
  
  tabCompact: (isActive: boolean) => 
    isActive
      ? "inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 text-[11px] sm:text-xs font-medium touch-manipulation"
      : "inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-[11px] sm:text-xs touch-manipulation",
  
  iconCompact: "h-3 w-3 sm:h-3.5 sm:w-3.5",
  
  // Variante ancho completo (responsive) - Mejorado para móvil
  containerFull: "flex items-center gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
  
  tabFull: (isActive: boolean) => 
    isActive
      ? "flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation whitespace-nowrap"
      : "flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-xs sm:text-sm touch-manipulation whitespace-nowrap",
};

// ============================================================================
// LOGIN - Diseño CONAP con Galería de Imágenes
// ============================================================================
//
// PATRÓN DE USO ESTÁNDAR:
//
// <div className={loginStyles.container}>
//   {/* Toggle de tema */}
//   <div className={loginStyles.themeToggle}>
//     <ThemeToggle />
//   </div>
//   
//   {/* Galería de fondo */}
//   <div className={loginStyles.backgroundGallery}>
//     <div className={loginStyles.backgroundImage}>
//       <img src={...} className={loginStyles.backgroundImageImg} />
//       <div className={loginStyles.backgroundOverlay} />
//     </div>
//   </div>
//   
//   {/* Logo flotante */}
//   <div className={loginStyles.floatingLogo}>
//     <div className={loginStyles.logoContainer}>
//       <img src={...} className={loginStyles.logoImage} />
//     </div>
//     <div className={loginStyles.logoText}>
//       <h1 className={loginStyles.logoTitle}>CONAP</h1>
//       <p className={loginStyles.logoSubtitle}>...</p>
//     </div>
//   </div>
//   
//   {/* Indicadores */}
//   <div className={loginStyles.imageIndicators}>
//     <div className={loginStyles.indicator(isActive)} />
//   </div>
//   
//   {/* Card de login */}
//   <div className={loginStyles.formContainer}>
//     <Card className={loginStyles.card}>
//       <CardHeader className={loginStyles.cardHeader}>
//         <div className={loginStyles.cardLogo}>
//           <img src={...} className={loginStyles.cardLogoImage} />
//         </div>
//         <CardTitle className={loginStyles.cardTitle}>Iniciar Sesión</CardTitle>
//         <CardDescription className={loginStyles.cardDescription}>...</CardDescription>
//       </CardHeader>
//       <CardContent className={loginStyles.cardContent}>
//         <form className={loginStyles.form}>
//           <div className={loginStyles.field}>
//             <Label className={loginStyles.label}>Email</Label>
//             <Input className={loginStyles.input} />
//           </div>
//           <div className={loginStyles.field}>
//             <Label className={loginStyles.label}>Contraseña</Label>
//             <div className={loginStyles.passwordContainer}>
//               <Input className={loginStyles.inputPassword} />
//               <button className={loginStyles.passwordToggle}>...</button>
//             </div>
//           </div>
//           <Button className={loginStyles.submitButton}>Iniciar Sesión</Button>
//         </form>
//       </CardContent>
//     </Card>
//   </div>
// </div>
//
// ============================================================================

export const loginStyles = {
  // Contenedor principal (pantalla completa)
  container: "min-h-screen w-full relative overflow-hidden flex items-center justify-center px-4 sm:px-4 md:px-6",
  
  // Toggle de tema (esquina superior derecha)
  themeToggle: "absolute top-2 right-2 sm:top-4 sm:right-4 z-30",
  
  // Galería de fondo
  backgroundGallery: "absolute inset-0 z-0",
  backgroundImage: "absolute inset-0",
  backgroundImageImg: "w-full h-full object-cover",
  backgroundOverlay: "absolute inset-0 bg-gradient-to-br from-green-900/70 via-emerald-900/60 to-blue-900/70 dark:from-green-950/85 dark:via-emerald-950/75 dark:to-blue-950/85 sm:from-green-900/60 sm:via-emerald-900/50 sm:to-blue-900/60 dark:sm:from-green-950/80 dark:sm:via-emerald-950/70 dark:sm:to-blue-950/80",
  
  // Logo flotante (arriba a la izquierda)
  floatingLogo: "absolute top-2 left-2 sm:top-6 sm:left-6 md:top-8 md:left-8 z-20 text-white flex items-center gap-1.5 sm:gap-2 md:gap-3",
  logoContainer: "w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center p-2 sm:p-2 md:p-2.5 ring-1 sm:ring-2 ring-white/30 shadow-lg",
  logoImage: "w-full h-full object-contain",
  logoText: "hidden sm:block",
  logoTitle: "text-base sm:text-lg md:text-xl font-bold leading-tight",
  logoSubtitle: "text-xs sm:text-sm text-white/90 hidden lg:block leading-tight",
  
  // Indicadores de imagen (abajo centro)
  imageIndicators: "absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 px-4 py-2.5 rounded-full bg-black/20 backdrop-blur-sm",
  indicator: (isActive: boolean) =>
    isActive
      ? "rounded-full transition-all duration-500 w-8 sm:w-10 md:w-12 h-1 sm:h-1 md:h-1.5 bg-white shadow-lg"
      : "rounded-full transition-all duration-500 w-4 sm:w-5 md:w-6 h-1 sm:h-1 md:h-1.5 bg-white/30",
  
  // Contenedor del formulario (centrado)
  formContainer: "w-full max-w-[90%] sm:max-w-md md:max-w-lg relative z-20 mx-auto",
  
  // Card de login
  card: "w-full shadow-2xl border-0 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-xl sm:rounded-2xl",
  cardHeader: "text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8",
  cardContent: "space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6",
  
  // Logo dentro del card
  cardLogo: "mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-full flex items-center justify-center p-2.5 sm:p-3 md:p-4 ring-2 ring-green-200 dark:ring-green-800 shadow-lg",
  cardLogoImage: "w-full h-full object-contain",
  
  // Títulos del card
  cardTitle: "text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent",
  cardDescription: "text-sm sm:text-base",
  
  // Formulario
  form: "space-y-3 sm:space-y-4",
  field: "space-y-1.5 sm:space-y-2",
  label: "text-sm sm:text-base",
  input: "h-10 sm:h-11 text-sm sm:text-base",
  
  // Campo de contraseña
  passwordContainer: "relative",
  inputPassword: "h-10 sm:h-11 pr-10 text-sm sm:text-base",
  passwordToggle: "absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent",
  passwordToggleIcon: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  
  // Botón submit
  submitButton: "w-full h-10 sm:h-11 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white",
  
  // Alert de error
  alert: "py-2.5 sm:py-3",
  alertDescription: "text-xs sm:text-sm",
};

// ============================================================================
// ÁREA PROTEGIDA DETALLE - Diseño Único con Mapa Decorativo
// ============================================================================
//
// PATRÓN DE USO ESTÁNDAR:
//
// <div className={areaDetalleStyles.container}>
//   {/* Título */}
//   <motion.div className={areaDetalleStyles.title}>
//     <h2 className={areaDetalleStyles.titleText}>{area.nombre}</h2>
//   </motion.div>
//   
//   {/* Descripción */}
//   <motion.p className={areaDetalleStyles.description}>
//     {area.descripcion}
//   </motion.p>
//   
//   {/* Grid principal */}
//   <div className={areaDetalleStyles.grid}>
//     {/* Mapa decorativo */}
//     <motion.div className={areaDetalleStyles.mapContainer}>
//       <div className={areaDetalleStyles.mapCircles}>
//         <div className={areaDetalleStyles.circleOuter} />
//         <div className={areaDetalleStyles.circleMiddle} />
//         <div className={areaDetalleStyles.circleCenterPoint} />
//       </div>
//     </motion.div>
//     
//     {/* Cards de información */}
//     <motion.div className={areaDetalleStyles.infoColumn}>
//       <Card className={areaDetalleStyles.infoCard}>
//         <div className={areaDetalleStyles.infoCardHeaderBlue}>
//           <div className={areaDetalleStyles.infoCardHeaderContent}>
//             <MapPin className={areaDetalleStyles.infoCardHeaderIcon} />
//             <span className={areaDetalleStyles.infoCardHeaderText}>Ubicación</span>
//           </div>
//         </div>
//         <CardContent className={areaDetalleStyles.infoCardContent}>
//           <p className={textStyles.primaryDark}>{data}</p>
//         </CardContent>
//       </Card>
//     </motion.div>
//   </div>
// </div>
//
// ============================================================================

export const areaDetalleStyles = {
  // Contenedor principal
  container: "space-y-4",
  
  // Título con fondo emerald
  title: "bg-emerald-600 rounded-lg px-4 py-3",
  titleText: "text-white",
  
  // Descripción centrada
  description: "text-center",
  
  // Grid principal (mapa + info)
  grid: "grid grid-cols-1 md:grid-cols-2 gap-4",
  
  // Mapa decorativo
  mapContainer: "flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg p-8",
  
  // Contenedor de círculos concéntricos
  mapCircles: "relative w-48 h-48 flex items-center justify-center",
  
  // Círculo exterior (línea punteada)
  circleOuter: "absolute inset-0 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-full opacity-40",
  
  // Círculo medio
  circleMiddle: "absolute inset-8 border-2 border-emerald-400 dark:border-emerald-600 rounded-full opacity-50",
  
  // Punto central (marcador de ubicación)
  circleCenterPoint: "w-16 h-16 bg-red-500 rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800",
  
  // Columna de información
  infoColumn: "space-y-3 flex flex-col justify-center",
  
  // Card de información base
  infoCard: "overflow-hidden border-0 shadow-sm",
  
  // Headers de cards con gradientes (por tipo de información)
  infoCardHeaderBlue: "bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2",
  infoCardHeaderGreen: "bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2",
  infoCardHeaderCyan: "bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-2",
  
  // Contenido del header (icono + texto)
  infoCardHeaderContent: "flex items-center gap-2",
  infoCardHeaderIcon: "h-4 w-4 text-white",
  infoCardHeaderText: "text-white text-sm",
  
  // Contenido del card
  infoCardContent: "px-3 py-2 bg-white dark:bg-gray-900",
};

// ============================================================================
// HELPER: Combinar clases de Tailwind
// ============================================================================

export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
