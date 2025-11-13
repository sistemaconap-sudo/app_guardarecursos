import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Search, Clock, MapPin, Camera, AlertTriangle, Activity, CheckCircle, Play, Calendar, X, Plus, Trash2, MapPinned, FileText, Image as ImageIcon, Pause, StopCircle, Binoculars, Wrench, GraduationCap, Eye, Map, Search as SearchIcon, User, Loader2 } from 'lucide-react';
import { Hallazgo, EvidenciaFotografica, PuntoCoordenada, Guardarecurso } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { actividadesSync } from '../utils/actividadesSync';
import { buttonStyles, filterStyles, badgeStyles, cardStyles, layoutStyles, iconStyles, formStyles, textStyles, listCardStyles, imageStyles } from '../styles/shared-styles';
import { 
  registroDiarioService, 
  HallazgoFormData, 
  FotoHallazgoFormData, 
  EvidenciaFormData, 
  PuntoCoordenadaFormData 
} from '../utils/registroDiarioService';
import { fetchActividades } from '../utils/actividadesAPI';
import { iniciarActividadAPI, finalizarActividadAPI, agregarCoordenadaAPI, eliminarCoordenadaAPI, agregarHallazgoAPI, eliminarHallazgoAPI } from '../utils/registroDiarioAPI';
import { guardarecursosService } from '../utils/guardarecursosService';
import { authService } from '../utils/authService';
import { getGuatemalaDate, parseLocalDate } from '../utils/formatters';
import { toast } from 'sonner@2.0.3';
import { forceLogout } from '../utils/base-api-service';

interface RegistroDiarioProps {
  userPermissions: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  currentUser?: any;
  patrullajeEnProgreso?: any;
  coordenadasRecuperadas?: any[];
  onPatrullajeResumido?: () => void;
}

// Interfaces movidas al servicio y reimportadas

export function RegistroDiario({ userPermissions, currentUser, patrullajeEnProgreso, coordenadasRecuperadas, onPatrullajeResumido }: RegistroDiarioProps) {
  const [actividadesList, setActividadesList] = useState<any[]>([]);
  const [guardarecursosList, setGuardarecursosList] = useState<Guardarecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuardarecurso, setSelectedGuardarecurso] = useState<string>('todos');
  const [selectedDate, setSelectedDate] = useState(getGuatemalaDate());
  
  // Modales
  const [isPatrullajeDialogOpen, setIsPatrullajeDialogOpen] = useState(false);
  const [isCompletarDialogOpen, setIsCompletarDialogOpen] = useState(false);
  const [isAddHallazgoOpen, setIsAddHallazgoOpen] = useState(false);
  const [isAddEvidenciaOpen, setIsAddEvidenciaOpen] = useState(false);
  const [isReportarHallazgoIndependienteOpen, setIsReportarHallazgoIndependienteOpen] = useState(false);
  const [isIniciarActividadDialogOpen, setIsIniciarActividadDialogOpen] = useState(false);
  const [isAddCoordenadaOpen, setIsAddCoordenadaOpen] = useState(false);
  const [isFinalizandoDesdeModal, setIsFinalizandoDesdeModal] = useState(false);
  
  const [actividadActiva, setActividadActiva] = useState<any>(null);
  const [selectedActividad, setSelectedActividad] = useState<any>(null);
  const [actividadPorIniciar, setActividadPorIniciar] = useState<any>(null);
  
  // Hallazgos independientes (no vinculados a actividades)
  const [hallazgosIndependientes, setHallazgosIndependientes] = useState<Hallazgo[]>([]);
  
  // Formularios usando el servicio
  const [hallazgoForm, setHallazgoForm] = useState<HallazgoFormData>(
    registroDiarioService.createEmptyHallazgoForm()
  );

  const [hallazgosTemporales, setHallazgosTemporales] = useState<Hallazgo[]>([]);
  const [evidenciasTemporales, setEvidenciasTemporales] = useState<EvidenciaFotografica[]>([]);
  const [coordenadasTemporales, setCoordenadasTemporales] = useState<PuntoCoordenada[]>([]);
  const [isFormularioHallazgoAbierto, setIsFormularioHallazgoAbierto] = useState(false);
  
  // Formulario de coordenadas usando el servicio
  const [coordenadaForm, setCoordenadaForm] = useState<PuntoCoordenadaFormData>(
    registroDiarioService.createEmptyCoordenadaForm()
  );
  
  // Formulario de inicio de actividad
  const [horaInicio, setHoraInicio] = useState('');
  const [latitudInicio, setLatitudInicio] = useState('');
  const [longitudInicio, setLongitudInicio] = useState('');
  
  // Formulario de finalización de actividad
  const [horaFin, setHoraFin] = useState('');
  const [latitudFin, setLatitudFin] = useState('');
  const [longitudFin, setLongitudFin] = useState('');

  // Determinar si el usuario actual es un guardarecurso (necesario antes de los useEffects) - MEMOIZADO
  const isGuardarecurso = useMemo(() => currentUser?.rol === 'Guardarecurso', [currentUser?.rol]);
  const currentGuardarecursoId = useMemo(() => isGuardarecurso ? currentUser?.id : null, [isGuardarecurso, currentUser?.id]);

  // Mantener fecha actualizada para TODOS los usuarios - verificar cada minuto
  useEffect(() => {
    const checkDate = () => {
      const fechaActual = getGuatemalaDate();
      setSelectedDate((prevDate) => {
        if (prevDate !== fechaActual) {
          console.log('📅 Fecha actualizada automáticamente de', prevDate, 'a', fechaActual);
          return fechaActual;
        }
        return prevDate;
      });
    };

    // Verificar inmediatamente y luego cada minuto
    checkDate();
    const interval = setInterval(checkDate, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, []); // Sin dependencias para que solo se ejecute al montar

  // Cargar actividades desde el servidor - MEMOIZADO
  // 🔒 SEGURIDAD: Si hay error, fuerza logout
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
      console.log('✅ Actividades cargadas para Registro Diario:', actividadesFromServer);
      setActividadesList(actividadesFromServer);
    } catch (error) {
      console.error('❌ ERROR AL CARGAR ACTIVIDADES - FORZANDO LOGOUT:', error);
      forceLogout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActividades();
  }, [loadActividades]);

  // Cargar guardarecursos desde el servidor - MEMOIZADO
  // 🔒 SEGURIDAD: Si hay error, fuerza logout
  const loadGuardarecursos = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    loadGuardarecursos();
  }, [loadGuardarecursos]);

  // Cargar hallazgos independientes del día actual - MEMOIZADO
  // 🔒 SEGURIDAD: Si hay error, fuerza logout
  const loadHallazgosIndependientes = useCallback(async () => {
    try {
      const accessToken = authService.getCurrentToken();
      if (!accessToken) {
        console.error('❌ NO HAY TOKEN - FORZANDO LOGOUT');
        forceLogout();
        return;
      }

      const { hallazgosService } = await import('../utils/hallazgosService');
      const todosLosHallazgos = await hallazgosService.fetchHallazgos(accessToken);
      
      // Filtrar solo los hallazgos del día actual y sin actividad (independientes)
      const hoy = getGuatemalaDate();
      const hallazgosHoy = todosLosHallazgos.filter(h => {
        const fechaHallazgo = h.fechaReporte;
        // actividadId null/undefined significa que NO tiene actividad asociada = independiente
        return fechaHallazgo === hoy && !h.actividadId;
      });
      
      setHallazgosIndependientes(hallazgosHoy);
      console.log('✅ Hallazgos independientes cargados:', hallazgosHoy.length, 'hallazgos');
    } catch (err) {
      console.error('❌ ERROR AL CARGAR HALLAZGOS - FORZANDO LOGOUT:', err);
      forceLogout();
    }
  }, []);

  useEffect(() => {
    loadHallazgosIndependientes();
  }, [loadHallazgosIndependientes]);

  // Detectar patrullaje en progreso al montar el componente
  useEffect(() => {
    if (patrullajeEnProgreso && !isPatrullajeDialogOpen) {
      console.log('🚨 Abriendo modal de patrullaje en progreso:', patrullajeEnProgreso);
      console.log('📍 Coordenadas a cargar:', coordenadasRecuperadas);
      
      // Configurar el patrullaje como actividad activa
      setActividadActiva(patrullajeEnProgreso);
      
      // Inicializar listas vacías excepto coordenadas que vienen de la BD
      setHallazgosTemporales([]);
      setEvidenciasTemporales([]);
      setCoordenadasTemporales(coordenadasRecuperadas || []);
      
      // Abrir el modal de patrullaje
      setIsPatrullajeDialogOpen(true);
      
      // Notificar que el patrullaje fue resumido
      if (onPatrullajeResumido) {
        onPatrullajeResumido();
      }

      toast.info('Patrullaje resumido', {
        description: `Continuando con ${patrullajeEnProgreso.tipo}: ${patrullajeEnProgreso.descripcion}. ${coordenadasRecuperadas && coordenadasRecuperadas.length > 0 ? `${coordenadasRecuperadas.length} punto(s) de coordenadas recuperado(s).` : ''}`
      });
    }
  }, [patrullajeEnProgreso, isPatrullajeDialogOpen, onPatrullajeResumido, coordenadasRecuperadas]);

  // Tipos de actividad - MEMOIZADO
  const tiposActividad = useMemo(() => registroDiarioService.getAllTiposActividad(), []);

  // Guardarecursos ordenados alfabéticamente - MEMOIZADO
  const guardarecursosOrdenados = useMemo(() => {
    return [...guardarecursosList].sort((a, b) => {
      const nombreA = `${a.nombre} ${a.apellido}`;
      const nombreB = `${b.nombre} ${b.apellido}`;
      return nombreA.localeCompare(nombreB, 'es');
    });
  }, [guardarecursosList]);

  // Crear mapa de guardarecursos para búsqueda O(1) - OPTIMIZADO
  const guardarecursosMap = useMemo(() => {
    const map: Record<string, Guardarecurso> = {};
    guardarecursosList.forEach(g => {
      map[g.id] = g;
    });
    return map;
  }, [guardarecursosList]);

  // Filtrado usando el servicio - MEMOIZADO
  const actividadesFiltradas = useMemo(() => {
    return registroDiarioService.filterActividadesPorRol(
      actividadesList,
      searchTerm,
      selectedDate,
      selectedGuardarecurso,
      isGuardarecurso,
      currentGuardarecursoId,
      guardarecursosList
    );
  }, [actividadesList, selectedDate, searchTerm, selectedGuardarecurso, isGuardarecurso, currentGuardarecursoId, guardarecursosList]);

  // Handlers - MEMOIZADOS
  const handleIniciarActividad = useCallback((actividad: any) => {
    // Abrir modal para capturar hora y coordenadas de inicio
    setHoraInicio(registroDiarioService.getCurrentTime());
    setLatitudInicio('');
    setLongitudInicio('');
    setActividadPorIniciar(actividad);
    setIsIniciarActividadDialogOpen(true);
  }, []);

  const handleConfirmarInicioActividad = useCallback(async () => {
    if (!actividadPorIniciar) return;
    
    try {
      const accessToken = authService.getCurrentToken();
      if (!accessToken) {
        alert('No hay sesión activa');
        return;
      }

      // Crear coordenadas de inicio
      const coordenadasInicio = {
        lat: parseFloat(latitudInicio) || 0,
        lng: parseFloat(longitudInicio) || 0
      };

      // Llamar a la API para iniciar la actividad
      const actividadActualizada = await iniciarActividadAPI(
        actividadPorIniciar.id,
        horaInicio,
        coordenadasInicio,
        accessToken
      );

      console.log('✅ Actividad iniciada:', actividadActualizada);

      // Actualizar la lista local
      setActividadesList(prev =>
        prev.map(act => act.id === actividadPorIniciar.id ? actividadActualizada : act)
      );

      // Si es patrullaje, abrir modal especial que no se puede cerrar
      if (registroDiarioService.isPatrullaje(actividadPorIniciar.tipo)) {
        setActividadActiva(actividadActualizada);
        setHallazgosTemporales([]);
        setEvidenciasTemporales([]);
        setCoordenadasTemporales([]);
        // Resetear formulario de hallazgos usando el servicio
        setHallazgoForm(registroDiarioService.createEmptyHallazgoForm());
        setIsPatrullajeDialogOpen(true);
      }

      // Cerrar modal de inicio
      setIsIniciarActividadDialogOpen(false);
      setActividadPorIniciar(null);
    } catch (error) {
      console.error('❌ ERROR AL INICIAR ACTIVIDAD - FORZANDO LOGOUT:', error);
      forceLogout();
    }
  }, [actividadPorIniciar, horaInicio, latitudInicio, longitudInicio]);

  const handleCompletarActividad = useCallback((actividad: any) => {
    setSelectedActividad(actividad);
    setHallazgosTemporales(actividad.hallazgos || []);
    setEvidenciasTemporales(actividad.evidencias || []);
    setCoordenadasTemporales(actividad.puntosRecorrido || []);
    
    // Para todas las actividades (patrullaje y no patrullaje), pedir coordenadas finales primero
    setHoraFin(registroDiarioService.getCurrentTime());
    setLatitudFin('');
    setLongitudFin('');
    
    setIsCompletarDialogOpen(true);
  }, []);

  const handlePasarAFormularioCompleto = useCallback(async () => {
    if (selectedActividad && horaFin && latitudFin && longitudFin) {
      // Si NO es patrullaje, completar directamente
      if (!registroDiarioService.isPatrullaje(selectedActividad.tipo)) {
        try {
          const accessToken = authService.getCurrentToken();
          if (!accessToken) {
            toast.error('Error', { description: 'No hay sesión activa' });
            return;
          }

          // Crear coordenadas de fin
          const coordenadasFin = {
            lat: parseFloat(latitudFin) || 0,
            lng: parseFloat(longitudFin) || 0
          };

          // Llamar a la API para finalizar la actividad
          const actividadActualizada = await finalizarActividadAPI(
            selectedActividad.id,
            horaFin,
            coordenadasFin,
            '', // observaciones
            accessToken,
            hallazgosTemporales,
            evidenciasTemporales,
            coordenadasTemporales
          );

          console.log('✅ Actividad no-patrullaje finalizada exitosamente:', actividadActualizada);

          // Actualizar la lista local
          setActividadesList(prev =>
            prev.map(act => act.id === selectedActividad.id ? actividadActualizada : act)
          );

          // Limpiar todo y cerrar
          setIsCompletarDialogOpen(false);
          setSelectedActividad(null);
          setHallazgosTemporales([]);
          setEvidenciasTemporales([]);
          setCoordenadasTemporales([]);
          setHoraFin('');
          setLatitudFin('');
          setLongitudFin('');

          toast.success('Actividad completada', {
            description: 'La actividad se ha finalizado correctamente'
          });
        } catch (error) {
          console.error('❌ Error al finalizar actividad:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          toast.error('Error al finalizar', {
            description: errorMessage || 'Por favor intente nuevamente'
          });
        }
      } else {
        // Si es patrullaje, continuar al modal completo
        actividadesSync.updateActividad(selectedActividad.id, {
          estado: 'En Progreso',
          horaFin: horaFin,
          coordenadasFin: {
            lat: parseFloat(latitudFin),
            lng: parseFloat(longitudFin)
          }
        });

        // Cerrar modal de coordenadas y abrir modal completo
        setIsCompletarDialogOpen(false);
        setIsFinalizandoDesdeModal(false);
        setActividadActiva(selectedActividad);
        setIsPatrullajeDialogOpen(true);
      }
    }
  }, [selectedActividad, horaFin, latitudFin, longitudFin, hallazgosTemporales, evidenciasTemporales, coordenadasTemporales]);

  const handleCompletarPatrullaje = useCallback(() => {
    // Cerrar modal actual y abrir modal de coordenadas finales para TODAS las actividades
    setIsPatrullajeDialogOpen(false);
    setSelectedActividad(actividadActiva);
    setIsFinalizandoDesdeModal(true);
    
    // Prellenar hora de fin con hora actual usando el servicio
    setHoraFin(registroDiarioService.getCurrentTime());
    setLatitudFin('');
    setLongitudFin('');
    
    setIsCompletarDialogOpen(true);
  }, [actividadActiva]);

  const handleFinalizarConCoordenadas = useCallback(async () => {
    if (selectedActividad && horaFin && latitudFin && longitudFin) {
      try {
        console.log('🚀 Iniciando finalización de actividad...');
        console.log('📋 Datos:', {
          actividadId: selectedActividad.id,
          horaFin,
          coordenadasFin: { lat: parseFloat(latitudFin), lng: parseFloat(longitudFin) },
          hallazgos: hallazgosTemporales.length,
          evidencias: evidenciasTemporales.length,
          coordenadas: coordenadasTemporales.length
        });

        const accessToken = authService.getCurrentToken();
        if (!accessToken) {
          toast.error('Error', { description: 'No hay sesión activa' });
          return;
        }

        // Crear coordenadas de fin
        const coordenadasFin = {
          lat: parseFloat(latitudFin) || 0,
          lng: parseFloat(longitudFin) || 0
        };

        // Llamar a la API para finalizar la actividad
        const actividadActualizada = await finalizarActividadAPI(
          selectedActividad.id,
          horaFin,
          coordenadasFin,
          '', // observaciones
          accessToken,
          hallazgosTemporales,
          evidenciasTemporales,
          coordenadasTemporales
        );

        console.log('✅ Actividad finalizada exitosamente:', actividadActualizada);

        // Actualizar la lista local
        setActividadesList(prev =>
          prev.map(act => act.id === selectedActividad.id ? actividadActualizada : act)
        );

        // Limpiar todo y cerrar
        setIsCompletarDialogOpen(false);
        setIsFinalizandoDesdeModal(false);
        setActividadActiva(null);
        setSelectedActividad(null);
        setHallazgosTemporales([]);
        setEvidenciasTemporales([]);
        setCoordenadasTemporales([]);
        setHoraFin('');
        setLatitudFin('');
        setLongitudFin('');

        toast.success('Actividad completada', {
          description: 'La actividad se ha finalizado correctamente'
        });
      } catch (error) {
        console.error('❌ Error al finalizar actividad:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Mensaje de error:', errorMessage);
        toast.error('Error al finalizar', {
          description: errorMessage || 'Por favor intente nuevamente'
        });
      }
    }
  }, [selectedActividad, horaFin, latitudFin, longitudFin, hallazgosTemporales, evidenciasTemporales, coordenadasTemporales]);

  const handleAgregarHallazgo = useCallback(async () => {
    if (!registroDiarioService.isHallazgoFormValid(hallazgoForm)) return;
    
    if (!actividadActiva) {
      toast.error('Error', { description: 'No hay actividad activa' });
      return;
    }

    try {
      setIsSaving(true);
      const accessToken = authService.getCurrentToken();
      
      if (!accessToken) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Guardar hallazgo en la base de datos
      const hallazgoGuardado = await agregarHallazgoAPI(
        actividadActiva.id,
        {
          titulo: hallazgoForm.titulo,
          descripcion: hallazgoForm.descripcion,
          gravedad: hallazgoForm.gravedad,
          latitud: hallazgoForm.latitud,
          longitud: hallazgoForm.longitud
        },
        accessToken
      );

      // Crear hallazgo para visualización usando el servicio
      const nuevoHallazgo = {
        ...registroDiarioService.createHallazgo(
          hallazgoForm,
          actividadActiva?.ubicacion || '',
          currentUser?.id || ''
        ),
        id: hallazgoGuardado.id  // Usar el ID de la base de datos
      };

      setHallazgosTemporales([...hallazgosTemporales, nuevoHallazgo]);
      
      toast.success('Hallazgo guardado', {
        description: 'El hallazgo se ha guardado correctamente en la base de datos'
      });
      
      // Limpiar formulario usando el servicio
      setHallazgoForm(registroDiarioService.createEmptyHallazgoForm());
      setIsAddHallazgoOpen(false);
    } catch (error) {
      console.error('Error al agregar hallazgo:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al guardar hallazgo'
      });
    } finally {
      setIsSaving(false);
    }
  }, [actividadActiva, hallazgoForm, hallazgosTemporales, currentUser?.id]);

  const handleReportarHallazgoIndependiente = useCallback(async () => {
    if (!registroDiarioService.isHallazgoFormValid(hallazgoForm)) return;

    try {
      setIsSaving(true);
      const token = authService.getCurrentToken();
      
      if (!token) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Crear hallazgo en la base de datos usando la API de hallazgosService
      const hallazgoData = {
        titulo: hallazgoForm.titulo,
        descripcion: hallazgoForm.descripcion,
        prioridad: hallazgoForm.gravedad,
        ubicacion: '',
        coordenadas: {
          lat: parseFloat(hallazgoForm.latitud) || 0,
          lng: parseFloat(hallazgoForm.longitud) || 0
        },
        areaProtegida: currentUser?.areaProtegida || '',
        observaciones: ''
      };

      const { hallazgosService } = await import('../utils/hallazgosService');
      const nuevoHallazgo = await hallazgosService.createHallazgoAPI(token, hallazgoData);

      // Agregar a la lista local
      setHallazgosIndependientes([...hallazgosIndependientes, nuevoHallazgo]);
      
      toast.success('Hallazgo reportado', {
        description: 'El hallazgo se ha guardado correctamente en la base de datos'
      });
      
      setHallazgoForm(registroDiarioService.createEmptyHallazgoForm());
      setIsReportarHallazgoIndependienteOpen(false);
    } catch (err) {
      console.error('Error al reportar hallazgo:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Error al reportar hallazgo'
      });
    } finally {
      setIsSaving(false);
    }
  }, [hallazgoForm, hallazgosIndependientes, currentUser?.areaProtegida]);

  const handleAgregarCoordenada = useCallback(async () => {
    if (!registroDiarioService.isCoordenadaFormValid(coordenadaForm)) return;
    
    if (!actividadActiva) {
      toast.error('Error', { description: 'No hay actividad activa' });
      return;
    }

    try {
      setIsSaving(true);
      const accessToken = authService.getCurrentToken();
      
      if (!accessToken) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Guardar coordenada en la base de datos
      const coordenadaGuardada = await agregarCoordenadaAPI(
        actividadActiva.id,
        {
          latitud: coordenadaForm.latitud,
          longitud: coordenadaForm.longitud,
          fecha: coordenadaForm.fecha,
          hora: coordenadaForm.hora,
          descripcion: coordenadaForm.descripcion
        },
        accessToken
      );

      // Agregar a la lista temporal para visualización
      const nuevaCoordenada = {
        id: coordenadaGuardada.id,
        latitud: coordenadaGuardada.latitud,
        longitud: coordenadaGuardada.longitud,
        fecha: coordenadaGuardada.fecha,
        hora: coordenadaGuardada.hora,
        descripcion: coordenadaGuardada.descripcion || ''
      };

      setCoordenadasTemporales([...coordenadasTemporales, nuevaCoordenada]);
      
      toast.success('Coordenada guardada', {
        description: 'El punto se ha guardado correctamente en la base de datos'
      });
      
      // Limpiar formulario usando el servicio
      setCoordenadaForm(registroDiarioService.createEmptyCoordenadaForm());
      setIsAddCoordenadaOpen(false);
    } catch (error) {
      console.error('Error al agregar coordenada:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al guardar coordenada'
      });
    } finally {
      setIsSaving(false);
    }
  }, [actividadActiva, coordenadaForm, coordenadasTemporales]);

  const handleEliminarCoordenada = useCallback(async (id: string) => {
    if (!actividadActiva) return;

    try {
      const accessToken = authService.getCurrentToken();
      
      if (!accessToken) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Eliminar de la base de datos
      await eliminarCoordenadaAPI(actividadActiva.id, id, accessToken);

      // Actualizar lista temporal
      setCoordenadasTemporales(coordenadasTemporales.filter(coord => coord.id !== id));
      
      toast.success('Coordenada eliminada');
    } catch (error) {
      console.error('Error al eliminar coordenada:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al eliminar coordenada'
      });
    }
  }, [actividadActiva, coordenadasTemporales]);

  // Handler para agregar fotografía al hallazgo - MEMOIZADO
  const handleSubmitFotoHallazgo = useCallback((data: FotografiaFormData) => {
    const fotoData: FotoHallazgoFormData = {
      url: data.url,
      descripcion: data.descripcion,
      latitud: data.latitud,
      longitud: data.longitud
    };

    setHallazgoForm({
      ...hallazgoForm,
      fotografias: [...hallazgoForm.fotografias, fotoData]
    });
  }, [hallazgoForm]);

  // Handler para eliminar fotografía del hallazgo - MEMOIZADO
  const handleEliminarFotoHallazgo = useCallback((index: number) => {
    setHallazgoForm({
      ...hallazgoForm,
      fotografias: hallazgoForm.fotografias.filter((_, i) => i !== index)
    });
  }, [hallazgoForm]);

  // Handler para agregar evidencia fotográfica general - MEMOIZADO
  const handleSubmitFotoEvidencia = useCallback((data: FotografiaFormData) => {
    const nuevaEvidencia = registroDiarioService.createEvidencia({
      url: data.url,
      descripcion: data.descripcion,
      tipo: 'Otro',
      latitud: data.latitud,
      longitud: data.longitud
    });

    setEvidenciasTemporales([...evidenciasTemporales, nuevaEvidencia]);
  }, [evidenciasTemporales]);

  const handleEliminarHallazgo = useCallback(async (id: string) => {
    if (!actividadActiva) return;

    try {
      const accessToken = authService.getCurrentToken();
      
      if (!accessToken) {
        toast.error('Error', { description: 'No hay sesión activa' });
        return;
      }

      // Eliminar de la base de datos
      await eliminarHallazgoAPI(actividadActiva.id, id, accessToken);

      // Actualizar lista temporal
      setHallazgosTemporales(hallazgosTemporales.filter(h => h.id !== id));
      
      toast.success('Hallazgo eliminado');
    } catch (error) {
      console.error('Error al eliminar hallazgo:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al eliminar hallazgo'
      });
    }
  }, [actividadActiva, hallazgosTemporales]);

  const handleEliminarEvidencia = useCallback((id: string) => {
    setEvidenciasTemporales(evidenciasTemporales.filter(e => e.id !== id));
  }, [evidenciasTemporales]);

  // Usar funciones del servicio para estilos - MEMOIZADAS
  const getEstadoInfo = useCallback((estado: 'Programada' | 'En Progreso' | 'Completada') => {
    const info = registroDiarioService.getEstadoInfo(estado);
    const iconMap: Record<string, any> = {
      'Clock': Clock,
      'Play': Play,
      'CheckCircle': CheckCircle,
      'AlertTriangle': AlertTriangle
    };
    return {
      icon: iconMap[info.icon] || AlertTriangle,
      badge: info.badge
    };
  }, []);

  const getTipoColor = useCallback((tipo: string) => {
    return registroDiarioService.getTipoColor(tipo);
  }, []);

  const getTipoIcon = useCallback((tipo: string) => {
    const iconName = registroDiarioService.getTipoIcon(tipo);
    const iconMap: Record<string, any> = {
      'Binoculars': Binoculars,
      'Wrench': Wrench,
      'GraduationCap': GraduationCap,
      'SearchIcon': SearchIcon,
      'Eye': Eye,
      'Map': Map,
      'Activity': Activity
    };
    return iconMap[iconName] || Activity;
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

        {/* Filtros - Solo para Admin/Coordinador */}
        {!isGuardarecurso && (
          <>
            {/* Filtro por guardarecurso */}
            <div className={filterStyles.selectWrapperSmall}>
              <Select value={selectedGuardarecurso} onValueChange={setSelectedGuardarecurso}>
                <SelectTrigger className={filterStyles.selectTrigger}>
                  <SelectValue placeholder="Guardarecurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {guardarecursosOrdenados.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre} {g.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Selector de fecha - Solo para Admin/Coordinador */}
        {!isGuardarecurso && (
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="!h-11 w-full sm:w-auto bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:border-gray-300 dark:focus:border-gray-600 transition-all duration-200"
          />
        )}
        
        {/* Botón de acción rápida */}
        {userPermissions.canCreate && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsReportarHallazgoIndependienteOpen(true)}
              className="!h-11 px-4 bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Hallazgo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            {hallazgosIndependientes.length > 0 && (
              <Badge variant="outline" className="!h-7 px-2.5 bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700">
                {hallazgosIndependientes.length} {hallazgosIndependientes.length === 1 ? 'reportado hoy' : 'reportados hoy'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actividades */}
      <div>
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 border-4 border-primary border-t-transparent rounded-full" />
                <h3 className="mb-2 text-sm sm:text-base">Cargando actividades...</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Por favor espere un momento
                </p>
              </div>
            </CardContent>
          </Card>
        ) : actividadesFiltradas.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 sm:p-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                  <h3 className="mb-2 text-sm sm:text-base">No hay actividades</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    No se encontraron actividades con los filtros seleccionados
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      if (!isGuardarecurso) setSelectedGuardarecurso('todos');
                    }}
                    className="text-xs sm:text-sm"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={layoutStyles.cardGrid}>
              {actividadesFiltradas.map((actividad, index) => {
                const guardarecurso = guardarecursosList.find(g => g.id === actividad.guardarecurso);
                const tipoColor = getTipoColor(actividad.tipo);
                const estadoInfo = getEstadoInfo(actividad.estado);
                const EstadoIcon = estadoInfo.icon;
                const TipoIcon = getTipoIcon(actividad.tipo);
                
                return (
                  <motion.div
                    key={actividad.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`${cardStyles.baseWithOverflow} ${listCardStyles.card}`}>
                      {/* Línea decorativa superior según estado */}
                      <div className={
                        actividad.estado === 'Programada' ? cardStyles.topLine.blue :
                        actividad.estado === 'En Progreso' ? cardStyles.topLine.orange :
                        cardStyles.topLine.green
                      } />
                      
                      <CardContent className={listCardStyles.content}>
                        {/* Título */}
                        <h3 className={`${listCardStyles.title} line-clamp-2 mb-3`}>
                          {actividad.descripcion}
                        </h3>

                        {/* Estado */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={
                            actividad.estado === 'En Progreso'
                              ? `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-700`
                              : actividad.estado === 'Completada'
                              ? `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700`
                              : `${estadoInfo.badge} border`
                          }>
                            {actividad.estado}
                          </Badge>
                        </div>

                        {/* Información de la actividad */}
                        <div className="space-y-2 mb-3">
                          {/* Hora programada */}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {actividad.horaInicio}
                              {actividad.horaFin && actividad.estado === 'Completada' ? ` - ${actividad.horaFin}` : ''}
                            </span>
                          </div>

                          {/* Tipo */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {actividad.tipo}
                            </span>
                          </div>

                          {/* Guardarecurso */}
                          {guardarecurso && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {guardarecurso.nombre} {guardarecurso.apellido}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Hallazgos y Evidencias */}
                        {(actividad.hallazgos?.length > 0 || actividad.evidencias?.length > 0) && (
                          <div className={`flex items-center gap-2 ${layoutStyles.separatorWithMargin}`}>
                            {actividad.hallazgos?.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                  {actividad.hallazgos.length} {actividad.hallazgos.length === 1 ? 'hallazgo' : 'hallazgos'}
                                </span>
                              </div>
                            )}
                            {actividad.evidencias?.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                                <Camera className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                  {actividad.evidencias.length} {actividad.evidencias.length === 1 ? 'foto' : 'fotos'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2 pt-4">
                          {actividad.estado === 'Programada' && userPermissions.canEdit && (
                            <Button
                              onClick={() => handleIniciarActividad(actividad)}
                              className={`${buttonStyles.cardAction} bg-blue-600 hover:bg-blue-700 text-white`}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1.5" />
                              <span className="text-xs">Iniciar</span>
                            </Button>
                          )}
                          {actividad.estado === 'En Progreso' && userPermissions.canEdit && (
                            <Button
                              onClick={() => handleCompletarActividad(actividad)}
                              className={`${buttonStyles.cardAction} bg-green-600 hover:bg-green-700 text-white`}
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              <span className="text-xs">Completar</span>
                            </Button>
                          )}
                          {actividad.estado === 'Completada' && (
                            <div className="flex-1 flex items-center justify-center h-9 px-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              <span className="text-sm font-medium">Finalizada</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
      </div>

      {/* Modal para Iniciar Actividad (captura horario y coordenadas) */}
      <Dialog open={isIniciarActividadDialogOpen} onOpenChange={setIsIniciarActividadDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>Iniciar Actividad</DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              {actividadPorIniciar?.descripcion}
            </DialogDescription>
          </DialogHeader>

          <div className={formStyles.form}>
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>Información de Inicio</h3>
              
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <Label htmlFor="hora-inicio" className={formStyles.label}>
                    Hora de Inicio *
                  </Label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="latitud-inicio" className={formStyles.label}>
                    Latitud de Inicio *
                  </Label>
                  <Input
                    id="latitud-inicio"
                    type="number"
                    step="0.000001"
                    value={latitudInicio}
                    onChange={(e) => setLatitudInicio(e.target.value)}
                    placeholder="14.6349"
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="longitud-inicio" className={formStyles.label}>
                    Longitud de Inicio *
                  </Label>
                  <Input
                    id="longitud-inicio"
                    type="number"
                    step="0.000001"
                    value={longitudInicio}
                    onChange={(e) => setLongitudInicio(e.target.value)}
                    placeholder="-90.5069"
                    className={formStyles.input}
                    required
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Las coordenadas de inicio quedarán registradas como punto de partida de la actividad.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={formStyles.footer}>
            <Button
              type="button"
              onClick={() => {
                setIsIniciarActividadDialogOpen(false);
                setActividadPorIniciar(null);
              }}
              variant="outline"
              className={formStyles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarInicioActividad}
              disabled={!horaInicio || !latitudInicio || !longitudInicio}
              className={formStyles.submitButton}
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Actividad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Completar Actividad (captura horario y coordenadas de finalización) */}
      <Dialog open={isCompletarDialogOpen} onOpenChange={setIsCompletarDialogOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>Completar Actividad</DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              {selectedActividad?.descripcion}
            </DialogDescription>
          </DialogHeader>

          <div className={formStyles.form}>
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>Información de Finalización</h3>
              
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <Label htmlFor="hora-fin" className={formStyles.label}>
                    Hora de Finalización *
                  </Label>
                  <Input
                    id="hora-fin"
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="latitud-fin" className={formStyles.label}>
                    Latitud de Finalización *
                  </Label>
                  <Input
                    id="latitud-fin"
                    type="number"
                    step="0.000001"
                    value={latitudFin}
                    onChange={(e) => setLatitudFin(e.target.value)}
                    placeholder="14.6349"
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="longitud-fin" className={formStyles.label}>
                    Longitud de Finalización *
                  </Label>
                  <Input
                    id="longitud-fin"
                    type="number"
                    step="0.000001"
                    value={longitudFin}
                    onChange={(e) => setLongitudFin(e.target.value)}
                    placeholder="-90.5069"
                    className={formStyles.input}
                    required
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Las coordenadas de finalización quedarán registradas como punto final de la actividad.
                  </p>
                </div>
              </div>
            </div>

            {/* Puntos de Coordenadas (solo para patrullajes y NO cuando se está finalizando) */}
            {selectedActividad?.tipo.includes('Patrullaje') && !isFinalizandoDesdeModal && (
              <div className={formStyles.section}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={formStyles.sectionTitle}>
                    Puntos de Coordenadas Registrados ({coordenadasTemporales.length})
                  </h3>
                  <Button
                    type="button"
                    onClick={() => setIsAddCoordenadaOpen(true)}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Punto
                  </Button>
                </div>

                {coordenadasTemporales.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className={textStyles.muted}>No se han registrado puntos de coordenadas</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Agregue puntos GPS del recorrido</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {coordenadasTemporales.map((coord) => (
                      <motion.div
                        key={coord.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {parseFloat(coord.latitud).toFixed(6)}, {parseFloat(coord.longitud).toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {parseLocalDate(coord.fecha).toLocaleDateString('es-GT')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {coord.hora}
                              </span>
                            </div>
                            {coord.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{coord.descripcion}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleEliminarCoordenada(coord.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <MapPinned className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Los puntos de coordenadas permiten trazar la ruta completa del patrullaje.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={formStyles.footer}>
            {isFinalizandoDesdeModal && (
              <Button
                type="button"
                onClick={() => {
                  setIsCompletarDialogOpen(false);
                  setIsFinalizandoDesdeModal(false);
                  setIsPatrullajeDialogOpen(true);
                }}
                variant="outline"
                className={formStyles.cancelButton}
              >
                Volver
              </Button>
            )}
            {!isFinalizandoDesdeModal && (
              <Button
                type="button"
                onClick={() => {
                  setIsCompletarDialogOpen(false);
                  setSelectedActividad(null);
                }}
                variant="outline"
                className={formStyles.cancelButton}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              onClick={isFinalizandoDesdeModal ? handleFinalizarConCoordenadas : handlePasarAFormularioCompleto}
              disabled={!horaFin || !latitudFin || !longitudFin}
              className={formStyles.submitButton}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isFinalizandoDesdeModal 
                ? 'Finalizar Patrullaje' 
                : (selectedActividad && registroDiarioService.isPatrullaje(selectedActividad.tipo) ? 'Continuar' : 'Guardar')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Patrullaje/Actividad en Progreso (no se puede cerrar hasta completar) */}
      <Dialog open={isPatrullajeDialogOpen} onOpenChange={() => {}}>
        <DialogContent 
          className={`${formStyles.dialogContent} [&>button]:hidden`}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              {actividadActiva?.tipo.includes('Patrullaje') ? 'Patrullaje en Progreso' : 'Completar Actividad'}
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              {actividadActiva?.descripcion}
            </DialogDescription>
          </DialogHeader>

          <div className={formStyles.form}>
            {/* Puntos de Coordenadas (solo para patrullajes) */}
            {actividadActiva?.tipo.includes('Patrullaje') && (
              <div className={formStyles.section}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={formStyles.sectionTitle}>
                    Puntos de Coordenadas Registrados ({coordenadasTemporales.length})
                  </h3>
                  <Button
                    onClick={() => setIsAddCoordenadaOpen(true)}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Punto
                  </Button>
                </div>

                {coordenadasTemporales.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className={textStyles.muted}>No se han registrado puntos de coordenadas</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Agregue puntos GPS del recorrido</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {coordenadasTemporales.map((coord) => (
                      <motion.div
                        key={coord.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {parseFloat(coord.latitud).toFixed(6)}, {parseFloat(coord.longitud).toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {parseLocalDate(coord.fecha).toLocaleDateString('es-GT')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {coord.hora}
                              </span>
                            </div>
                            {coord.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{coord.descripcion}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleEliminarCoordenada(coord.id)}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <MapPinned className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Los puntos de coordenadas permiten trazar la ruta completa del patrullaje.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={formStyles.footer}>
            <Button
              type="button"
              onClick={handleCompletarPatrullaje}
              className={`${formStyles.submitButton} w-full`}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              {actividadActiva?.tipo.includes('Patrullaje') ? 'Finalizar Patrullaje' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar hallazgo */}
      <Dialog open={isAddHallazgoOpen} onOpenChange={setIsAddHallazgoOpen}>
        <DialogContent className={formStyles.dialogContentLarge}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>Reportar Hallazgo</DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Registre un hallazgo encontrado durante la actividad
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAgregarHallazgo(); }} className={formStyles.form}>
            {/* Información del Hallazgo */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>Información del Hallazgo</h3>
              
              <div className={formStyles.gridSingle}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-gravedad" className={formStyles.label}>Gravedad *</Label>
                  <Select value={hallazgoForm.gravedad} onValueChange={(value: any) => setHallazgoForm({...hallazgoForm, gravedad: value})}>
                    <SelectTrigger className={formStyles.select}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Crítica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={formStyles.gridSingle}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-titulo" className={formStyles.label}>Título *</Label>
                  <Input
                    id="hallazgo-titulo"
                    value={hallazgoForm.titulo}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, titulo: e.target.value})}
                    placeholder="Título breve del hallazgo"
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-descripcion" className={formStyles.label}>Descripción *</Label>
                  <Textarea
                    id="hallazgo-descripcion"
                    value={hallazgoForm.descripcion}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, descripcion: e.target.value})}
                    placeholder="Describa detalladamente el hallazgo..."
                    rows={4}
                    className={formStyles.textarea}
                    required
                  />
                </div>
              </div>

              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-lat" className={formStyles.label}>Latitud</Label>
                  <Input
                    id="hallazgo-lat"
                    type="number"
                    step="0.000001"
                    value={hallazgoForm.latitud}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, latitud: e.target.value})}
                    placeholder="14.6349"
                    className={formStyles.input}
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-lng" className={formStyles.label}>Longitud</Label>
                  <Input
                    id="hallazgo-lng"
                    type="number"
                    step="0.000001"
                    value={hallazgoForm.longitud}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, longitud: e.target.value})}
                    placeholder="-90.5069"
                    className={formStyles.input}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={formStyles.footer}>
              <Button 
                type="button"
                onClick={() => setIsAddHallazgoOpen(false)} 
                variant="outline"
                className={formStyles.cancelButton}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!hallazgoForm.titulo || !hallazgoForm.descripcion}
                className={formStyles.submitButton}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Hallazgo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar punto de coordenada */}
      <Dialog open={isAddCoordenadaOpen} onOpenChange={setIsAddCoordenadaOpen}>
        <DialogContent className={formStyles.dialogContent}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              <MapPinned className="inline-block h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Registrar Punto de Coordenadas
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Registre un punto GPS durante el recorrido del patrullaje
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAgregarCoordenada(); }} className={formStyles.form}>
            <div className={formStyles.section}>
              <div className={formStyles.gridSingle}>
                <div className={formStyles.field}>
                  <Label htmlFor="coord-hora" className={formStyles.label}>Hora *</Label>
                  <Input
                    id="coord-hora"
                    type="time"
                    value={coordenadaForm.hora}
                    onChange={(e) => setCoordenadaForm({...coordenadaForm, hora: e.target.value})}
                    className={formStyles.input}
                    required
                  />
                </div>
              </div>

              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <Label htmlFor="coord-lat" className={formStyles.label}>Latitud *</Label>
                  <Input
                    id="coord-lat"
                    type="number"
                    step="0.000001"
                    value={coordenadaForm.latitud}
                    onChange={(e) => setCoordenadaForm({...coordenadaForm, latitud: e.target.value})}
                    placeholder="14.6349"
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="coord-lng" className={formStyles.label}>Longitud *</Label>
                  <Input
                    id="coord-lng"
                    type="number"
                    step="0.000001"
                    value={coordenadaForm.longitud}
                    onChange={(e) => setCoordenadaForm({...coordenadaForm, longitud: e.target.value})}
                    placeholder="-90.5069"
                    className={formStyles.input}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={formStyles.footer}>
              <Button 
                type="button"
                onClick={() => setIsAddCoordenadaOpen(false)}
                variant="outline"
                className={formStyles.cancelButton}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!coordenadaForm.latitud || !coordenadaForm.longitud || !coordenadaForm.hora}
                className={formStyles.submitButton}
              >
                <MapPinned className="h-4 w-4 mr-2" />
                Guardar Punto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para reportar hallazgo independiente */}
      <Dialog open={isReportarHallazgoIndependienteOpen} onOpenChange={setIsReportarHallazgoIndependienteOpen}>
        <DialogContent className={formStyles.dialogContentLarge}>
          <DialogHeader className={formStyles.dialogHeader}>
            <DialogTitle className={formStyles.dialogTitle}>
              <AlertTriangle className="inline-block h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
              Reportar Hallazgo
            </DialogTitle>
            <DialogDescription className={formStyles.dialogDescription}>
              Registre un hallazgo encontrado en el área protegida
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleReportarHallazgoIndependiente(); }} className={formStyles.form}>
            {/* Información del Hallazgo */}
            <div className={formStyles.section}>
              <h3 className={formStyles.sectionTitle}>
                <FileText className="inline-block h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                Información del Hallazgo
              </h3>
              
              <div className={formStyles.gridSingle}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-ind-gravedad" className={formStyles.label}>Gravedad *</Label>
                  <Select value={hallazgoForm.gravedad} onValueChange={(value: any) => setHallazgoForm({...hallazgoForm, gravedad: value})}>
                    <SelectTrigger className={formStyles.select}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leve">Leve</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                      <SelectItem value="Crítico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={formStyles.gridSingle}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-ind-titulo" className={formStyles.label}>Título *</Label>
                  <Input
                    id="hallazgo-ind-titulo"
                    value={hallazgoForm.titulo}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, titulo: e.target.value})}
                    placeholder="Título breve del hallazgo"
                    className={formStyles.input}
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-ind-descripcion" className={formStyles.label}>Descripción *</Label>
                  <Textarea
                    id="hallazgo-ind-descripcion"
                    value={hallazgoForm.descripcion}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, descripcion: e.target.value})}
                    placeholder="Describa detalladamente el hallazgo..."
                    rows={4}
                    className={formStyles.textarea}
                    required
                  />
                </div>
              </div>

              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-ind-lat" className={formStyles.label}>Latitud</Label>
                  <Input
                    id="hallazgo-ind-lat"
                    type="number"
                    step="0.000001"
                    value={hallazgoForm.latitud}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, latitud: e.target.value})}
                    placeholder="14.6349"
                    className={formStyles.input}
                  />
                </div>

                <div className={formStyles.field}>
                  <Label htmlFor="hallazgo-ind-lng" className={formStyles.label}>Longitud</Label>
                  <Input
                    id="hallazgo-ind-lng"
                    type="number"
                    step="0.000001"
                    value={hallazgoForm.longitud}
                    onChange={(e) => setHallazgoForm({...hallazgoForm, longitud: e.target.value})}
                    placeholder="-90.5069"
                    className={formStyles.input}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={formStyles.footer}>
              <Button 
                type="button"
                onClick={() => {
                  setIsReportarHallazgoIndependienteOpen(false);
                  setHallazgoForm({
                    tipo: 'Ambiental',
                    titulo: '',
                    descripcion: '',
                    gravedad: 'Media',
                    latitud: '',
                    longitud: '',
                    fotografias: []
                  });
                }} 
                variant="outline"
                className={formStyles.cancelButton}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={!hallazgoForm.titulo || !hallazgoForm.descripcion || isSaving}
                className={formStyles.submitButton}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reportar Hallazgo
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
