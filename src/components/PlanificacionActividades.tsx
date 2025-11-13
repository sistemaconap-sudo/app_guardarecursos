import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Edit, Search, Calendar as CalendarIcon, Clock, MapPin, Users, Shield, CheckCircle, AlertCircle, XCircle, Play, MoreVertical, Binoculars, Wrench, GraduationCap, Eye, Map, ChevronDown, Activity, User, FileText, Flame, TreePine, Sprout, Upload, Download } from 'lucide-react';
import { Actividad, Guardarecurso } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { actividadesSync } from '../utils/actividadesSync';
import { buttonStyles, filterStyles, badgeStyles, formStyles, listCardStyles, layoutStyles, cardStyles, getActividadTopLineColor } from '../styles/shared-styles';
import { actividadesService, ActividadFormData, TipoActividad, EstadoActividad } from '../utils/actividadesService';
import { fetchActividades, createActividadAPI, updateActividadAPI, deleteActividadAPI } from '../utils/actividadesAPI';
import { authService } from '../utils/authService';
import { guardarecursosService } from '../utils/guardarecursosService';
import { toast } from 'sonner@2.0.3';
import { forceLogout } from '../utils/base-api-service';

interface PlanificacionActividadesProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

// ===== COMPONENTES MEMOIZADOS =====

/**
 * Card de actividad - Memoizado
 */
interface ActividadCardProps {
  actividad: any;
  index: number;
  guardarecurso?: Guardarecurso;
  canEdit: boolean;
  onEdit: (actividad: Actividad) => void;
  getTipoColor: (tipo: string) => any;
  getEstadoInfo: (estado: EstadoActividad) => any;
  getTipoIcon: (tipo: string) => any;
}

const ActividadCard = memo(({
  actividad,
  index,
  guardarecurso,
  canEdit,
  onEdit,
  getTipoColor,
  getEstadoInfo,
  getTipoIcon
}: ActividadCardProps) => {
  const handleEdit = useCallback(() => onEdit(actividad), [onEdit, actividad]);
  const estadoInfo = getEstadoInfo(actividad.estado);
  const EstadoIcon = estadoInfo.icon;
  const TipoIcon = getTipoIcon(actividad.tipo);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={`${cardStyles.baseWithOverflow} ${listCardStyles.card}`}>
        <div className={getActividadTopLineColor(actividad.estado)} />
        <CardContent className={listCardStyles.content}>
          {/* Header con título y acciones */}
          <div className={listCardStyles.header}>
            <div className={listCardStyles.headerContent}>
              <h3 className={`${listCardStyles.title} line-clamp-2`}>
                {actividad.descripcion}
              </h3>
              <div className={listCardStyles.badgeContainer}>
                <Badge className={`${estadoInfo.badge} border ${listCardStyles.badge}`}>
                  {actividad.estado}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className={listCardStyles.actionButtonEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Información de la actividad */}
          <div className={listCardStyles.infoSection}>
            {/* Fecha */}
            <div className={listCardStyles.infoItem}>
              <CalendarIcon className={listCardStyles.infoIcon} />
              <span className={listCardStyles.infoText}>
                {actividad.fecha ? (() => {
                  // Parsear la fecha como fecha local para evitar problemas de zona horaria
                  const [year, month, day] = actividad.fecha.split('-').map(Number);
                  const fechaLocal = new Date(year, month - 1, day);
                  return fechaLocal.toLocaleDateString('es-GT', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  });
                })() : 'Fecha no especificada'}
              </span>
            </div>

            {/* Hora de Programación */}
            <div className={listCardStyles.infoItem}>
              <Clock className={listCardStyles.infoIcon} />
              <span className={listCardStyles.infoText}>
                {actividad.horaInicio}
              </span>
            </div>

            {/* Tipo de Actividad */}
            <div className={listCardStyles.infoItem}>
              <FileText className={listCardStyles.infoIcon} />
              <span className={listCardStyles.infoText}>
                {actividad.tipo}
              </span>
            </div>

            {/* Guardarecurso */}
            {guardarecurso && (
              <div className={listCardStyles.infoItem}>
                <User className={listCardStyles.infoIcon} />
                <span className={listCardStyles.infoText}>
                  {guardarecurso.nombre} {guardarecurso.apellido}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

ActividadCard.displayName = 'ActividadCard';

// ===== COMPONENTE PRINCIPAL =====

export function PlanificacionActividades({ userPermissions }: PlanificacionActividadesProps) {
  const [actividadesList, setActividadesList] = useState<any[]>([]);
  const [guardarecursosList, setGuardarecursosList] = useState<Guardarecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGuardarecursos, setIsLoadingGuardarecursos] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [selectedGuardarecurso, setSelectedGuardarecurso] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [bulkGuardarecurso, setBulkGuardarecurso] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<ActividadFormData>(actividadesService.createEmptyFormData());

  /**
   * Cargar actividades - Memoizado
   * 🔒 SEGURIDAD: Si hay error, fuerza logout
   */
  const loadActividades = useCallback(async () => {
    setIsLoading(true);
    try {
      const accessToken = authService.getCurrentToken();
      if (!accessToken) {
        console.error('❌ NO HAY TOKEN - FORZANDO LOGOUT');
        forceLogout();
        return;
      }

      const actividadesFromServer = await fetchActividades(accessToken);
      setActividadesList(actividadesFromServer);
      
      // ✅ ACTUALIZAR actividadesSync para que el reporte pueda acceder a las actividades
      actividadesSync.updateActividades(actividadesFromServer);
      console.log('✅ actividadesSync actualizado con', actividadesFromServer.length, 'actividades');
    } catch (error) {
      console.error('❌ ERROR AL CARGAR ACTIVIDADES - FORZANDO LOGOUT:', error);
      forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cargar guardarecursos - Memoizado
   * 🔒 SEGURIDAD: Si hay error, fuerza logout
   */
  const loadGuardarecursos = useCallback(async () => {
    setIsLoadingGuardarecursos(true);
    try {
      const accessToken = authService.getCurrentToken();
      if (!accessToken) {
        console.error('❌ NO HAY TOKEN - FORZANDO LOGOUT');
        forceLogout();
        return;
      }

      const guardarecursosFromServer = await guardarecursosService.fetchGuardarecursos(accessToken);
      console.log('✅ Guardarecursos cargados:', guardarecursosFromServer);
      setGuardarecursosList(guardarecursosFromServer);
    } catch (error) {
      console.error('❌ ERROR AL CARGAR GUARDARECURSOS - FORZANDO LOGOUT:', error);
      forceLogout();
    } finally {
      setIsLoadingGuardarecursos(false);
    }
  }, []);

  // Cargar actividades y guardarecursos al montar
  useEffect(() => {
    loadActividades();
    loadGuardarecursos();
  }, [loadActividades, loadGuardarecursos]);

  /**
   * Tipos de actividad - Memoizados
   */
  const tiposActividad = useMemo(() => actividadesService.getAllTipos(), []);

  /**
   * Fecha mínima para el calendario (futuro) - Memoizado
   */
  const minDateTime = useMemo(() => {
    const now = new Date();
    // Agregar 1 minuto para que solo permita fechas futuras
    now.setMinutes(now.getMinutes() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  /**
   * Guardarecursos ACTIVOS ordenados alfabéticamente - Memoizado
   */
  const guardarecursosOrdenados = useMemo(() => {
    return guardarecursosList
      .filter(g => g.estado === 'Activo') // Solo guardarecursos activos
      .sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido}`;
        const nombreB = `${b.nombre} ${b.apellido}`;
        return nombreA.localeCompare(nombreB, 'es');
      });
  }, [guardarecursosList]);

  /**
   * Filtrado y ordenado usando el servicio - Memoizado
   */
  const filteredActividades = useMemo(() => {
    const filtered = actividadesService.filterActividadesProgramadas(
      actividadesList,
      searchTerm,
      selectedTipo,
      selectedGuardarecurso
    );
    
    // Ordenar de más antigua a más reciente según fecha de programación
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.horaInicio || '00:00'}`);
      const dateB = new Date(`${b.fecha}T${b.horaInicio || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [actividadesList, searchTerm, selectedTipo, selectedGuardarecurso]);

  /**
   * Mapa de guardarecursos por ID - Memoizado
   */
  const guardarecursosMap = useMemo(() => {
    const map: Record<string, Guardarecurso> = {};
    guardarecursosList.forEach(g => {
      map[g.id] = g;
    });
    return map;
  }, [guardarecursosList]);

  /**
   * Handler para submit - Memoizado
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const accessToken = authService.getCurrentToken();
      if (!accessToken) {
        toast.error('No hay sesión activa');
        return;
      }

      if (editingActividad) {
        const actividadActualizada = await updateActividadAPI(editingActividad.id, formData, accessToken);
        setActividadesList(prev => 
          prev.map(act => act.id === editingActividad.id ? actividadActualizada : act)
        );
        toast.success('Actividad actualizada exitosamente');
      } else {
        const nuevaActividad = await createActividadAPI(formData, accessToken);
        setActividadesList(prev => [nuevaActividad, ...prev]);
        toast.success('Actividad creada exitosamente');
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      toast.error('Error al guardar la actividad. Por favor intente nuevamente.');
    }
  }, [editingActividad, formData]);

  /**
   * Resetear formulario - Memoizado
   */
  const resetForm = useCallback(() => {
    setFormData(actividadesService.createEmptyFormData());
    setSelectedDate(undefined);
    setEditingActividad(null);
  }, []);

  /**
   * Descargar plantilla - Memoizado
   */
  const handleDownloadTemplate = useCallback(() => {
    const csvContent = actividadesService.generateTemplateCSV();
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_actividades_conap.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Handler para carga de archivo - Memoizado
   */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  /**
   * Procesar carga masiva - Memoizado
   */
  const handleProcessBulkUpload = useCallback(async () => {
    if (!selectedFile || !bulkGuardarecurso) {
      toast.error('Por favor seleccione un guardarecurso y un archivo');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      
      try {
        console.log('📄 Contenido del CSV:', text);
        const parseResult = actividadesService.processBulkUploadCSV(text, bulkGuardarecurso);
        
        console.log('📊 Resultado del parseo:', parseResult);
        console.log('✅ Actividades cargadas:', parseResult.actividadesCargadas);
        console.log('❌ Actividades con error:', parseResult.actividadesConError);
        console.log('📋 Errores:', parseResult.errores);
        
        if (parseResult.actividades.length === 0) {
          // Mostrar detalles de los errores en el toast
          const detalleErrores = parseResult.errores.length > 0 
            ? '\n\n' + parseResult.errores.slice(0, 3).join('\n')
            : '';
          toast.error('No se encontraron actividades válidas para cargar' + detalleErrores);
          return;
        }

        const actividadesParaAPI = parseResult.actividades.map(act => ({
          codigo: act.codigo,
          tipo: act.tipo,
          descripcion: act.descripcion,
          fecha: act.fecha,
          horaInicio: act.horaInicio,
          horaFin: act.horaFin || '',
          coordenadas: act.coordenadas || { lat: 0, lng: 0 },
          guardarecurso: act.guardarecurso
        }));

        const accessToken = authService.getCurrentToken();
        if (!accessToken) {
          toast.error('No hay sesión activa');
          return;
        }

        const { createActividadesBulkAPI } = await import('../utils/actividadesAPI');
        const resultado = await createActividadesBulkAPI(actividadesParaAPI, accessToken);

        setActividadesList(prev => [...resultado.actividades, ...prev]);

        if (resultado.errores.length > 0) {
          console.group('❌ Errores en la carga masiva:');
          resultado.errores.forEach(error => console.error(`${error.codigo}: ${error.error}`));
          console.groupEnd();
        }

        const erroresCompletos = [
          ...parseResult.errores,
          ...resultado.errores.map(e => `${e.codigo}: ${e.error}`)
        ];

        let mensaje = '';
        if (resultado.actividadesCargadas > 0) {
          mensaje += `✓ ${resultado.actividadesCargadas} actividades cargadas exitosamente`;
        }
        
        if (resultado.actividadesConError > 0 || parseResult.actividadesConError > 0) {
          const totalErrores = resultado.actividadesConError + parseResult.actividadesConError;
          if (mensaje) mensaje += '\n\n';
          mensaje += `⚠ ${totalErrores} actividades con errores:\n\n`;
          mensaje += erroresCompletos.slice(0, 5).join('\n');
          if (erroresCompletos.length > 5) {
            mensaje += `\n... y ${erroresCompletos.length - 5} errores más (ver consola)`;
          }
        }

        if (!mensaje) {
          mensaje = '⚠ No se procesaron actividades. Verifique el archivo.';
        }

        toast.info(mensaje);
        
        setIsBulkUploadOpen(false);
        setBulkGuardarecurso('');
        setSelectedFile(null);
      } catch (error) {
        console.error('Error al procesar carga masiva:', error);
        toast.error('Error al procesar la carga masiva. Por favor intente nuevamente.');
      }
    };
    
    reader.readAsText(selectedFile);
  }, [selectedFile, bulkGuardarecurso]);

  /**
   * Handler para editar - Memoizado
   */
  const handleEdit = useCallback((actividad: Actividad) => {
    setFormData(actividadesService.actividadToFormData(actividad));
    if (actividad.fecha && actividad.horaInicio) {
      const fechaHora = `${actividad.fecha}T${actividad.horaInicio}`;
      const fechaObj = new Date(fechaHora);
      if (!isNaN(fechaObj.getTime())) {
        setSelectedDate(fechaObj);
      } else {
        setSelectedDate(undefined);
      }
    } else {
      setSelectedDate(undefined);
    }
    setEditingActividad(actividad);
    setIsDialogOpen(true);
  }, []);

  /**
   * Funciones del servicio para estilos - Memoizadas
   */
  const getTipoColor = useCallback((tipo: string) => {
    return actividadesService.getTipoColor(tipo);
  }, []);

  const getEstadoInfo = useCallback((estado: EstadoActividad) => {
    const info = actividadesService.getEstadoInfo(estado);
    const iconMap: Record<string, any> = {
      'Clock': Clock,
      'Play': Play,
      'CheckCircle': CheckCircle,
      'AlertCircle': AlertCircle
    };
    return {
      ...info,
      icon: iconMap[info.icon] || AlertCircle
    };
  }, []);

  const getTipoIcon = useCallback((tipo: string) => {
    const iconName = actividadesService.getTipoIcon(tipo);
    const iconMap: Record<string, any> = {
      'Binoculars': Binoculars,
      'Flame': Flame,
      'Wrench': Wrench,
      'TreePine': TreePine,
      'Sprout': Sprout,
      'CalendarIcon': CalendarIcon
    };
    return iconMap[iconName] || CalendarIcon;
  }, []);

  /**
   * Handler para abrir diálogo nuevo - Memoizado
   */
  const handleOpenNewDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  /**
   * Handler para cancelar diálogo - Memoizado
   */
  const handleCancelDialog = useCallback(() => {
    resetForm();
    setIsDialogOpen(false);
  }, [resetForm]);

  /**
   * Handler para abrir carga masiva - Memoizado
   */
  const handleOpenBulkUpload = useCallback(() => {
    setBulkGuardarecurso('');
    setSelectedFile(null);
    setIsBulkUploadOpen(true);
  }, []);

  /**
   * Handler para cancelar carga masiva - Memoizado
   */
  const handleCancelBulkUpload = useCallback(() => {
    setIsBulkUploadOpen(false);
    setBulkGuardarecurso('');
    setSelectedFile(null);
  }, []);

  /**
   * Handler para limpiar filtros - Memoizado
   */
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTipo('todos');
    setSelectedGuardarecurso('todos');
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros - Diseño Minimalista */}
      <div className={filterStyles.filterGroupNoBorder}>
        {/* Búsqueda */}
        <div className={filterStyles.searchContainer}>
          <div className={filterStyles.searchContainerWrapper}>
            <Search className={filterStyles.searchIcon} />
            <Input
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={filterStyles.searchInput}
            />
          </div>
        </div>
        
        {/* Filtro por tipo */}
        <div className={filterStyles.selectWrapper}>
          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger className={filterStyles.selectTrigger}>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {tiposActividad.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por guardarecurso */}
        <div className={filterStyles.selectWrapper}>
          <Select value={selectedGuardarecurso} onValueChange={setSelectedGuardarecurso}>
            <SelectTrigger className={filterStyles.selectTrigger}>
              <SelectValue placeholder="Todos los guardarecursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los guardarecursos</SelectItem>
              {guardarecursosList.map(gr => (
                <SelectItem key={gr.id} value={gr.id}>
                  {gr.nombre} {gr.apellido}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones de acción */}
        {userPermissions.canCreate && (
          <>
            <Button 
              variant="outline"
              onClick={handleOpenBulkUpload}
              className={buttonStyles.bulkUploadButton}
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Carga Masiva
            </Button>
            
            <Button 
              onClick={handleOpenNewDialog}
              className={buttonStyles.createButton}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Nuevo
            </Button>
          </>
        )}
      </div>

      {/* Diálogo para crear/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={formStyles.dialogContent}>
            <DialogHeader className={formStyles.dialogHeader}>
              <DialogTitle className={formStyles.dialogTitle}>
                {editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}
              </DialogTitle>
              <DialogDescription className={formStyles.dialogDescription}>
                Complete la información de la actividad
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className={formStyles.form}>
              {/* Información General */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Información General</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <Label htmlFor="codigo" className={formStyles.label}>Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo || ''}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      placeholder="ACT-2024-001"
                      className={formStyles.input}
                      required
                    />
                  </div>
                  
                  <div className={formStyles.field}>
                    <Label htmlFor="tipo" className={formStyles.label}>Tipo de Actividad *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposActividad.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className={formStyles.field}>
                    <Label htmlFor="guardarecurso" className={formStyles.label}>Guardarecurso Asignado *</Label>
                    <Select value={formData.guardarecurso} onValueChange={(value) => setFormData({...formData, guardarecurso: value})}>
                      <SelectTrigger className={formStyles.selectTrigger}>
                        <SelectValue placeholder="Seleccione guardarecurso" />
                      </SelectTrigger>
                      <SelectContent>
                        {guardarecursosOrdenados.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nombre} {g.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={formStyles.fieldFullWidth}>
                    <Label htmlFor="descripcion" className={formStyles.label}>Descripción *</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Describa la actividad a realizar..."
                      rows={3}
                      required
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Programación */}
              <div className={formStyles.section}>
                <h3 className={formStyles.sectionTitle}>Programación</h3>
                
                <div className={formStyles.grid}>
                  <div className={formStyles.field}>
                    <Label htmlFor="fechaHoraProgramacion" className={formStyles.label}>Fecha y Hora de Programación *</Label>
                    <Input
                      id="fechaHoraProgramacion"
                      type="datetime-local"
                      min={minDateTime}
                      value={formData.fecha && formData.horaInicio 
                        ? `${formData.fecha}T${formData.horaInicio}` 
                        : ''}
                      onChange={(e) => {
                        const datetime = e.target.value;
                        if (datetime) {
                          const [fecha, hora] = datetime.split('T');
                          setFormData({
                            ...formData, 
                            fecha: fecha,
                            horaInicio: hora
                          });
                          setSelectedDate(new Date(datetime));
                        }
                      }}
                      className={formStyles.input}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Solo se pueden programar actividades futuras
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer con botones */}
              <div className={formStyles.footer}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelDialog}
                  className={formStyles.cancelButton}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={formStyles.submitButton}
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Diálogo de Carga Masiva */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              Carga Masiva de Actividades
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Descargue la plantilla, complete la información y cargue el archivo
            </DialogDescription>
          </DialogHeader>
          
          <div className={formStyles.form}>
            {/* Alerta informativa */}
            <div className={`${formStyles.alertWithIcon} bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800`}>
              <div className={formStyles.alertWithIconContainer}>
                <AlertCircle className={`${formStyles.alertWithIconIcon} text-green-600 dark:text-green-400`} />
                <div className={formStyles.alertWithIconContent}>
                  <p className={`${formStyles.alertWithIconTitle} text-green-800 dark:text-green-300`}>
                    <strong>Instrucciones:</strong>
                  </p>
                  <ol className={`${formStyles.alertWithIconList} text-green-700 dark:text-green-300`}>
                    <li>Descargue la plantilla CSV haciendo clic en el botón</li>
                    <li>Complete la información de las actividades en Excel o cualquier editor CSV</li>
                    <li><strong>Importante:</strong> Use el formato de fecha <code className={`${formStyles.codeInline} bg-green-100 dark:bg-green-900/40`}>YYYY-MM-DD</code> (ej: 2025-11-15)</li>
                    <li>Seleccione el guardarecurso que será asignado a todas las actividades</li>
                    <li>Cargue el archivo completado</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Sección de descarga */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>1. Descargar Plantilla</h3>
              
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    La plantilla incluye dos ejemplos con el formato correcto:
                  </p>
                  <ul className="text-xs text-gray-500 dark:text-gray-500 ml-4 space-y-1">
                    <li>• <strong>Fecha:</strong> Formato YYYY-MM-DD (ej: 2025-11-15)</li>
                    <li>• <strong>Hora:</strong> Formato HH:MM (ej: 08:00)</li>
                    <li>• <strong>Tipo:</strong> Debe coincidir con los tipos disponibles</li>
                  </ul>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla CSV
                </Button>
              </div>
            </div>

            {/* Sección de selección de guardarecurso */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>2. Seleccionar Guardarecurso</h3>
              
              <div className={formStyles.field}>
                <Label htmlFor="bulk-guardarecurso" className={formStyles.label}>
                  Guardarecurso Asignado *
                </Label>
                <Select 
                  value={bulkGuardarecurso} 
                  onValueChange={setBulkGuardarecurso}
                >
                  <SelectTrigger className={formStyles.selectTrigger}>
                    <SelectValue placeholder="Seleccione un guardarecurso" />
                  </SelectTrigger>
                  <SelectContent>
                    {guardarecursosOrdenados.map(gr => (
                      <SelectItem key={gr.id} value={gr.id}>
                        {gr.nombre} {gr.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Todas las actividades cargadas serán asignadas a este guardarecurso
                </p>
              </div>
            </div>

            {/* Sección de carga de archivo */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>3. Cargar Archivo</h3>
              
              <div className={formStyles.field}>
                <Label htmlFor="bulk-file" className={formStyles.label}>
                  Archivo CSV *
                </Label>
                <Input
                  id="bulk-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className={formStyles.input}
                />
                {selectedFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Footer con botones */}
            <div className={formStyles.footer}>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleCancelBulkUpload}
                className={formStyles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleProcessBulkUpload}
                disabled={!bulkGuardarecurso || !selectedFile}
                className={formStyles.submitButton}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid de actividades */}
      <div>
        <div>
          {isLoading ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30 animate-spin" />
                  <h3 className="mb-2 text-sm sm:text-base">Cargando actividades...</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Por favor espere mientras se cargan las actividades
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredActividades.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                  <h3 className="mb-2 text-sm sm:text-base">No se encontraron actividades</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    No hay actividades que coincidan con los filtros seleccionados
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="text-xs sm:text-sm"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={layoutStyles.cardGrid}>
              {filteredActividades.map((actividad, index) => (
                <ActividadCard
                  key={actividad.id}
                  actividad={actividad}
                  index={index}
                  guardarecurso={guardarecursosMap[actividad.guardarecurso]}
                  canEdit={userPermissions.canEdit}
                  onEdit={handleEdit}
                  getTipoColor={getTipoColor}
                  getEstadoInfo={getEstadoInfo}
                  getTipoIcon={getTipoIcon}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}