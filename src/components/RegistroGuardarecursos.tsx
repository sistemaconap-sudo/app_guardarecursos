import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Plus, Edit, Search, Users, FileText, Mail, Phone, CheckCircle2, XCircle, Ban, UserX, User, IdCard, Briefcase, MapPin, Shield, Info, Lock, Eye, EyeOff, KeyRound, ChevronDown, FileBarChart } from 'lucide-react';
import { Guardarecurso, Usuario, AreaProtegida } from '../types';
import { toast } from 'sonner@2.0.3';
import { CambiarContrasenaAdmin } from './CambiarContrasenaAdmin';
import { generarReporteActividadesMensual } from './ReporteActividadesMensual';
import { buttonStyles, filterStyles, formStyles, tableStyles, estadoAlertStyles, getEstadoBadgeClass, cardStyles } from '../styles/shared-styles';
import { guardarecursosService, EstadoPendiente, GuardarecursoFormData } from '../utils/guardarecursosService';
import { areasProtegidasService } from '../utils/areasProtegidasService';
import { gestionUsuariosService } from '../utils/gestionUsuariosService';
import { isValidSecurePassword } from '../utils/validators';
import { forceLogout } from '../utils/base-api-service';

interface RegistroGuardarecursosProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  currentUser?: any;
}

// ===== COMPONENTES MEMOIZADOS =====

/**
 * Card de guardarecurso para vista móvil - Memoizado
 */
interface GuardarecursoCardProps {
  guardarecurso: Guardarecurso;
  area?: AreaProtegida;
  onEdit: (g: Guardarecurso) => void;
  onGenerateReport: (g: Guardarecurso) => void;
  onChangePassword: (g: Guardarecurso) => void;
  onEstadoClick: (id: string, estado: 'Activo' | 'Suspendido' | 'Desactivado') => void;
  canChangePassword: boolean;
}

const GuardarecursoCard = memo(({
  guardarecurso,
  area,
  onEdit,
  onGenerateReport,
  onChangePassword,
  onEstadoClick,
  canChangePassword
}: GuardarecursoCardProps) => {
  const handleEdit = useCallback(() => onEdit(guardarecurso), [onEdit, guardarecurso]);
  const handleReport = useCallback(() => onGenerateReport(guardarecurso), [onGenerateReport, guardarecurso]);
  const handlePassword = useCallback(() => onChangePassword(guardarecurso), [onChangePassword, guardarecurso]);
  
  return (
    <Card className="relative overflow-hidden border-gray-200 dark:border-gray-700">
      {/* Línea superior indicando estado */}
      <div className={
        guardarecurso.estado === 'Activo'
          ? cardStyles.topLine.green
          : guardarecurso.estado === 'Suspendido'
          ? cardStyles.topLine.orange
          : cardStyles.topLine.gray
      }></div>
      <CardContent className="p-4 pt-5">
        {/* Header con avatar y estado */}
        <div className="flex items-start gap-3 mb-4">
          <div className={
            guardarecurso.estado === 'Activo'
              ? 'w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0'
              : guardarecurso.estado === 'Suspendido'
              ? 'w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0'
              : 'w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0'
          }>
            <User className={
              guardarecurso.estado === 'Activo'
                ? 'h-6 w-6 text-green-600 dark:text-green-400'
                : guardarecurso.estado === 'Suspendido'
                ? 'h-6 w-6 text-orange-600 dark:text-orange-400'
                : 'h-6 w-6 text-gray-600 dark:text-gray-400'
            } />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {guardarecurso.nombre} {guardarecurso.apellido}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {guardarecurso.email}
            </p>
            <div className="mt-2">
              <Badge className={`${getEstadoBadgeClass(guardarecurso.estado)} text-xs`}>
                {guardarecurso.estado}
              </Badge>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="space-y-2.5 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm">
            <IdCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">
              {guardarecurso.dpi}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-400 truncate">
              {area?.nombre || 'Sin asignar'}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReport}
            className="w-full h-10 text-xs"
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Reporte
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="w-full h-10 text-xs"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {canChangePassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePassword}
              className="w-full h-10 text-xs"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Contraseña
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`w-full h-10 text-xs ${
                  guardarecurso.estado === 'Activo'
                    ? 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-700'
                    : guardarecurso.estado === 'Suspendido'
                    ? 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700'
                    : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                }`}
              >
                {guardarecurso.estado === 'Activo' ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : guardarecurso.estado === 'Suspendido' ? (
                  <Ban className="h-4 w-4 mr-2" />
                ) : (
                  <UserX className="h-4 w-4 mr-2" />
                )}
                Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Activo')}
                className="cursor-pointer text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-600" />
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Suspendido')}
                className="cursor-pointer text-xs"
              >
                <Ban className="h-3.5 w-3.5 mr-2 text-orange-600" />
                Suspendido
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Desactivado')}
                className="cursor-pointer text-xs"
              >
                <UserX className="h-3.5 w-3.5 mr-2 text-gray-600" />
                Desactivado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
});

GuardarecursoCard.displayName = 'GuardarecursoCard';

/**
 * Fila de tabla de guardarecurso para vista desktop - Memoizada
 */
interface GuardarecursoRowProps {
  guardarecurso: Guardarecurso;
  area?: AreaProtegida;
  onEdit: (g: Guardarecurso) => void;
  onGenerateReport: (g: Guardarecurso) => void;
  onChangePassword: (g: Guardarecurso) => void;
  onEstadoClick: (id: string, estado: 'Activo' | 'Suspendido' | 'Desactivado') => void;
  canChangePassword: boolean;
}

const GuardarecursoRow = memo(({
  guardarecurso,
  area,
  onEdit,
  onGenerateReport,
  onChangePassword,
  onEstadoClick,
  canChangePassword
}: GuardarecursoRowProps) => {
  const handleEdit = useCallback(() => onEdit(guardarecurso), [onEdit, guardarecurso]);
  const handleReport = useCallback(() => onGenerateReport(guardarecurso), [onGenerateReport, guardarecurso]);
  const handlePassword = useCallback(() => onChangePassword(guardarecurso), [onChangePassword, guardarecurso]);
  
  return (
    <TableRow className={tableStyles.row}>
      {/* Nombre Completo */}
      <TableCell className={tableStyles.cell}>
        <div className={tableStyles.userInfo.container}>
          <div className={
            guardarecurso.estado === 'Activo'
              ? tableStyles.avatarByEstado.activo.container
              : guardarecurso.estado === 'Suspendido'
              ? tableStyles.avatarByEstado.suspendido.container
              : tableStyles.avatarByEstado.desactivado.container
          }>
            <User className={
              guardarecurso.estado === 'Activo'
                ? tableStyles.avatarByEstado.activo.icon
                : guardarecurso.estado === 'Suspendido'
                ? tableStyles.avatarByEstado.suspendido.icon
                : tableStyles.avatarByEstado.desactivado.icon
            } />
          </div>
          <div className={tableStyles.userInfo.content}>
            <div className={tableStyles.userInfo.name}>
              {guardarecurso.nombre} {guardarecurso.apellido}
            </div>
            <div className={tableStyles.userInfo.email}>
              {guardarecurso.email}
            </div>
          </div>
        </div>
      </TableCell>
      
      {/* Estado */}
      <TableCell className={tableStyles.cell}>
        <Badge 
          className={`${getEstadoBadgeClass(guardarecurso.estado)} ${tableStyles.badge}`}
        >
          {guardarecurso.estado}
        </Badge>
      </TableCell>
      
      {/* DPI */}
      <TableCell className={tableStyles.cell}>
        <div className={tableStyles.infoWithIcon.container}>
          <IdCard className={tableStyles.infoWithIcon.icon} />
          <span className={tableStyles.infoWithIcon.textMono}>{guardarecurso.dpi}</span>
        </div>
      </TableCell>
      
      {/* Área */}
      <TableCell className={tableStyles.cell}>
        <div className={tableStyles.infoWithIcon.container}>
          <MapPin className={tableStyles.infoWithIcon.icon} />
          <span className={tableStyles.infoWithIcon.text}>{area?.nombre || 'Sin asignar'}</span>
        </div>
      </TableCell>
      
      {/* Acciones */}
      <TableCell className={tableStyles.cell}>
        <div className={tableStyles.actions.container}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            title="Generar informe mensual"
            className={tableStyles.actions.buttonView}
          >
            <FileBarChart className={tableStyles.actions.icon} />
          </Button>
          {canChangePassword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePassword}
              title="Cambiar contraseña"
              className={tableStyles.actions.buttonPassword}
            >
              <KeyRound className={tableStyles.actions.icon} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            title="Editar información"
            className={tableStyles.actions.buttonEdit}
          >
            <Edit className={tableStyles.actions.icon} />
          </Button>
          
          {/* Dropdown para cambiar estado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title={`Cambiar estado (actual: ${guardarecurso.estado})`}
                className={tableStyles.actions.buttonState(guardarecurso.estado)}
              >
                {guardarecurso.estado === 'Activo' ? (
                  <CheckCircle2 className={tableStyles.actions.icon} />
                ) : guardarecurso.estado === 'Suspendido' ? (
                  <Ban className={tableStyles.actions.icon} />
                ) : (
                  <UserX className={tableStyles.actions.icon} />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Activo')}
                className="cursor-pointer text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-600" />
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Suspendido')}
                className="cursor-pointer text-xs"
              >
                <Ban className="h-3.5 w-3.5 mr-2 text-orange-600" />
                Suspendido
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEstadoClick(guardarecurso.id, 'Desactivado')}
                className="cursor-pointer text-xs"
              >
                <UserX className="h-3.5 w-3.5 mr-2 text-gray-600" />
                Desactivado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});

GuardarecursoRow.displayName = 'GuardarecursoRow';

// ===== COMPONENTE PRINCIPAL =====

export function RegistroGuardarecursos({ userPermissions, currentUser }: RegistroGuardarecursosProps) {
  const [guardarecursosList, setGuardarecursosList] = useState<Guardarecurso[]>([]);
  const [usuariosList, setUsuariosList] = useState<any[]>([]);
  const [areasProtegidas, setAreasProtegidas] = useState<AreaProtegida[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuardarecurso, setEditingGuardarecurso] = useState<Guardarecurso | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [guardarecursoToChangePassword, setGuardarecursoToChangePassword] = useState<any>(null);
  const [isEstadoAlertOpen, setIsEstadoAlertOpen] = useState(false);
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoPendiente | null>(null);
  
  // Estados para el diálogo de selección de año de reporte
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [guardarecursoForReport, setGuardarecursoForReport] = useState<Guardarecurso | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [formData, setFormData] = useState(guardarecursosService.createEmptyFormData());
  const [dpiDuplicado, setDpiDuplicado] = useState(false);
  const [correoDuplicado, setCorreoDuplicado] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  /**
   * Carga guardarecursos desde el backend - Memoizado
   * 🔒 SEGURIDAD: Si hay error, limpia TODO y redirige al login
   */
  const loadGuardarecursos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await guardarecursosService.fetchGuardarecursos();
      setGuardarecursosList(data);
    } catch (error: any) {
      console.error('❌ ERROR AL CARGAR GUARDARECURSOS:', error);
      // Solo forzar logout si es un error 401 (no autorizado)
      // NO forzar logout por errores de conexión (Edge Function no desplegada)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - FORZANDO LOGOUT');
        forceLogout();
      } else {
        // Mostrar el error sin forzar logout
        toast.error('Error al cargar guardarecursos', {
          description: 'Verifica que la Edge Function esté desplegada en Supabase.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carga áreas protegidas - Memoizado
   * 🔒 SEGURIDAD: Si hay error, limpia TODO y redirige al login
   */
  const loadAreasProtegidas = useCallback(async () => {
    try {
      const data = await areasProtegidasService.fetchAreasProtegidas();
      setAreasProtegidas(data);
    } catch (error: any) {
      console.error('❌ ERROR AL CARGAR ÁREAS PROTEGIDAS:', error);
      // Solo forzar logout si es un error 401 (no autorizado)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - FORZANDO LOGOUT');
        forceLogout();
      }
    }
  }, []);

  /**
   * Carga usuarios (Administradores y Coordinadores) desde el backend - Memoizado
   * 🔒 SEGURIDAD: Si hay error, limpia TODO y redirige al login
   */
  const loadUsuarios = useCallback(async () => {
    try {
      const data = await gestionUsuariosService.fetchUsuarios();
      setUsuariosList(data);
    } catch (error: any) {
      console.error('❌ ERROR AL CARGAR USUARIOS:', error);
      // Solo forzar logout si es un error 401 (no autorizado)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - FORZANDO LOGOUT');
        forceLogout();
      }
    }
  }, []);

  // Cargar guardarecursos, áreas y usuarios al montar el componente
  useEffect(() => {
    loadGuardarecursos();
    loadAreasProtegidas();
    loadUsuarios();
  }, [loadGuardarecursos, loadAreasProtegidas, loadUsuarios]);

  /**
   * Filtrar guardarecursos - Memoizado
   * OPTIMIZADO: Filtrado simple sin dependencia de usuarios
   */
  const filteredGuardarecursos = useMemo(() => {
    return guardarecursosList.filter(g => {
      // Excluir desactivados
      if (g.estado === 'Desactivado') {
        return false;
      }
      
      // Filtrar por búsqueda
      const matchesSearch = 
        g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.dpi.includes(searchTerm) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrar por área
      const matchesArea = !selectedArea || selectedArea === 'all' || g.areaAsignada === selectedArea;
      
      return matchesSearch && matchesArea;
    });
  }, [guardarecursosList, searchTerm, selectedArea]);

  /**
   * Filtrar solo áreas activas y ordenarlas alfabéticamente - Memoizado
   */
  const areasActivasProtegidas = useMemo(() => {
    return areasProtegidas
      .filter(area => area.estado === 'Activo')
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [areasProtegidas]);

  /**
   * Mapa de áreas por ID - Memoizado para búsquedas rápidas
   */
  const areasMap = useMemo(() => {
    return new Map(areasProtegidas.map(area => [area.id, area]));
  }, [areasProtegidas]);

  /**
   * Handler para enviar formulario - Memoizado
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar duplicados antes de enviar (solo al crear)
    if (!editingGuardarecurso) {
      if (dpiDuplicado) {
        toast.error('DPI duplicado', {
          description: 'Este número de DPI ya está en uso por otro usuario del sistema.'
        });
        return;
      }
      if (correoDuplicado) {
        toast.error('Correo duplicado', {
          description: 'Este correo electrónico ya está en uso por otro usuario del sistema.'
        });
        return;
      }
      
      // Validar contraseña segura (solo al crear)
      const passwordValidation = isValidSecurePassword(formData.password);
      if (!passwordValidation.isValid) {
        toast.error('Contraseña no cumple los requisitos', {
          description: passwordValidation.errors[0]
        });
        return;
      }
    }
    
    try {
      if (editingGuardarecurso) {
        await guardarecursosService.updateGuardarecursoAPI(
          editingGuardarecurso.id,
          formData
        );
        
        toast.success('Guardarecurso actualizado', {
          description: 'Los datos del guardarecurso han sido actualizados correctamente.'
        });
      } else {
        await guardarecursosService.createGuardarecursoAPI(formData);
        
        toast.success('Guardarecurso creado exitosamente', {
          description: `Se ha creado el acceso al sistema para ${formData.nombre} ${formData.apellido} con la contraseña proporcionada.`
        });
      }
      
      await loadGuardarecursos();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('❌ ERROR AL GUARDAR GUARDARECURSO:', error);
      // Solo forzar logout si es un error 401 (no autorizado)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - FORZANDO LOGOUT');
        forceLogout();
      } else {
        toast.error('Error al guardar guardarecurso', {
          description: error?.message || 'Verifica que la Edge Function esté desplegada en Supabase.'
        });
      }
    }
  }, [editingGuardarecurso, formData, loadGuardarecursos, dpiDuplicado, correoDuplicado]);

  /**
   * Resetear formulario - Memoizado
   */
  const resetForm = useCallback(() => {
    setFormData(guardarecursosService.createEmptyFormData());
    setEditingGuardarecurso(null);
    setDpiDuplicado(false);
    setCorreoDuplicado(false);
    setPasswordErrors([]);
  }, []);

  /**
   * Verificar si el DPI ya existe en TODOS los usuarios del sistema - Memoizado
   */
  const verificarDpiDuplicado = useCallback((dpi: string) => {
    if (!dpi || editingGuardarecurso) {
      setDpiDuplicado(false);
      return;
    }
    
    const dpiLimpio = dpi.trim();
    
    // Buscar en guardarecursos
    const existeEnGuardarecursos = guardarecursosList.some(g => 
      g.dpi === dpiLimpio
    );
    
    // Buscar en usuarios (Administradores y Coordinadores)
    const existeEnUsuarios = usuariosList.some(u => 
      u.dpi === dpiLimpio
    );
    
    setDpiDuplicado(existeEnGuardarecursos || existeEnUsuarios);
  }, [guardarecursosList, usuariosList, editingGuardarecurso]);

  /**
   * Verificar si el correo ya existe en TODOS los usuarios del sistema - Memoizado
   */
  const verificarCorreoDuplicado = useCallback((email: string) => {
    if (!email || editingGuardarecurso) {
      setCorreoDuplicado(false);
      return;
    }
    
    const emailLimpio = email.toLowerCase().trim();
    
    // Buscar en guardarecursos
    const existeEnGuardarecursos = guardarecursosList.some(g => 
      g.email.toLowerCase() === emailLimpio
    );
    
    // Buscar en usuarios (Administradores y Coordinadores)
    const existeEnUsuarios = usuariosList.some(u => 
      u.email.toLowerCase() === emailLimpio
    );
    
    setCorreoDuplicado(existeEnGuardarecursos || existeEnUsuarios);
  }, [guardarecursosList, usuariosList, editingGuardarecurso]);

  /**
   * Handler para editar - Memoizado
   */
  const handleEdit = useCallback((guardarecurso: Guardarecurso) => {
    setFormData(guardarecursosService.guardarecursoToFormData(guardarecurso));
    setEditingGuardarecurso(guardarecurso);
    setDpiDuplicado(false); // Limpiar validación al editar
    setCorreoDuplicado(false); // Limpiar validación al editar
    setIsDialogOpen(true);
  }, []);

  /**
   * Handler para cambio de estado - Memoizado
   */
  const handleEstadoClick = useCallback((id: string, nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado') => {
    const guardarecurso = guardarecursosList.find(g => g.id === id);
    if (!guardarecurso) return;

    if (!guardarecursosService.isValidEstadoChange(guardarecurso.estado, nuevoEstado)) {
      toast.info('Sin cambios', {
        description: `El guardarecurso ya está en estado ${nuevoEstado}.`
      });
      return;
    }

    setEstadoPendiente(
      guardarecursosService.prepareEstadoPendiente(guardarecurso, nuevoEstado)
    );
    setIsEstadoAlertOpen(true);
  }, [guardarecursosList]);

  /**
   * Handler para generar reporte - Abre diálogo de selección de año
   */
  const handleGenerarReporte = useCallback((guardarecurso: Guardarecurso) => {
    setGuardarecursoForReport(guardarecurso);
    setSelectedYear(new Date().getFullYear());
    setIsYearDialogOpen(true);
  }, []);

  /**
   * Confirmar generación de reporte con año seleccionado
   */
  const confirmarGeneracionReporte = useCallback(async () => {
    if (!guardarecursoForReport) return;
    
    // Buscar el área asignada desde areasProtegidas (obtenida de base de datos)
    const area = areasProtegidas.find(a => a.id === guardarecursoForReport.areaAsignada);
    const areaNombre = area?.nombre || 'Sin asignar';
    
    // Cerrar diálogo
    setIsYearDialogOpen(false);
    
    // Generar reporte con año seleccionado
    await generarReporteActividadesMensual({ 
      guardarecurso: guardarecursoForReport, 
      areaNombre,
      año: selectedYear
    });
    
    // Limpiar estado
    setGuardarecursoForReport(null);
  }, [guardarecursoForReport, areasProtegidas, selectedYear]);

  /**
   * Confirmar cambio de estado - Memoizado
   */
  const confirmarCambioEstado = useCallback(async () => {
    if (!estadoPendiente) return;

    const { id, nuevoEstado, nombre } = estadoPendiente;

    try {
      console.log('🔄 Cambiando estado del guardarecurso:', { id, nuevoEstado, nombre });
      
      await guardarecursosService.cambiarEstadoGuardarecursoAPI(id, nuevoEstado);

      console.log('✅ Estado cambiado exitosamente');

      const mensaje = guardarecursosService.getEstadoMensaje(nuevoEstado);

      toast.success('Estado actualizado', {
        description: `${nombre} ha sido ${mensaje}.`
      });

      await loadGuardarecursos();

      setIsEstadoAlertOpen(false);
      setEstadoPendiente(null);
    } catch (error: any) {
      console.error('❌ ERROR AL CAMBIAR ESTADO:', error);
      // Solo forzar logout si es un error 401 (no autorizado)
      if (error?.statusCode === 401 || error?.message?.includes('401')) {
        console.error('❌ ERROR 401 - FORZANDO LOGOUT');
        forceLogout();
      } else {
        toast.error('Error al cambiar estado', {
          description: error?.message || 'Verifica que la Edge Function esté desplegada en Supabase.'
        });
      }
    }
  }, [estadoPendiente, loadGuardarecursos]);

  /**
   * Handler para cambiar contraseña - Memoizado
   */
  const handleChangePassword = useCallback((guardarecurso: Guardarecurso) => {
    const usuarioParaCambio = {
      id: guardarecurso.id,
      nombre: guardarecurso.nombre,
      apellido: guardarecurso.apellido,
      email: guardarecurso.email,
      rol: 'Guardarecurso'
    };
    setGuardarecursoToChangePassword(usuarioParaCambio);
    setIsPasswordDialogOpen(true);
  }, []);

  /**
   * Verificar si puede cambiar contraseñas - Memoizado
   */
  const canChangePassword = useMemo(() => 
    guardarecursosService.canChangePassword(currentUser),
    [currentUser]
  );

  return (
    <div className="space-y-4">
      {/* Barra superior con búsqueda y botón - Diseño Minimalista */}
      <div className={filterStyles.filterGroupNoBorder}>
        {/* Búsqueda */}
        <div className={filterStyles.searchContainer}>
          <div className={filterStyles.searchContainerWrapper}>
            <Search className={filterStyles.searchIcon} />
            <Input
              placeholder="Buscar por nombre, DPI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={filterStyles.searchInput}
            />
          </div>
        </div>

        {/* Filtro por área - Solo áreas activas */}
        {areasActivasProtegidas.length > 0 && (
          <div className={filterStyles.selectWrapper}>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className={filterStyles.selectTrigger}>
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areasActivasProtegidas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botón crear */}
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className={buttonStyles.createButton}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Dialog separado del Card */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
            <DialogHeader className={formStyles.dialogHeader}>
              <DialogTitle className={formStyles.dialogTitle}>
                {editingGuardarecurso ? 'Editar Guardarecurso' : 'Nuevo Guardarecurso'}
              </DialogTitle>
              <DialogDescription className={formStyles.dialogDescription}>
                Complete los datos del personal de guardarrecursos
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className={formStyles.form}>
              {/* Información Personal */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Información Personal</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="nombre" className={formStyles.label}>
                        Nombre *
                      </Label>
                      {editingGuardarecurso && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                    </div>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ingrese el nombre"
                      className={formStyles.input}
                      required
                      readOnly={!!editingGuardarecurso}
                      disabled={!!editingGuardarecurso}
                    />
                  </div>
                  
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="apellido" className={formStyles.label}>
                        Apellido *
                      </Label>
                      {editingGuardarecurso && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                    </div>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      placeholder="Ingrese el apellido"
                      className={formStyles.input}
                      required
                      readOnly={!!editingGuardarecurso}
                      disabled={!!editingGuardarecurso}
                    />
                  </div>

                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="dpi" className={formStyles.label}>
                        DPI *
                      </Label>
                      {editingGuardarecurso && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                      {!editingGuardarecurso && dpiDuplicado && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">DPI duplicado</span>
                      )}
                    </div>
                    <Input
                      id="dpi"
                      value={formData.dpi}
                      onChange={(e) => {
                        const newDpi = e.target.value;
                        setFormData({...formData, dpi: newDpi});
                        verificarDpiDuplicado(newDpi);
                      }}
                      placeholder="0000 00000 0000"
                      className={`${formStyles.input} ${!editingGuardarecurso && dpiDuplicado ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                      required
                      readOnly={!!editingGuardarecurso}
                      disabled={!!editingGuardarecurso}
                    />
                    {!editingGuardarecurso && dpiDuplicado && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Este número de DPI ya está en uso por otro usuario del sistema.
                      </p>
                    )}
                  </div>
                  
                  <div className={formStyles.field}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="telefono" className={formStyles.label}>
                        Teléfono *
                      </Label>
                    </div>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="+502 0000-0000"
                      className={formStyles.input}
                      required
                    />
                  </div>

                  <div className={formStyles.fieldFullWidth}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Label htmlFor="email" className={formStyles.label}>
                        Correo Electrónico *
                      </Label>
                      {editingGuardarecurso && (
                        <span className="text-xs text-muted-foreground italic">No editable</span>
                      )}
                      {!editingGuardarecurso && correoDuplicado && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Correo duplicado</span>
                      )}
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;
                        setFormData({...formData, email: newEmail});
                        verificarCorreoDuplicado(newEmail);
                      }}
                      placeholder="correo@ejemplo.com"
                      className={`${formStyles.input} ${!editingGuardarecurso && correoDuplicado ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                      required
                      readOnly={!!editingGuardarecurso}
                      disabled={!!editingGuardarecurso}
                    />
                    {!editingGuardarecurso && correoDuplicado && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Este correo electrónico ya está en uso por otro usuario del sistema.
                      </p>
                    )}
                  </div>
                  
                  {/* Solo mostrar campo de contraseña al CREAR, no al EDITAR */}
                  {!editingGuardarecurso && (
                    <div className={formStyles.fieldFullWidth}>
                      <Label htmlFor="password" className={formStyles.label}>Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => {
                            const newPassword = e.target.value;
                            setFormData({...formData, password: newPassword});
                            const validation = isValidSecurePassword(newPassword);
                            setPasswordErrors(validation.errors);
                          }}
                          placeholder="Ingrese la contraseña"
                          className={`${formStyles.inputPassword} ${passwordErrors.length > 0 && formData.password ? 'border-red-500 dark:border-red-500' : ''}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={formStyles.passwordToggle}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Requisitos de seguridad:
                        </p>
                        <ul className="text-xs space-y-0.5">
                          <li className={formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {formData.password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                          </li>
                          <li className={/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {/[0-9]/.test(formData.password) ? '✓' : '○'} Al menos un número
                          </li>
                          <li className={/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {/[A-Z]/.test(formData.password) ? '✓' : '○'} Al menos una mayúscula
                          </li>
                          <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                            {/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password) ? '✓' : '○'} Al menos un carácter especial
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información Laboral */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Información Laboral</h3>
                
                <div className={formStyles.field}>
                  <Label htmlFor="area" className={formStyles.label}>Área Asignada {!editingGuardarecurso && '*'}</Label>
                  {areasActivasProtegidas.length === 0 ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          No hay áreas protegidas activas disponibles. El guardarecurso puede ser creado sin área asignada.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Select value={formData.areaAsignada} onValueChange={(value) => setFormData({...formData, areaAsignada: value})}>
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue placeholder="Seleccione área (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {areasActivasProtegidas.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className={formStyles.footer}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className={formStyles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className={formStyles.submitButton}
                  disabled={!editingGuardarecurso && (dpiDuplicado || correoDuplicado || passwordErrors.length > 0)}
                >
                  {!editingGuardarecurso && (dpiDuplicado || correoDuplicado) 
                    ? 'Datos duplicados' 
                    : 'Guardar'}
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

      {/* Vista de Cards para móvil */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cargando guardarecursos...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredGuardarecursos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No se encontraron guardarecursos
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredGuardarecursos.map((guardarecurso) => (
            <GuardarecursoCard
              key={guardarecurso.id}
              guardarecurso={guardarecurso}
              area={areasMap.get(guardarecurso.areaAsignada)}
              onEdit={handleEdit}
              onGenerateReport={handleGenerarReporte}
              onChangePassword={handleChangePassword}
              onEstadoClick={handleEstadoClick}
              canChangePassword={canChangePassword}
            />
          ))
        )}
      </div>

      {/* Vista de Tabla para desktop */}
      <div className="hidden md:block">
        <Card className={tableStyles.card}>
          <CardContent className={tableStyles.cardContent}>
            {/* Scroll horizontal container */}
            <div className={tableStyles.container}>
              <Table>
                <TableHeader>
                  <TableRow className={tableStyles.header}>
                    <TableHead className={tableStyles.headerCellMin}>
                      Nombre Completo
                    </TableHead>
                    <TableHead className={tableStyles.headerCell}>
                      Estado
                    </TableHead>
                    <TableHead className={tableStyles.headerCell}>
                      DPI
                    </TableHead>
                    <TableHead className={tableStyles.headerCell}>
                      Área Asignada
                    </TableHead>
                    <TableHead className={tableStyles.headerCellRight}>
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuardarecursos.map((guardarecurso) => (
                    <GuardarecursoRow
                      key={guardarecurso.id}
                      guardarecurso={guardarecurso}
                      area={areasMap.get(guardarecurso.areaAsignada)}
                      onEdit={handleEdit}
                      onGenerateReport={handleGenerarReporte}
                      onChangePassword={handleChangePassword}
                      onEstadoClick={handleEstadoClick}
                      canChangePassword={canChangePassword}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredGuardarecursos.length === 0 && (
              <div className={tableStyles.emptyState.container}>
                <div className={tableStyles.emptyState.iconContainer}>
                  <Users className={tableStyles.emptyState.icon} />
                </div>
                <p className={tableStyles.emptyState.title}>
                  No se encontraron guardarecursos
                </p>
                <p className={tableStyles.emptyState.description}>
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para cambiar contraseña de guardarecurso */}
      {currentUser && guardarecursoToChangePassword && (
        <CambiarContrasenaAdmin
          isOpen={isPasswordDialogOpen}
          onClose={() => {
            setIsPasswordDialogOpen(false);
            setGuardarecursoToChangePassword(null);
          }}
          currentUser={currentUser}
          targetUser={guardarecursoToChangePassword}
        />
      )}

      {/* Alert Dialog para confirmar cambio de estado */}
      <AlertDialog open={isEstadoAlertOpen} onOpenChange={setIsEstadoAlertOpen}>
        <AlertDialogContent className={estadoAlertStyles.content}>
          <AlertDialogHeader className={estadoAlertStyles.header}>
            <AlertDialogTitle className={estadoAlertStyles.title}>
              ¿Confirmar cambio de estado?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={estadoAlertStyles.description}>
                {estadoPendiente && (
                  <>
                    <p className={estadoAlertStyles.descriptionText}>
                      Está a punto de cambiar el estado de{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {estadoPendiente.nombre}
                      </span>{' '}
                      a{' '}
                      <span className={estadoAlertStyles.estadoHighlight(estadoPendiente.nuevoEstado)}>
                        {estadoPendiente.nuevoEstado}
                      </span>
                    </p>
                    <div className={estadoAlertStyles.infoBox(estadoPendiente.nuevoEstado)}>
                      <p className={estadoAlertStyles.infoText(estadoPendiente.nuevoEstado)}>
                        {estadoPendiente.nuevoEstado === 'Activo' && (
                          <>El guardarecurso tendrá acceso completo al sistema.</>
                        )}
                        {estadoPendiente.nuevoEstado === 'Suspendido' && (
                          <>El guardarecurso NO podrá acceder al sistema.</>
                        )}
                        {estadoPendiente.nuevoEstado === 'Desactivado' && (
                          <>El guardarecurso desaparecerá del sistema completamente.</>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={estadoAlertStyles.footer}>
            <AlertDialogCancel 
              onClick={() => {
                setIsEstadoAlertOpen(false);
                setEstadoPendiente(null);
              }}
              className={estadoAlertStyles.cancelButton}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarCambioEstado}
              className={estadoAlertStyles.confirmButton}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para seleccionar año de reporte */}
      <AlertDialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
        <AlertDialogContent className={estadoAlertStyles.content}>
          <AlertDialogHeader className={estadoAlertStyles.header}>
            <AlertDialogTitle className={estadoAlertStyles.title}>
              Generar Reporte Mensual
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={estadoAlertStyles.description}>
                {guardarecursoForReport && (
                  <>
                    <p className={estadoAlertStyles.descriptionText}>
                      Está a punto de generar un informe mensual para{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {guardarecursoForReport.nombre} {guardarecursoForReport.apellido}
                      </span>
                    </p>
                    <div className={estadoAlertStyles.infoBox('Activo')}>
                      <p className={estadoAlertStyles.infoText('Activo')}>
                        Selecciona el año para el informe:
                      </p>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className={formStyles.selectTrigger}>
                          <SelectValue placeholder="Seleccione año" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={estadoAlertStyles.footer}>
            <AlertDialogCancel 
              onClick={() => {
                setIsYearDialogOpen(false);
                setGuardarecursoForReport(null);
              }}
              className={estadoAlertStyles.cancelButton}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarGeneracionReporte}
              className={estadoAlertStyles.confirmButton}
            >
              Generar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}