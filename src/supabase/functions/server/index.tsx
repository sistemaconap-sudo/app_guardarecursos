import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// ============================================================================
// 🕐 UTILIDAD: Funciones para obtener fecha/hora en horario de Guatemala (GMT-6)
// ============================================================================
// 
// Guatemala está en la zona horaria CST (Central Standard Time) GMT-6
// y NO usa horario de verano (Daylight Saving Time).
// 
// IMPORTANTE: Todas las fechas/horas que se guardan en la base de datos DEBEN
// usar estas funciones para garantizar que se almacenen en horario de Guatemala.
//
// Lugares donde se usan:
// - act_fechah_iniciio (hora de inicio de actividad)
// - act_fechah_fin (hora de fin de actividad)
// - glc_fecha (hora de cada punto GPS de geolocalización)
// - hlz_fecha (fecha de hallazgos)
// - ftg_fecha (fecha de fotografías)
// - inc_fecha (fecha de incidentes)
// - sgm_fecha (fecha de seguimientos)
// ============================================================================

/**
 * Convierte la fecha/hora actual a horario de Guatemala (GMT-6)
 * Guatemala NO usa horario de verano, siempre es GMT-6
 * 
 * @returns Fecha/hora en ISO string con zona horaria de Guatemala
 * 
 * @example
 * const horaGuatemala = getGuatemalaDateTime();
 * // "2024-11-09T14:30:00.000Z" (representa 08:30 AM en Guatemala)
 */
function getGuatemalaDateTime(): string {
  const now = new Date();
  const guatemalaOffset = -6 * 60; // GMT-6 en minutos
  // Ajustar a horario de Guatemala
  const guatemalaTime = new Date(now.getTime() + (guatemalaOffset + now.getTimezoneOffset()) * 60000);
  return guatemalaTime.toISOString();
}

/**
 * Convierte la fecha/hora actual a solo fecha en horario de Guatemala (GMT-6)
 * 
 * @returns Fecha en formato YYYY-MM-DD
 * 
 * @example
 * const fechaGuatemala = getGuatemalaDate();
 * // "2024-11-09"
 */
function getGuatemalaDate(): string {
  return getGuatemalaDateTime().split('T')[0];
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-811550f1/health", (c) => {
  return c.json({ status: "ok" });
});

/**
 * 🔧 ENDPOINT: Inicializar datos base (Estados y Roles)
 * 
 * Crea los registros base necesarios para el funcionamiento del sistema
 * Este endpoint es idempotente: si los datos ya existen, no hace nada
 * 
 * @route POST /make-server-811550f1/init-data
 * @returns Resultado de la inicialización
 */
app.post("/make-server-811550f1/init-data", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const created = {
      estados: [] as string[],
      roles: [] as string[],
      estadosActividad: [] as string[],
      categorias: [] as string[]
    };

    // PASO 1: Crear Estados de usuario si no existen
    const estadosRequeridos = ['Activo', 'Suspendido', 'Desactivado'];
    
    for (const nombreEstado of estadosRequeridos) {
      const { data: existente } = await supabase
        .from('estado')
        .select('std_id')
        .eq('std_nombre', nombreEstado)
        .maybeSingle();

      if (!existente) {
        const { error } = await supabase
          .from('estado')
          .insert([{ std_nombre: nombreEstado }]);

        if (error) {
          console.error(`Error al crear estado ${nombreEstado}:`, error);
        } else {
          created.estados.push(nombreEstado);
        }
      }
    }

    // PASO 2: Crear Roles si no existen
    const rolesRequeridos = ['Administrador', 'Coordinador', 'Guardarecurso'];
    
    for (const nombreRol of rolesRequeridos) {
      const { data: existente } = await supabase
        .from('rol')
        .select('rl_id')
        .eq('rl_nombre', nombreRol)
        .maybeSingle();

      if (!existente) {
        const { error } = await supabase
          .from('rol')
          .insert([{ rl_nombre: nombreRol }]);

        if (error) {
          console.error(`Error al crear rol ${nombreRol}:`, error);
        } else {
          created.roles.push(nombreRol);
        }
      }
    }

    // PASO 3: Crear Estados de Actividad si no existen
    const estadosActividadRequeridos = ['Programada', 'En Progreso', 'Completada', 'Cancelada'];
    
    for (const nombreEstado of estadosActividadRequeridos) {
      const { data: existente } = await supabase
        .from('estado')
        .select('std_id')
        .eq('std_nombre', nombreEstado)
        .maybeSingle();

      if (!existente) {
        const { error } = await supabase
          .from('estado')
          .insert([{ std_nombre: nombreEstado }]);

        if (error) {
          console.error(`Error al crear estado de actividad ${nombreEstado}:`, error);
        } else {
          created.estadosActividad.push(nombreEstado);
        }
      }
    }

    // PASO 4: Crear Estados de Hallazgo si no existen
    const estadosHallazgoRequeridos = ['Reportado', 'En Investigación', 'En Proceso', 'Resuelto'];
    
    for (const nombreEstado of estadosHallazgoRequeridos) {
      const { data: existente } = await supabase
        .from('estado')
        .select('std_id')
        .eq('std_nombre', nombreEstado)
        .maybeSingle();

      if (!existente) {
        const { error } = await supabase
          .from('estado')
          .insert([{ std_nombre: nombreEstado }]);

        if (error) {
          console.error(`Error al crear estado de hallazgo ${nombreEstado}:`, error);
        } else {
          created.estados.push(nombreEstado);
        }
      }
    }

    // PASO 5: Crear Categorías de Hallazgo (Prioridades) si no existen
    const categoriasRequeridas = ['Baja', 'Media', 'Alta', 'Crítica'];
    
    for (const nombreCategoria of categoriasRequeridas) {
      const { data: existente } = await supabase
        .from('categoria')
        .select('ctg_id')
        .eq('ctg_nombre', nombreCategoria)
        .maybeSingle();

      if (!existente) {
        const { error } = await supabase
          .from('categoria')
          .insert([{ ctg_nombre: nombreCategoria }]);

        if (error) {
          console.error(`Error al crear categoría ${nombreCategoria}:`, error);
        } else {
          created.categorias.push(nombreCategoria);
        }
      }
    }

    return c.json({
      success: true,
      message: 'Datos base inicializados correctamente',
      created
    });

  } catch (error) {
    console.error('Error en /init-data:', error);
    return c.json({ 
      success: false,
      error: "Error al inicializar datos base" 
    }, 500);
  }
});

/**
 * 🔍 ENDPOINT: Verificar si los datos base están inicializados
 * 
 * Verifica que existan los estados y roles requeridos
 * Este endpoint no requiere autenticación para permitir verificación antes del login
 * 
 * @route GET /make-server-811550f1/check-init
 * @returns Estado de inicialización de datos base
 */
app.get("/make-server-811550f1/check-init", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verificar estados
    const { data: estados, error: errorEstados } = await supabase
      .from('estado')
      .select('std_nombre')
      .in('std_nombre', ['Activo', 'Suspendido', 'Desactivado']);

    if (errorEstados) {
      console.error('Error al verificar estados:', errorEstados);
      return c.json({
        success: true,
        initialized: false,
        missing: ['estados', 'roles'],
        error: 'Error al verificar estados'
      });
    }

    // Verificar roles
    const { data: roles, error: errorRoles } = await supabase
      .from('rol')
      .select('rl_nombre')
      .in('rl_nombre', ['Administrador', 'Coordinador', 'Guardarecurso']);

    if (errorRoles) {
      console.error('Error al verificar roles:', errorRoles);
      return c.json({
        success: true,
        initialized: false,
        missing: ['roles'],
        error: 'Error al verificar roles'
      });
    }

    const missing = [];
    
    if (!estados || estados.length < 3) {
      missing.push('estados');
    }
    
    if (!roles || roles.length < 3) {
      missing.push('roles');
    }

    return c.json({
      success: true,
      initialized: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined
    });

  } catch (error) {
    console.error('Error en /check-init:', error);
    return c.json({
      success: true,
      initialized: false,
      missing: ['estados', 'roles'],
      error: 'Error al verificar datos base'
    });
  }
});

/**
 * 📊 ENDPOINT: Obtener estadísticas del dashboard
 * 
 * Consulta directamente las tablas de Supabase y calcula las estadísticas
 * 
 * @route GET /make-server-811550f1/dashboard/stats
 * @returns Estadísticas del dashboard
 */
app.get("/make-server-811550f1/dashboard/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    // Crear cliente Supabase con SERVICE_ROLE_KEY
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener ID del estado "Activo"
    const { data: estadoActivo, error: errorEstado } = await supabase
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Activo')
      .maybeSingle();

    if (errorEstado) {
      console.error('Error al obtener estado Activo:', errorEstado);
      return c.json({
        total_areas_activas: 0,
        total_guardarecursos_activos: 0,
        total_actividades: 0,
        actividades_hoy: 0
      });
    }

    if (!estadoActivo) {
      console.error('Estado Activo no encontrado en la base de datos. Los datos base no han sido inicializados.');
      return c.json({
        total_areas_activas: 0,
        total_guardarecursos_activos: 0,
        total_actividades: 0,
        actividades_hoy: 0
      });
    }

    // Obtener ID del rol "Guardarecurso"
    const { data: rolGuardarecurso, error: errorRol } = await supabase
      .from('rol')
      .select('rl_id')
      .eq('rl_nombre', 'Guardarecurso')
      .maybeSingle();

    if (errorRol || !rolGuardarecurso) {
      console.error('Error al obtener rol Guardarecurso:', errorRol);
      return c.json({
        total_areas_activas: 0,
        total_guardarecursos_activos: 0,
        total_actividades: 0,
        actividades_hoy: 0
      });
    }

    // CONSULTA 1: Total de áreas protegidas activas
    const { count: totalAreasActivas } = await supabase
      .from('area')
      .select('*', { count: 'exact', head: true })
      .eq('ar_estado', estadoActivo?.std_id || 0);

    // CONSULTA 2: Total de guardarecursos activos
    const { count: totalGuardarecursosActivos } = await supabase
      .from('usuario')
      .select('*', { count: 'exact', head: true })
      .eq('usr_rol', rolGuardarecurso?.rl_id || 0)
      .eq('usr_estado', estadoActivo?.std_id || 0);

    // CONSULTA 3: Total de actividades
    const { count: totalActividades } = await supabase
      .from('actividad')
      .select('*', { count: 'exact', head: true });

    // CONSULTA 4: Actividades para HOY (Horario de Guatemala GMT-6)
    const hoy = getGuatemalaDate();
    
    const { count: actividadesHoy } = await supabase
      .from('actividad')
      .select('*', { count: 'exact', head: true })
      .gte('act_fechah_programacion', `${hoy}T00:00:00`)
      .lt('act_fechah_programacion', `${hoy}T23:59:59`);

    // Retornar estadísticas
    return c.json({
      total_areas_activas: totalAreasActivas || 0,
      total_guardarecursos_activos: totalGuardarecursosActivos || 0,
      total_actividades: totalActividades || 0,
      actividades_hoy: actividadesHoy || 0
    });

  } catch (error) {
    console.error('Error en /dashboard/stats:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 📍 ENDPOINT: Obtener áreas protegidas para el mapa del dashboard
 * 
 * Consulta directamente la tabla de áreas con JOINs a departamento y ecosistema
 * 
 * @route GET /make-server-811550f1/dashboard/areas
 * @returns Array de áreas protegidas con coordenadas
 */
app.get("/make-server-811550f1/dashboard/areas", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    // Crear cliente Supabase con SERVICE_ROLE_KEY
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener ID del estado "Activo"
    const { data: estadoActivo, error: errorEstado } = await supabase
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Activo')
      .maybeSingle();

    if (errorEstado) {
      console.error('Error al obtener estado Activo:', errorEstado);
      return c.json([]);
    }

    if (!estadoActivo) {
      console.error('Estado Activo no encontrado en la base de datos. Los datos base no han sido inicializados.');
      return c.json([]);
    }

    // Consultar áreas protegidas activas con JOINs
    const { data, error } = await supabase
      .from('area')
      .select(`
        ar_id,
        ar_nombre,
        ar_latitud,
        ar_longitud,
        ar_descripcion,
        ar_extension,
        departamento:ar_depto (dpt_id, dpt_nombre),
        ecosistema:ar_eco (ecs_id, ecs_nombre),
        estado:ar_estado (std_id, std_nombre)
      `)
      .eq('ar_estado', estadoActivo.std_id)
      .order('ar_nombre');

    if (error) {
      console.error('Error al consultar áreas protegidas:', error);
      
      // Si las tablas no existen, retornar array vacío
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return c.json([]);
      }
      
      return c.json({ 
        success: false,
        error: "Error al consultar áreas protegidas" 
      }, 500);
    }

    // Mapear datos al formato esperado por el frontend
    const areas = (data || []).map(area => ({
      area_id: area.ar_id.toString(),
      area_nombre: area.ar_nombre,
      latitud: area.ar_latitud,
      longitud: area.ar_longitud,
      area_descripcion: area.ar_descripcion || '',
      area_extension: area.ar_extension || 0,
      depto_nombre: area.departamento?.dpt_nombre || 'Sin departamento',
      eco_nombre: area.ecosistema?.ecs_nombre || 'Sin ecosistema'
    }));

    return c.json(areas);

  } catch (error) {
    console.error('Error en /dashboard/areas:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🌳 ENDPOINT: Obtener todos los ecosistemas
 * 
 * Consulta la tabla ecosistema para obtener todos los tipos disponibles
 * 
 * @route GET /make-server-811550f1/ecosistemas
 * @returns Array de ecosistemas
 */
app.get("/make-server-811550f1/ecosistemas", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    // Usar SERVICE_ROLE_KEY para tener acceso completo a las tablas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { data: ecosistemas, error } = await supabase
      .from('ecosistema')
      .select('ecs_id, ecs_nombre')
      .order('ecs_nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener ecosistemas:', error);
      return c.json({ 
        success: false,
        error: "Error al obtener ecosistemas" 
      }, 500);
    }

    return c.json(ecosistemas || []);

  } catch (error) {
    console.error('Error en /ecosistemas:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🗺️ ENDPOINT: Obtener todos los departamentos
 * 
 * Consulta la tabla departamento para obtener todos los departamentos disponibles
 * 
 * @route GET /make-server-811550f1/departamentos
 * @returns Array de departamentos
 */
app.get("/make-server-811550f1/departamentos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    // Usar SERVICE_ROLE_KEY para tener acceso completo a las tablas
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { data: departamentos, error } = await supabase
      .from('departamento')
      .select('dpt_id, dpt_nombre')
      .order('dpt_nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener departamentos:', error);
      return c.json({ 
        success: false,
        error: "Error al obtener departamentos" 
      }, 500);
    }

    return c.json(departamentos || []);

  } catch (error) {
    console.error('Error en /departamentos:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🔑 ENDPOINT: Obtener usuario por email
 * 
 * Este endpoint se llama después de la autenticación exitosa en Supabase Auth
 * para obtener los datos adicionales del usuario desde la tabla usuario.
 * 
 * SEGURIDAD:
 * - Validación de formato de email
 * - Uso de prepared statements de Supabase (protección contra SQL injection)
 * - Sanitización de entrada
 * 
 * @route GET /make-server-811550f1/usuario/:email
 * @param email - Email del usuario autenticado
 * @returns Datos completos del usuario con relaciones (rol, área, estado)
 */
app.get("/make-server-811550f1/usuario/:email", async (c) => {
  try {
    const email = c.req.param('email');
    
    if (!email) {
      return c.json({ 
        success: false,
        error: "Email es requerido" 
      }, 400);
    }

    // 🔒 VALIDACIÓN DE SEGURIDAD: Verificar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`Intento de login con email inválido: ${email}`);
      return c.json({ 
        success: false,
        error: "Formato de email inválido" 
      }, 400);
    }

    // 🔒 VALIDACIÓN DE SEGURIDAD: Limitar longitud del email
    if (email.length > 255) {
      console.error(`Email excede longitud máxima: ${email.length} caracteres`);
      return c.json({ 
        success: false,
        error: "Email excede longitud máxima" 
      }, 400);
    }

    // 🔒 SANITIZACIÓN: Convertir a minúsculas y eliminar espacios
    const sanitizedEmail = email.toLowerCase().trim();

    // Crear cliente Supabase con SERVICE_ROLE_KEY para consultas admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // 🔒 SEGURIDAD: Usar prepared statements de Supabase para prevenir SQL injection
    // Los prepared statements de Supabase automáticamente escapan y validan los parámetros
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_correo,
        usr_telefono,
        usr_dpi,
        usr_area,
        rol:usr_rol (rl_id, rl_nombre),
        area:usr_area (ar_id, ar_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .eq('usr_correo', sanitizedEmail)
      .maybeSingle();

    if (error) {
      console.error(`Error al consultar usuario ${email}:`, error);
      
      // Verificar si es error de tabla no existente
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return c.json({ 
          success: false,
          error: "Base de datos no configurada. Por favor ejecuta los scripts SQL en Supabase." 
        }, 500);
      }
      
      return c.json({ 
        success: false,
        error: "Error al consultar usuario" 
      }, 500);
    }

    if (!data) {
      return c.json({ 
        success: false,
        error: "Usuario no encontrado en la base de datos" 
      }, 404);
    }

    // Mapear a formato esperado por el frontend
    const usuario = {
      id: data.usr_id.toString(),
      nombre: data.usr_nombre,
      apellido: data.usr_apellido,
      nombreCompleto: `${data.usr_nombre} ${data.usr_apellido}`,
      correo: data.usr_correo,
      email: data.usr_correo, // Alias para compatibilidad
      telefono: data.usr_telefono || '',
      dpi: data.usr_dpi || '',
      rol: data.rol?.rl_nombre || 'Sin rol',
      rolId: data.rol?.rl_id,
      area: data.area?.ar_nombre || 'Sin área',
      areaId: data.area?.ar_id || data.usr_area,
      estado: data.estado?.std_nombre || 'Desconocido',
      estadoId: data.estado?.std_id
    };

    return c.json({ 
      success: true, 
      usuario 
    });

  } catch (error) {
    console.error(`Error interno en /usuario/:email:`, error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🔒 ENDPOINT: Cambiar contraseña de un usuario (Admin y Coordinador)
 * 
 * Permite cambiar la contraseña de usuarios según permisos:
 * - Administrador: Puede cambiar contraseñas de Coordinadores y Guardarecursos
 * - Coordinador: Puede cambiar contraseñas de Guardarecursos únicamente
 * - Nadie puede cambiar la contraseña de un Administrador (solo ellos mismos)
 * 
 * @route POST /make-server-811550f1/usuarios/:userId/cambiar-password
 * @param userId - ID del usuario al que se le cambiará la contraseña
 * @body { newPassword: string }
 * @returns { success: boolean }
 */
app.post("/make-server-811550f1/usuarios/:userId/cambiar-password", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    console.log(`🔐 Solicitud de cambio de contraseña para usuario ID: ${userId}`);
    
    if (!accessToken) {
      console.error('❌ Token de autorización no proporcionado');
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    // Crear cliente Supabase con el token del usuario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    // Validar sesión del usuario que está haciendo el cambio
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Sesión inválida:', authError);
      return c.json({ 
        success: false,
        error: "No autorizado - Sesión inválida" 
      }, 401);
    }

    // Obtener rol del usuario actual (quien está haciendo el cambio)
    const { data: currentUserData, error: roleError } = await supabase
      .from('usuario')
      .select('usr_id, usr_nombre, usr_apellido, rol:usr_rol(rl_id, rl_nombre)')
      .eq('usr_correo', user.email)
      .maybeSingle();

    if (roleError || !currentUserData) {
      console.error('❌ Error al obtener datos del usuario actual:', roleError);
      return c.json({ 
        success: false,
        error: "Error al obtener datos del usuario" 
      }, 500);
    }

    const currentUserRole = currentUserData?.rol?.rl_nombre;
    console.log(`👤 Usuario actual: ${currentUserData.usr_nombre} ${currentUserData.usr_apellido} (Rol: ${currentUserRole})`);

    // Verificar que el usuario tiene permisos (Admin o Coordinador)
    if (currentUserRole !== 'Administrador' && currentUserRole !== 'Coordinador') {
      console.error(`❌ Usuario sin permisos. Rol: ${currentUserRole}`);
      return c.json({ 
        success: false,
        error: "No tienes permisos para cambiar contraseñas" 
      }, 403);
    }

    // Obtener datos del usuario objetivo (cuya contraseña se va a cambiar)
    const { data: targetUser, error: targetError } = await supabase
      .from('usuario')
      .select('usr_id, usr_nombre, usr_apellido, usr_correo, rol:usr_rol(rl_id, rl_nombre)')
      .eq('usr_id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      console.error('❌ Usuario objetivo no encontrado:', targetError);
      return c.json({ 
        success: false,
        error: "Usuario no encontrado" 
      }, 404);
    }

    const targetUserRole = targetUser?.rol?.rl_nombre;
    console.log(`🎯 Usuario objetivo: ${targetUser.usr_nombre} ${targetUser.usr_apellido} (Rol: ${targetUserRole})`);

    // VALIDACIÓN DE PERMISOS SEGÚN ROLES
    // REGLA 1: NUNCA se puede cambiar la contraseña de un Administrador (solo ellos mismos)
    if (targetUserRole === 'Administrador') {
      console.error('❌ Intento de cambiar contraseña de un Administrador');
      return c.json({ 
        success: false,
        error: "No se puede cambiar la contraseña de un Administrador" 
      }, 403);
    }

    // REGLA 2: Coordinadores solo pueden cambiar contraseñas de Guardarecursos
    if (currentUserRole === 'Coordinador' && targetUserRole !== 'Guardarecurso') {
      console.error(`❌ Coordinador intentó cambiar contraseña de ${targetUserRole}`);
      return c.json({ 
        success: false,
        error: "Los Coordinadores solo pueden cambiar contraseñas de Guardarecursos" 
      }, 403);
    }

    // REGLA 3: Administradores pueden cambiar contraseñas de Coordinadores y Guardarecursos
    // (Ya validado arriba con targetUserRole !== 'Administrador')

    console.log(`✅ Permisos validados: ${currentUserRole} puede cambiar contraseña de ${targetUserRole}`);

    // Obtener nueva contraseña del body
    const { newPassword } = await c.req.json();
    
    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Contraseña inválida: longitud menor a 6 caracteres');
      return c.json({ 
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres" 
      }, 400);
    }

    // Obtener el user ID de Supabase Auth por email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error al listar usuarios:', listError);
      return c.json({ 
        success: false,
        error: "Error al buscar usuario en Auth" 
      }, 500);
    }

    const authUser = users?.find(u => u.email === targetUser.usr_correo);
    
    if (!authUser) {
      console.error('❌ Usuario no encontrado en Supabase Auth');
      return c.json({ 
        success: false,
        error: "Usuario no encontrado en Supabase Auth" 
      }, 404);
    }

    console.log(`🔄 Actualizando contraseña en Supabase Auth...`);

    // Cambiar contraseña usando admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Error al cambiar contraseña:', updateError);
      return c.json({ 
        success: false,
        error: "Error al cambiar la contraseña" 
      }, 500);
    }

    console.log(`✅ Contraseña actualizada exitosamente para ${targetUser.usr_nombre} ${targetUser.usr_apellido}`);
    console.log(`   Cambiada por: ${currentUserData.usr_nombre} ${currentUserData.usr_apellido} (${currentUserRole})`);

    return c.json({ 
      success: true,
      message: "Contraseña actualizada exitosamente"
    });

  } catch (error) {
    console.error('Error en cambiar-password:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 👥 ENDPOINT: Obtener todos los usuarios (Admin y Coordinadores)
 * 
 * @route GET /make-server-811550f1/usuarios
 * @returns Array de usuarios
 */
app.get("/make-server-811550f1/usuarios", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obtener IDs de roles Admin y Coordinador
    const { data: roles, error: errorRoles } = await supabaseAdmin
      .from('rol')
      .select('rl_id, rl_nombre')
      .in('rl_nombre', ['Administrador', 'Coordinador']);

    if (errorRoles) {
      console.error('Error al obtener roles:', errorRoles);
      return c.json({ 
        success: false,
        error: "Error al obtener roles" 
      }, 500);
    }

    const roleIds = roles?.map(r => r.rl_id) || [];

    // Obtener usuarios con rol Admin o Coordinador
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        rol:usr_rol (rl_id, rl_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .in('usr_rol', roleIds)
      .order('usr_nombre');

    if (error) {
      console.error('Error al consultar usuarios:', error);
      return c.json({ 
        success: false,
        error: "Error al consultar usuarios" 
      }, 500);
    }

    return c.json({ 
      success: true,
      usuarios: data 
    });

  } catch (error) {
    console.error('Error en GET /usuarios:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 👤 ENDPOINT: Crear nuevo usuario Coordinador
 * 
 * @route POST /make-server-811550f1/usuarios
 * @body { nombre, apellido, cedula, telefono, email, password }
 * @returns Usuario creado
 */
app.post("/make-server-811550f1/usuarios", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener datos del body
    const { nombre, apellido, cedula, telefono, email, password } = await c.req.json();
    
    if (!nombre || !apellido || !email || !password) {
      return c.json({ 
        success: false,
        error: "Faltan campos requeridos" 
      }, 400);
    }

    // Obtener IDs necesarios
    const { data: rolCoordinador, error: errorRol } = await supabaseAdmin
      .from('rol')
      .select('rl_id')
      .eq('rl_nombre', 'Coordinador')
      .maybeSingle();

    if (errorRol || !rolCoordinador) {
      return c.json({ 
        success: false,
        error: "Error al obtener rol Coordinador. Verifique que los datos base estén inicializados." 
      }, 500);
    }

    const { data: estadoActivo, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Activo')
      .maybeSingle();

    if (errorEstado || !estadoActivo) {
      return c.json({ 
        success: false,
        error: "Error al obtener estado Activo. Verifique que los datos base estén inicializados." 
      }, 500);
    }

    // Hash de la contraseña con Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insertar usuario
    const { data: nuevoUsuario, error } = await supabaseAdmin
      .from('usuario')
      .insert([{
        usr_nombre: nombre,
        usr_apellido: apellido,
        usr_dpi: cedula,
        usr_telefono: telefono,
        usr_correo: email,
        usr_contrasenia: hashedPassword,
        usr_rol: rolCoordinador.rl_id,
        usr_estado: estadoActivo.std_id,
        usr_area: null
      }])
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        rol:usr_rol (rl_id, rl_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al crear usuario:', error);
      return c.json({ 
        success: false,
        error: "Error al crear el usuario" 
      }, 500);
    }

    // ✨ CREAR USUARIO EN SUPABASE AUTH para que pueda hacer login
    try {
      console.log(`📧 Creando usuario Coordinador en Supabase Auth: ${email}`);
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nombre: nombre,
          apellido: apellido,
          rol: 'Coordinador'
        }
      });
      console.log(`✅ Usuario Coordinador creado en Supabase Auth: ${email}`);
    } catch (authError) {
      console.error('⚠️ Error al crear usuario en Supabase Auth (no crítico):', authError);
      // No fallar todo el proceso si solo falla Supabase Auth
      // El usuario ya existe en PostgreSQL y puede ser creado manualmente en Auth después
    }

    return c.json({ 
      success: true,
      usuario: nuevoUsuario 
    });

  } catch (error) {
    console.error('Error en POST /usuarios:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * ✏️ ENDPOINT: Actualizar usuario
 * 
 * @route PUT /make-server-811550f1/usuarios/:userId
 * @body { nombre, apellido, telefono, email }
 * @returns Usuario actualizado
 */
app.put("/make-server-811550f1/usuarios/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener datos del body
    const { nombre, apellido, telefono, email } = await c.req.json();

    // Actualizar usuario
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .update({
        usr_nombre: nombre,
        usr_apellido: apellido,
        usr_telefono: telefono,
        usr_correo: email
      })
      .eq('usr_id', parseInt(userId))
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        rol:usr_rol (rl_id, rl_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al actualizar usuario:', error);
      return c.json({ 
        success: false,
        error: "Error al actualizar el usuario" 
      }, 500);
    }

    return c.json({ 
      success: true,
      usuario: data 
    });

  } catch (error) {
    console.error('Error en PUT /usuarios/:userId:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🔄 ENDPOINT: Cambiar estado de usuario
 * 
 * @route PATCH /make-server-811550f1/usuarios/:userId/estado
 * @body { nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado' }
 * @returns Usuario actualizado
 */
app.patch("/make-server-811550f1/usuarios/:userId/estado", async (c) => {
  try {
    const userId = c.req.param('userId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener nuevo estado del body
    const { nuevoEstado } = await c.req.json();
    
    if (!nuevoEstado || !['Activo', 'Suspendido', 'Desactivado'].includes(nuevoEstado)) {
      return c.json({ 
        success: false,
        error: "Estado inválido" 
      }, 400);
    }

    // Obtener ID del nuevo estado
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado || !estadoData) {
      console.error('Error al obtener estado:', errorEstado);
      return c.json({ 
        success: false,
        error: `Error al obtener el estado ${nuevoEstado}. Verifique que los datos base estén inicializados.` 
      }, 500);
    }

    // Actualizar estado del usuario
    const { error } = await supabaseAdmin
      .from('usuario')
      .update({
        usr_estado: estadoData.std_id
      })
      .eq('usr_id', parseInt(userId));

    if (error) {
      console.error('Error al cambiar estado:', error);
      return c.json({ 
        success: false,
        error: "Error al cambiar el estado del usuario" 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: "Estado actualizado correctamente"
    });

  } catch (error) {
    console.error('Error en PATCH /usuarios/:userId/estado:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 👮 ENDPOINT: Obtener todos los guardarecursos
 * 
 * @route GET /make-server-811550f1/guardarecursos
 * @returns Array de guardarecursos
 */
app.get("/make-server-811550f1/guardarecursos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obtener ID del rol Guardarecurso
    const { data: rolGuardarecurso, error: errorRol } = await supabaseAdmin
      .from('rol')
      .select('rl_id')
      .eq('rl_nombre', 'Guardarecurso')
      .maybeSingle();

    if (errorRol || !rolGuardarecurso) {
      console.error('Error al obtener rol Guardarecurso:', errorRol);
      return c.json({ 
        success: false,
        error: "Error al obtener rol Guardarecurso. Verifique que los datos base estén inicializados." 
      }, 500);
    }

    // Obtener guardarecursos
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        usr_area,
        rol:usr_rol (rl_id, rl_nombre),
        area:usr_area (ar_id, ar_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .eq('usr_rol', rolGuardarecurso.rl_id)
      .order('usr_nombre');

    if (error) {
      console.error('Error al consultar guardarecursos:', error);
      return c.json({ 
        success: false,
        error: "Error al consultar guardarecursos" 
      }, 500);
    }

    return c.json({ 
      success: true,
      guardarecursos: data 
    });

  } catch (error) {
    console.error('Error en GET /guardarecursos:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 👮 ENDPOINT: Crear nuevo guardarecurso
 * 
 * @route POST /make-server-811550f1/guardarecursos
 * @body { nombre, apellido, dpi, telefono, email, password, areaAsignada }
 * @returns Guardarecurso creado
 */
app.post("/make-server-811550f1/guardarecursos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener datos del body
    const { nombre, apellido, dpi, telefono, email, password, areaAsignada } = await c.req.json();
    
    if (!nombre || !apellido || !email || !password) {
      return c.json({ 
        success: false,
        error: "Faltan campos requeridos" 
      }, 400);
    }

    // VALIDACIÓN: Verificar que el correo no exista ya en la base de datos
    const { data: usuarioExistente, error: errorCheckEmail } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_correo')
      .eq('usr_correo', email)
      .maybeSingle();

    if (errorCheckEmail && errorCheckEmail.code !== 'PGRST116') { // PGRST116 = no encontrado
      console.error('Error al verificar correo existente:', errorCheckEmail);
      return c.json({ 
        success: false,
        error: "Error al verificar datos existentes" 
      }, 500);
    }

    if (usuarioExistente) {
      return c.json({ 
        success: false,
        error: "Ya existe un guardarecurso con este correo electrónico" 
      }, 400);
    }

    // VALIDACIÓN: Verificar que el DPI no exista ya en la base de datos (si se proporciona)
    if (dpi) {
      const { data: dpiExistente, error: errorCheckDPI } = await supabaseAdmin
        .from('usuario')
        .select('usr_id, usr_dpi')
        .eq('usr_dpi', dpi)
        .maybeSingle();

      if (errorCheckDPI && errorCheckDPI.code !== 'PGRST116') { // PGRST116 = no encontrado
        console.error('Error al verificar DPI existente:', errorCheckDPI);
        return c.json({ 
          success: false,
          error: "Error al verificar datos existentes" 
        }, 500);
      }

      if (dpiExistente) {
        return c.json({ 
          success: false,
          error: "Ya existe un guardarecurso con este DPI" 
        }, 400);
      }
    }

    // Usar IDs fijos para rol y estado
    // Rol Guardarecurso = 3, Estado Activo = 1
    const rolGuardarecursoId = 3;
    const estadoActivoId = 1;
    
    console.log('Usando rol ID:', rolGuardarecursoId, 'y estado ID:', estadoActivoId);

    // Hash de la contraseña con Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insertar guardarecurso
    // Convertir areaAsignada a número o null si está vacía
    const areaId = areaAsignada && areaAsignada !== '' ? parseInt(areaAsignada) : null;
    
    // Log de datos que se van a insertar
    console.log('Creando guardarecurso con los siguientes datos:');
    console.log('- Nombre:', nombre);
    console.log('- Apellido:', apellido);
    console.log('- Email:', email);
    console.log('- DPI:', dpi);
    console.log('- Teléfono:', telefono);
    console.log('- Rol ID:', rolGuardarecursoId);
    console.log('- Estado ID:', estadoActivoId);
    console.log('- Área ID:', areaId);
    
    const { data: nuevoGuardarecurso, error } = await supabaseAdmin
      .from('usuario')
      .insert([{
        usr_nombre: nombre,
        usr_apellido: apellido,
        usr_dpi: dpi || null,
        usr_telefono: telefono || null,
        usr_correo: email,
        usr_contrasenia: hashedPassword,
        usr_rol: rolGuardarecursoId,
        usr_estado: estadoActivoId,
        usr_area: areaId
      }])
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        usr_area,
        rol:usr_rol (rl_id, rl_nombre),
        area:usr_area (ar_id, ar_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al crear guardarecurso en la tabla usuario:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      
      if (error.code === '23505') {
        return c.json({ 
          success: false,
          error: "Ya existe un usuario con este correo electrónico" 
        }, 400);
      }
      
      return c.json({ 
        success: false,
        error: `Error al crear guardarecurso: ${error.message || JSON.stringify(error)}` 
      }, 500);
    }

    // Crear usuario en Supabase Auth
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          nombre: nombre,
          apellido: apellido,
          rol: 'Guardarecurso'
        }
      });
    } catch (authError) {
      console.error('Error al crear usuario en Auth (no crítico):', authError);
    }

    return c.json({ 
      success: true,
      guardarecurso: nuevoGuardarecurso
    });

  } catch (error) {
    console.error('Error en POST /guardarecursos:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      success: false,
      error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}` 
    }, 500);
  }
});

/**
 * 👮 ENDPOINT: Actualizar guardarecurso
 * 
 * IMPORTANTE: Solo se pueden editar teléfono y área asignada.
 * Los campos nombre, apellido, DPI y correo NO son editables.
 * 
 * @route PUT /make-server-811550f1/guardarecursos/:id
 * @body { telefono, areaAsignada }
 * @returns Guardarecurso actualizado
 */
app.put("/make-server-811550f1/guardarecursos/:id", async (c) => {
  try {
    const guardarecursoId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // SOLO se pueden editar telefono y areaAsignada
    // Los campos nombre, apellido, dpi y email NO son editables
    const { telefono, areaAsignada } = await c.req.json();

    // Convertir areaAsignada a número o null si está vacía
    const areaId = areaAsignada && areaAsignada !== '' ? parseInt(areaAsignada) : null;

    // Actualizar SOLO teléfono y área asignada
    // nombre, apellido, dpi y email NO se actualizan
    const { data, error } = await supabaseAdmin
      .from('usuario')
      .update({
        usr_telefono: telefono || null,
        usr_area: areaId
      })
      .eq('usr_id', parseInt(guardarecursoId))
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_dpi,
        usr_correo,
        usr_telefono,
        usr_area,
        rol:usr_rol (rl_id, rl_nombre),
        area:usr_area (ar_id, ar_nombre),
        estado:usr_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al actualizar guardarecurso:', error);
      
      if (error.code === '23505') {
        return c.json({ 
          success: false,
          error: "Ya existe un usuario con este correo electrónico" 
        }, 400);
      }
      
      return c.json({ 
        success: false,
        error: "Error al actualizar guardarecurso" 
      }, 500);
    }

    return c.json({ 
      success: true,
      guardarecurso: data
    });

  } catch (error) {
    console.error('Error en PUT /guardarecursos/:id:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 👮 ENDPOINT: Cambiar estado de guardarecurso
 * 
 * @route PATCH /make-server-811550f1/guardarecursos/:id/estado
 * @body { nuevoEstado: 'Activo' | 'Suspendido' | 'Desactivado' }
 * @returns { success: boolean }
 */
app.patch("/make-server-811550f1/guardarecursos/:id/estado", async (c) => {
  try {
    const guardarecursoId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    console.log('🔄 [ESTADO] Recibiendo petición para cambiar estado');
    console.log('📝 [ESTADO] Guardarecurso ID:', guardarecursoId);
    console.log('🔐 [ESTADO] Token presente:', accessToken ? 'Sí ✓' : 'No ✗');
    
    if (!accessToken) {
      console.error('❌ [ESTADO] No se proporcionó token de autorización');
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { nuevoEstado } = await c.req.json();
    console.log('📦 [ESTADO] Nuevo estado solicitado:', nuevoEstado);
    
    if (!['Activo', 'Suspendido', 'Desactivado'].includes(nuevoEstado)) {
      console.error('❌ [ESTADO] Estado inválido:', nuevoEstado);
      return c.json({ 
        success: false,
        error: "Estado inválido" 
      }, 400);
    }

    // Obtener ID del nuevo estado
    console.log('🔍 [ESTADO] Buscando ID del estado en la tabla estado...');
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado || !estadoData) {
      console.error('❌ [ESTADO] Error al obtener estado:', errorEstado);
      console.error('❌ [ESTADO] Estado data:', estadoData);
      return c.json({ 
        success: false,
        error: `Error al obtener el estado ${nuevoEstado}. Verifique que los datos base estén inicializados.` 
      }, 500);
    }

    console.log('✅ [ESTADO] Estado encontrado - ID:', estadoData.std_id);

    // Actualizar estado del guardarecurso
    console.log('💾 [ESTADO] Actualizando usuario en la base de datos...');
    const { error } = await supabaseAdmin
      .from('usuario')
      .update({
        usr_estado: estadoData.std_id
      })
      .eq('usr_id', parseInt(guardarecursoId));

    if (error) {
      console.error('❌ [ESTADO] Error al actualizar usuario:', error);
      return c.json({ 
        success: false,
        error: "Error al cambiar el estado del guardarecurso" 
      }, 500);
    }

    console.log('✅ [ESTADO] Estado actualizado exitosamente');

    return c.json({ 
      success: true,
      message: "Estado actualizado correctamente"
    });

  } catch (error) {
    console.error('❌ [ESTADO] Error en PATCH /guardarecursos/:id/estado:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🌳 ENDPOINT: Obtener todas las áreas protegidas
 * 
 * @route GET /make-server-811550f1/areas
 * @returns Array de áreas protegidas
 */
app.get("/make-server-811550f1/areas", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obtener áreas protegidas con los nombres correctos de columnas
    const { data, error } = await supabaseAdmin
      .from('area')
      .select(`
        ar_id,
        ar_nombre,
        departamento:ar_depto (dpt_id, dpt_nombre),
        ar_extension,
        ar_latitud,
        ar_longitud,
        ar_descripcion,
        ecosistema:ar_eco (ecs_id, ecs_nombre),
        estado:ar_estado (std_id, std_nombre),
        created_at
      `)
      .order('ar_nombre');

    if (error) {
      console.error('Error al consultar áreas protegidas:', error);
      
      // Si la tabla no existe o hay un error de relación
      if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
        console.error('Las tablas de la base de datos no existen. Por favor ejecute los scripts SQL.');
        return c.json({ 
          success: false,
          error: "Las tablas de la base de datos no existen. Por favor ejecute los scripts SQL en Supabase." 
        }, 500);
      }
      
      return c.json({ 
        success: false,
        error: "Error al consultar áreas protegidas. Verifique que los datos base estén inicializados." 
      }, 500);
    }

    return c.json({ 
      success: true,
      areas: data || []
    });

  } catch (error) {
    console.error('Error en GET /areas:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🌳 ENDPOINT: Crear nueva área protegida
 * 
 * @route POST /make-server-811550f1/areas
 * @body { nombre, departamento, extension, fechaCreacion, lat, lng, descripcion, ecosistemas }
 * @returns Área protegida creada
 */
app.post("/make-server-811550f1/areas", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obtener datos del body
    const { nombre, departamento, extension, lat, lng, descripcion, ecosistemas } = await c.req.json();
    
    console.log('📝 [POST /areas] Creando área protegida:', { nombre, departamento, extension, lat, lng, ecosistemas });
    
    if (!nombre || !departamento || !lat || !lng) {
      console.error('❌ [POST /areas] Faltan campos requeridos:', { nombre, departamento, lat, lng });
      return c.json({ 
        success: false,
        error: "Faltan campos requeridos" 
      }, 400);
    }

    // Obtener ID del estado Activo
    const { data: estadoActivo, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Activo')
      .maybeSingle();

    if (errorEstado || !estadoActivo) {
      return c.json({ 
        success: false,
        error: "Error al obtener estado Activo. Verifique que los datos base estén inicializados con /init-data." 
      }, 500);
    }

    // Obtener o crear departamento
    let { data: deptoData } = await supabaseAdmin
      .from('departamento')
      .select('dpt_id')
      .eq('dpt_nombre', departamento)
      .maybeSingle();
    
    if (!deptoData) {
      const { data: nuevoDpto, error: errorDpto } = await supabaseAdmin
        .from('departamento')
        .insert([{ dpt_nombre: departamento }])
        .select('dpt_id')
        .single();
      
      if (errorDpto) {
        console.error('Error al crear departamento:', errorDpto);
        return c.json({ 
          success: false,
          error: "Error al crear departamento" 
        }, 500);
      }
      deptoData = nuevoDpto;
    }

    // Obtener o crear ecosistema (usar el primero del array)
    const ecosistemaNombre = Array.isArray(ecosistemas) && ecosistemas.length > 0 
      ? ecosistemas[0] 
      : 'Bosque Tropical Húmedo';
    
    let { data: ecoData } = await supabaseAdmin
      .from('ecosistema')
      .select('ecs_id')
      .eq('ecs_nombre', ecosistemaNombre)
      .maybeSingle();
    
    if (!ecoData) {
      const { data: nuevoEco, error: errorEco } = await supabaseAdmin
        .from('ecosistema')
        .insert([{ ecs_nombre: ecosistemaNombre }])
        .select('ecs_id')
        .single();
      
      if (errorEco) {
        console.error('Error al crear ecosistema:', errorEco);
        return c.json({ 
          success: false,
          error: "Error al crear ecosistema" 
        }, 500);
      }
      ecoData = nuevoEco;
    }

    // Insertar área protegida con los nombres correctos de columnas
    const { data: nuevaArea, error } = await supabaseAdmin
      .from('area')
      .insert([{
        ar_nombre: nombre,
        ar_depto: deptoData.dpt_id,
        ar_extension: extension ? parseFloat(extension) : null,
        ar_latitud: parseFloat(lat),
        ar_longitud: parseFloat(lng),
        ar_descripcion: descripcion || '',
        ar_eco: ecoData.ecs_id,
        ar_estado: estadoActivo.std_id
      }])
      .select(`
        ar_id,
        ar_nombre,
        departamento:ar_depto (dpt_id, dpt_nombre),
        ar_extension,
        ar_latitud,
        ar_longitud,
        ar_descripcion,
        ecosistema:ar_eco (ecs_id, ecs_nombre),
        estado:ar_estado (std_id, std_nombre),
        created_at
      `)
      .single();

    if (error) {
      console.error('❌ [POST /areas] Error al crear área protegida:', error);
      console.error('❌ [POST /areas] Error details:', { code: error.code, message: error.message, details: error.details });
      
      if (error.code === '23505') {
        return c.json({ 
          success: false,
          error: "Ya existe un área protegida con este nombre" 
        }, 400);
      }
      
      return c.json({ 
        success: false,
        error: `Error al crear área protegida: ${error.message}` 
      }, 500);
    }

    console.log('✅ [POST /areas] Área protegida creada exitosamente:', nuevaArea.ar_id);

    return c.json({ 
      success: true,
      area: nuevaArea
    });

  } catch (error) {
    console.error('Error en POST /areas:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🌳 ENDPOINT: Actualizar área protegida
 * 
 * @route PUT /make-server-811550f1/areas/:id
 * @body { nombre, departamento, extension, fechaCreacion, lat, lng, descripcion, ecosistemas }
 * @returns Área protegida actualizada
 */
app.put("/make-server-811550f1/areas/:id", async (c) => {
  try {
    const areaId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obtener datos del body
    const { nombre, departamento, extension, lat, lng, descripcion, ecosistemas } = await c.req.json();
    
    if (!nombre || !departamento || !lat || !lng) {
      return c.json({ 
        success: false,
        error: "Faltan campos requeridos" 
      }, 400);
    }

    // Obtener o crear departamento
    let { data: deptoData } = await supabaseAdmin
      .from('departamento')
      .select('dpt_id')
      .eq('dpt_nombre', departamento)
      .maybeSingle();
    
    if (!deptoData) {
      const { data: nuevoDpto, error: errorDpto } = await supabaseAdmin
        .from('departamento')
        .insert([{ dpt_nombre: departamento }])
        .select('dpt_id')
        .single();
      
      if (errorDpto) {
        console.error('Error al crear departamento:', errorDpto);
        return c.json({ 
          success: false,
          error: "Error al crear departamento" 
        }, 500);
      }
      deptoData = nuevoDpto;
    }

    // Obtener o crear ecosistema
    const ecosistemaNombre = Array.isArray(ecosistemas) && ecosistemas.length > 0 
      ? ecosistemas[0] 
      : 'Bosque Tropical Húmedo';
    
    let { data: ecoData } = await supabaseAdmin
      .from('ecosistema')
      .select('ecs_id')
      .eq('ecs_nombre', ecosistemaNombre)
      .maybeSingle();
    
    if (!ecoData) {
      const { data: nuevoEco, error: errorEco } = await supabaseAdmin
        .from('ecosistema')
        .insert([{ ecs_nombre: ecosistemaNombre }])
        .select('ecs_id')
        .single();
      
      if (errorEco) {
        console.error('Error al crear ecosistema:', errorEco);
        return c.json({ 
          success: false,
          error: "Error al crear ecosistema" 
        }, 500);
      }
      ecoData = nuevoEco;
    }

    // Actualizar área protegida con los nombres correctos de columnas
    const { data, error } = await supabaseAdmin
      .from('area')
      .update({
        ar_nombre: nombre,
        ar_depto: deptoData.dpt_id,
        ar_extension: extension ? parseFloat(extension) : null,
        ar_latitud: parseFloat(lat),
        ar_longitud: parseFloat(lng),
        ar_descripcion: descripcion || '',
        ar_eco: ecoData.ecs_id
      })
      .eq('ar_id', parseInt(areaId))
      .select(`
        ar_id,
        ar_nombre,
        departamento:ar_depto (dpt_id, dpt_nombre),
        ar_extension,
        ar_latitud,
        ar_longitud,
        ar_descripcion,
        ecosistema:ar_eco (ecs_id, ecs_nombre),
        estado:ar_estado (std_id, std_nombre),
        created_at
      `)
      .single();

    if (error) {
      console.error('Error al actualizar área protegida:', error);
      
      if (error.code === '23505') {
        return c.json({ 
          success: false,
          error: "Ya existe un área protegida con este nombre" 
        }, 400);
      }
      
      return c.json({ 
        success: false,
        error: "Error al actualizar área protegida" 
      }, 500);
    }

    return c.json({ 
      success: true,
      area: data
    });

  } catch (error) {
    console.error('Error en PUT /areas/:id:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 🌳 ENDPOINT: Cambiar estado de área protegida
 * 
 * @route PATCH /make-server-811550f1/areas/:id/estado
 * @body { nuevoEstado: 'Activo' | 'Desactivado' }
 * @returns { success: boolean }
 */
app.patch("/make-server-811550f1/areas/:id/estado", async (c) => {
  try {
    const areaId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { nuevoEstado } = await c.req.json();
    
    if (!['Activo', 'Desactivado'].includes(nuevoEstado)) {
      return c.json({ 
        success: false,
        error: "Estado inválido" 
      }, 400);
    }

    // Obtener ID del nuevo estado
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado) {
      console.error('Error al obtener estado:', errorEstado);
      return c.json({ 
        success: false,
        error: `Error al obtener el estado ${nuevoEstado}` 
      }, 500);
    }

    if (!estadoData) {
      console.error(`Estado ${nuevoEstado} no encontrado en la base de datos`);
      return c.json({ 
        success: false,
        error: `Estado ${nuevoEstado} no encontrado. Por favor inicialice los datos base desde la pantalla de Login.` 
      }, 500);
    }

    // Actualizar estado del área
    const { error } = await supabaseAdmin
      .from('area')
      .update({
        ar_estado: estadoData.std_id
      })
      .eq('ar_id', parseInt(areaId));

    if (error) {
      console.error('Error al cambiar estado:', error);
      return c.json({ 
        success: false,
        error: "Error al cambiar el estado del área protegida" 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: "Estado actualizado correctamente"
    });

  } catch (error) {
    console.error('Error en PATCH /areas/:id/estado:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 📦 ENDPOINT: Obtener todos los equipos
 * 
 * @route GET /make-server-811550f1/equipos
 * @returns Array de equipos
 */
app.get("/make-server-811550f1/equipos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Consultar equipos con joins a usuario (guardarecurso asignado)
    const { data, error } = await supabaseAdmin
      .from('equipo')
      .select(`
        eqp_id,
        eqp_nombre,
        eqp_codigo,
        eqp_marca,
        eqp_modelo,
        eqp_observaciones,
        eqp_usuario,
        estado:eqp_estado (std_id, std_nombre),
        usuario!eqp_usuario (usr_id, usr_nombre, usr_apellido)
      `)
      .order('eqp_id', { ascending: false });

    if (error) {
      console.error('Error al consultar equipos:', error);
      return c.json({ 
        success: false,
        error: "Error al obtener equipos" 
      }, 500);
    }

    return c.json({ 
      success: true,
      equipos: data || []
    });

  } catch (error) {
    console.error('Error en GET /equipos:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 📦 ENDPOINT: Crear nuevo equipo
 * 
 * @route POST /make-server-811550f1/equipos
 * @body { nombre, codigo, marca, modelo, observaciones, guardarecursoAsignado }
 * @returns Equipo creado
 */
app.post("/make-server-811550f1/equipos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Obtener datos del body
    const { nombre, codigo, marca, modelo, observaciones, guardarecursoAsignado } = await c.req.json();
    
    if (!nombre || !codigo) {
      return c.json({ 
        success: false,
        error: "Faltan campos requeridos (nombre y código)" 
      }, 400);
    }

    // Verificar que el código no exista
    const { data: existingEquipo } = await supabaseAdmin
      .from('equipo')
      .select('eqp_id')
      .eq('eqp_codigo', codigo)
      .maybeSingle();

    if (existingEquipo) {
      return c.json({ 
        success: false,
        error: "Ya existe un equipo con este código de inventario" 
      }, 400);
    }

    // Verificar que el usuario existe si se asigna
    if (guardarecursoAsignado && guardarecursoAsignado !== 'none') {
      const { data: userData, error: errorUser } = await supabaseAdmin
        .from('usuario')
        .select('usr_id')
        .eq('usr_id', parseInt(guardarecursoAsignado))
        .maybeSingle();

      if (errorUser || !userData) {
        return c.json({ 
          success: false,
          error: "El guardarecurso especificado no existe" 
        }, 400);
      }
    }

    // IMPORTANTE: Usar ID fijo para estado "Operativo"
    // Los equipos se crean como "Operativo" (NO como "Activo")
    // Estado Operativo = 4 (debe existir en la tabla 'estado')
    const estadoOperativoId = 4;

    // Convertir guardarecursoAsignado a número o null
    const usrAsignado = (guardarecursoAsignado && guardarecursoAsignado !== 'none') 
      ? parseInt(guardarecursoAsignado) 
      : null;

    console.log('Creando equipo con los siguientes datos:');
    console.log('- Nombre:', nombre);
    console.log('- Código:', codigo);
    console.log('- Marca:', marca);
    console.log('- Modelo:', modelo);
    console.log('- Usuario asignado:', usrAsignado);
    console.log('- Estado ID:', estadoOperativoId);

    // Insertar equipo
    const { data: nuevoEquipo, error } = await supabaseAdmin
      .from('equipo')
      .insert([{
        eqp_nombre: nombre,
        eqp_codigo: codigo,
        eqp_marca: marca || null,
        eqp_modelo: modelo || null,
        eqp_observaciones: observaciones || null,
        eqp_usuario: usrAsignado,
        eqp_estado: estadoOperativoId
      }])
      .select(`
        eqp_id,
        eqp_nombre,
        eqp_codigo,
        eqp_marca,
        eqp_modelo,
        eqp_observaciones,
        eqp_usuario,
        estado:eqp_estado (std_id, std_nombre),
        usuario!eqp_usuario (usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('Error al crear equipo en la tabla equipo:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      
      if (error.code === '23505') {
        return c.json({ 
          success: false,
          error: "Ya existe un equipo con este código de inventario" 
        }, 400);
      }
      
      return c.json({ 
        success: false,
        error: `Error al crear equipo: ${error.message || JSON.stringify(error)}` 
      }, 500);
    }

    return c.json({ 
      success: true,
      equipo: nuevoEquipo
    });

  } catch (error) {
    console.error('Error en POST /equipos:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      success: false,
      error: `Error interno del servidor: ${error instanceof Error ? error.message : String(error)}` 
    }, 500);
  }
});

/**
 * 📦 ENDPOINT: Actualizar equipo
 * 
 * IMPORTANTE: Solo se pueden editar observaciones y asignación de guardarecurso.
 * Los campos nombre, código, marca y modelo NO son editables.
 * 
 * @route PUT /make-server-811550f1/equipos/:id
 * @body { observaciones, guardarecursoAsignado }
 * @returns Equipo actualizado
 */
app.put("/make-server-811550f1/equipos/:id", async (c) => {
  try {
    const equipoId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // SOLO se pueden editar observaciones y guardarecursoAsignado
    // Los campos nombre, codigo, marca y modelo NO son editables
    const { observaciones, guardarecursoAsignado } = await c.req.json();

    // Obtener el equipo actual para verificar su estado
    const { data: equipoActual, error: errorEquipo } = await supabaseAdmin
      .from('equipo')
      .select(`
        eqp_id,
        eqp_nombre,
        estado:eqp_estado (std_id, std_nombre)
      `)
      .eq('eqp_id', parseInt(equipoId))
      .maybeSingle();

    if (errorEquipo || !equipoActual) {
      return c.json({ 
        success: false,
        error: "El equipo especificado no existe" 
      }, 400);
    }

    // VALIDACIÓN: Si el equipo está en "Reparación", NO se puede asignar a ningún guardarecurso
    if (equipoActual.estado?.std_nombre === 'En Reparación' && 
        guardarecursoAsignado && 
        guardarecursoAsignado !== 'none') {
      return c.json({ 
        success: false,
        error: "No se puede asignar un equipo en reparación a un guardarecurso" 
      }, 400);
    }

    // Verificar que el usuario existe si se asigna
    if (guardarecursoAsignado && guardarecursoAsignado !== 'none') {
      const { data: userData, error: errorUser } = await supabaseAdmin
        .from('usuario')
        .select('usr_id')
        .eq('usr_id', parseInt(guardarecursoAsignado))
        .maybeSingle();

      if (errorUser || !userData) {
        return c.json({ 
          success: false,
          error: "El guardarecurso especificado no existe" 
        }, 400);
      }
    }

    // Convertir guardarecursoAsignado a número o null
    const usrAsignado = (guardarecursoAsignado && guardarecursoAsignado !== 'none') 
      ? parseInt(guardarecursoAsignado) 
      : null;

    // Actualizar SOLO observaciones y asignación de guardarecurso
    // nombre, codigo, marca y modelo NO se actualizan
    const { data, error } = await supabaseAdmin
      .from('equipo')
      .update({
        eqp_observaciones: observaciones || null,
        eqp_usuario: usrAsignado
      })
      .eq('eqp_id', parseInt(equipoId))
      .select(`
        eqp_id,
        eqp_nombre,
        eqp_codigo,
        eqp_marca,
        eqp_modelo,
        eqp_observaciones,
        eqp_usuario,
        estado:eqp_estado (std_id, std_nombre),
        usuario!eqp_usuario (usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('Error al actualizar equipo:', error);
      return c.json({ 
        success: false,
        error: "Error al actualizar equipo" 
      }, 500);
    }

    return c.json({ 
      success: true,
      equipo: data
    });

  } catch (error) {
    console.error('Error en PUT /equipos/:id:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

/**
 * 📦 ENDPOINT: Cambiar estado de equipo
 * 
 * @route PATCH /make-server-811550f1/equipos/:id/estado
 * @body { nuevoEstado: 'Operativo' | 'En Reparación' | 'Desactivado' }
 * @returns { success: boolean }
 */
app.patch("/make-server-811550f1/equipos/:id/estado", async (c) => {
  try {
    const equipoId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ 
        success: false,
        error: "No autorizado - Token requerido" 
      }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { nuevoEstado } = await c.req.json();
    
    if (!['Operativo', 'En Reparación', 'Desactivado'].includes(nuevoEstado)) {
      return c.json({ 
        success: false,
        error: "Estado inválido" 
      }, 400);
    }

    // Obtener ID del nuevo estado
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ 
        success: false,
        error: "Error al obtener el estado especificado" 
      }, 500);
    }

    // Si se cambia a "En Reparación", desasignar automáticamente
    const updateData: any = {
      eqp_estado: estadoData.std_id
    };

    if (nuevoEstado === 'En Reparación') {
      updateData.eqp_usuario = null;
    }

    // Actualizar estado (y desasignar si corresponde)
    const { error } = await supabaseAdmin
      .from('equipo')
      .update(updateData)
      .eq('eqp_id', parseInt(equipoId));

    if (error) {
      console.error('Error al cambiar estado:', error);
      return c.json({ 
        success: false,
        error: "Error al cambiar el estado del equipo" 
      }, 500);
    }

    return c.json({ 
      success: true,
      message: "Estado actualizado correctamente"
    });

  } catch (error) {
    console.error('Error en PATCH /equipos/:id/estado:', error);
    return c.json({ 
      success: false,
      error: "Error interno del servidor" 
    }, 500);
  }
});

// =============================================
// 📅 ENDPOINTS DE ACTIVIDADES (Planificación)
// =============================================

app.get("/make-server-811550f1/actividades", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const { data, error } = await supabaseAdmin
      .from('actividad')
      .select(`
        act_id,
        act_codigo,
        act_descripcion,
        act_fechah_programacion,
        act_fechah_iniciio,
        act_fechah_fin,
        act_latitud_inicio,
        act_longitud_inicio,
        act_latitud_fin,
        act_longitud_fin,
        tipo:act_tipo (tp_id, tp_nombre),
        usuario:act_usuario (usr_id, usr_nombre, usr_apellido),
        estado:act_estado (std_id, std_nombre)
      `)
      .order('act_fechah_programacion', { ascending: false });

    if (error) {
      console.error('Error al obtener actividades:', error);
      return c.json({ success: false, error: "Error al obtener las actividades" }, 500);
    }

    return c.json({ success: true, actividades: data || [] });
  } catch (error) {
    console.error('Error en GET /actividades:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

app.post("/make-server-811550f1/actividades", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const body = await c.req.json();
    const { codigo, tipo, descripcion, fecha, horaInicio, horaFin, coordenadas, guardarecurso } = body;

    if (!tipo || !descripcion || !fecha || !guardarecurso) {
      return c.json({ success: false, error: "Faltan campos requeridos" }, 400);
    }

    const { data: tipoData, error: errorTipo } = await supabaseAdmin
      .from('tipo')
      .select('tp_id')
      .eq('tp_nombre', tipo)
      .maybeSingle();

    if (errorTipo || !tipoData) {
      return c.json({ success: false, error: `Tipo de actividad "${tipo}" no encontrado` }, 400);
    }

    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Programada')
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: "Estado 'Programada' no encontrado" }, 500);
    }

    const fechaProgramacion = horaInicio ? `${fecha}T${horaInicio}:00` : `${fecha}T00:00:00`;

    const { data: nuevaActividad, error } = await supabaseAdmin
      .from('actividad')
      .insert([{
        act_codigo: codigo || null,
        act_tipo: tipoData.tp_id,
        act_descripcion: descripcion,
        act_fechah_programacion: fechaProgramacion,
        act_fechah_iniciio: null,
        act_fechah_fin: null,
        act_latitud_inicio: coordenadas?.lat || null,
        act_longitud_inicio: coordenadas?.lng || null,
        act_latitud_fin: null,
        act_longitud_fin: null,
        act_usuario: parseInt(guardarecurso),
        act_estado: estadoData.std_id
      }])
      .select(`
        act_id,
        act_codigo,
        act_descripcion,
        act_fechah_programacion,
        act_fechah_iniciio,
        act_fechah_fin,
        act_latitud_inicio,
        act_longitud_inicio,
        act_latitud_fin,
        act_longitud_fin,
        tipo:act_tipo (tp_id, tp_nombre),
        usuario:act_usuario (usr_id, usr_nombre, usr_apellido),
        estado:act_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al crear actividad:', error);
      return c.json({ success: false, error: "Error al crear la actividad" }, 500);
    }

    return c.json({ success: true, actividad: nuevaActividad });
  } catch (error) {
    console.error('Error en POST /actividades:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

// Endpoint para carga masiva de actividades
app.post("/make-server-811550f1/actividades/bulk", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const body = await c.req.json();
    const { actividades } = body;

    if (!actividades || !Array.isArray(actividades) || actividades.length === 0) {
      return c.json({ success: false, error: "Debe proporcionar un array de actividades" }, 400);
    }

    // Obtener el estado "Programada"
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Programada')
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: "Estado 'Programada' no encontrado" }, 500);
    }

    const actividadesInsertadas = [];
    const errores = [];

    // Procesar cada actividad
    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      
      try {
        // Validar campos requeridos
        if (!act.tipo || !act.descripcion || !act.fecha || !act.guardarecurso) {
          errores.push({
            index: i,
            codigo: act.codigo || `Actividad ${i + 1}`,
            error: "Faltan campos requeridos (tipo, descripcion, fecha, guardarecurso)"
          });
          continue;
        }

        // Obtener el ID del tipo de actividad
        const { data: tipoData, error: errorTipo } = await supabaseAdmin
          .from('tipo')
          .select('tp_id')
          .eq('tp_nombre', act.tipo)
          .maybeSingle();

        if (errorTipo || !tipoData) {
          errores.push({
            index: i,
            codigo: act.codigo || `Actividad ${i + 1}`,
            error: `Tipo de actividad "${act.tipo}" no encontrado`
          });
          continue;
        }

        const fechaProgramacion = act.horaInicio ? `${act.fecha}T${act.horaInicio}:00` : `${act.fecha}T00:00:00`;

        // Insertar la actividad
        const { data: nuevaActividad, error: insertError } = await supabaseAdmin
          .from('actividad')
          .insert([{
            act_codigo: act.codigo || null,
            act_tipo: tipoData.tp_id,
            act_descripcion: act.descripcion,
            act_fechah_programacion: fechaProgramacion,
            act_fechah_iniciio: null,
            act_fechah_fin: null,
            act_latitud_inicio: act.coordenadas?.lat || null,
            act_longitud_inicio: act.coordenadas?.lng || null,
            act_latitud_fin: null,
            act_longitud_fin: null,
            act_usuario: parseInt(act.guardarecurso),
            act_estado: estadoData.std_id
          }])
          .select(`
            act_id,
            act_codigo,
            act_descripcion,
            act_fechah_programacion,
            tipo:act_tipo (tp_id, tp_nombre),
            usuario:act_usuario (usr_id, usr_nombre, usr_apellido),
            estado:act_estado (std_id, std_nombre)
          `)
          .single();

        if (insertError) {
          errores.push({
            index: i,
            codigo: act.codigo || `Actividad ${i + 1}`,
            error: insertError.message
          });
        } else {
          actividadesInsertadas.push(nuevaActividad);
        }
      } catch (error) {
        errores.push({
          index: i,
          codigo: act.codigo || `Actividad ${i + 1}`,
          error: error.message || "Error desconocido"
        });
      }
    }

    return c.json({
      success: true,
      actividadesCargadas: actividadesInsertadas.length,
      actividadesConError: errores.length,
      actividades: actividadesInsertadas,
      errores: errores
    });

  } catch (error) {
    console.error('Error en POST /actividades/bulk:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

app.put("/make-server-811550f1/actividades/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const actividadId = c.req.param('id');
    const body = await c.req.json();
    const { codigo, tipo, descripcion, fecha, horaInicio, horaFin, coordenadas, guardarecurso } = body;

    if (!tipo || !descripcion || !fecha || !guardarecurso) {
      return c.json({ success: false, error: "Faltan campos requeridos" }, 400);
    }

    const { data: tipoData, error: errorTipo } = await supabaseAdmin
      .from('tipo')
      .select('tp_id')
      .eq('tp_nombre', tipo)
      .maybeSingle();

    if (errorTipo || !tipoData) {
      return c.json({ success: false, error: `Tipo de actividad "${tipo}" no encontrado` }, 400);
    }

    const fechaProgramacion = horaInicio ? `${fecha}T${horaInicio}:00` : `${fecha}T00:00:00`;

    const { data, error } = await supabaseAdmin
      .from('actividad')
      .update({
        act_codigo: codigo || null,
        act_tipo: tipoData.tp_id,
        act_descripcion: descripcion,
        act_fechah_programacion: fechaProgramacion,
        act_latitud_inicio: coordenadas?.lat || null,
        act_longitud_inicio: coordenadas?.lng || null,
        act_usuario: parseInt(guardarecurso)
      })
      .eq('act_id', parseInt(actividadId))
      .select(`
        act_id,
        act_codigo,
        act_descripcion,
        act_fechah_programacion,
        act_fechah_iniciio,
        act_fechah_fin,
        act_latitud_inicio,
        act_longitud_inicio,
        act_latitud_fin,
        act_longitud_fin,
        tipo:act_tipo (tp_id, tp_nombre),
        usuario:act_usuario (usr_id, usr_nombre, usr_apellido),
        estado:act_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al actualizar actividad:', error);
      return c.json({ success: false, error: "Error al actualizar la actividad" }, 500);
    }

    return c.json({ success: true, actividad: data });
  } catch (error) {
    console.error('Error en PUT /actividades/:id:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

app.delete("/make-server-811550f1/actividades/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const actividadId = c.req.param('id');

    const { error } = await supabaseAdmin
      .from('actividad')
      .delete()
      .eq('act_id', parseInt(actividadId));

    if (error) {
      console.error('Error al eliminar actividad:', error);
      return c.json({ success: false, error: "Error al eliminar la actividad" }, 500);
    }

    return c.json({ success: true, message: "Actividad eliminada correctamente" });
  } catch (error) {
    console.error('Error en DELETE /actividades/:id:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * 📝 ENDPOINTS: Registro Diario de Campo
 * Manejo de inicio/finalización de actividades, hallazgos, evidencias y coordenadas
 */

/**
 * Verificar si el usuario tiene patrullajes en progreso
 * @route GET /make-server-811550f1/actividades/patrullajes-en-progreso
 * @returns Patrullaje en progreso si existe
 */
app.get("/make-server-811550f1/actividades/patrullajes-en-progreso", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener usuario desde la BD
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    // Obtener estado "En Progreso"
    const { data: estadoEnProgreso } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'En Progreso')
      .maybeSingle();

    if (!estadoEnProgreso) {
      return c.json({ success: false, error: "Estado 'En Progreso' no encontrado" }, 400);
    }

    // Buscar patrullaje en progreso del usuario
    // Tipos de patrullaje: "Patrullaje de Rutina", "Patrullaje Especial", etc.
    const { data: tiposPatrullaje } = await supabaseAdmin
      .from('tipo')
      .select('tp_id')
      .or('tp_nombre.ilike.%patrullaje%,tp_nombre.ilike.%patrulla%');

    const tipoIds = tiposPatrullaje?.map(t => t.tp_id) || [];

    if (tipoIds.length === 0) {
      return c.json({ success: true, tienePatrullajeEnProgreso: false });
    }

    // Buscar actividad en progreso que sea patrullaje
    const { data: patrullaje, error: patrullajeError } = await supabaseAdmin
      .from('actividad')
      .select(`
        *,
        estado:act_estado(std_id, std_nombre),
        tipo:act_tipo(tp_id, tp_nombre),
        usuario:act_usuario(usr_id, usr_nombre, usr_apellido)
      `)
      .eq('act_usuario', usuarioData.usr_id)
      .eq('act_estado', estadoEnProgreso.std_id)
      .in('act_tipo', tipoIds)
      .order('act_fechah_iniciio', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (patrullajeError) {
      console.error('Error al buscar patrullaje:', patrullajeError);
      return c.json({ success: false, error: "Error al buscar patrullaje" }, 500);
    }

    if (patrullaje) {
      // Obtener coordenadas de geolocalizacion para este patrullaje
      const { data: coordenadas, error: coordError } = await supabaseAdmin
        .from('geolocalizacion')
        .select('*')
        .eq('glc_actividad', patrullaje.act_id)
        .order('glc_fecha', { ascending: true });

      if (coordError) {
        console.error('Error al obtener coordenadas:', coordError);
      }

      // Transformar coordenadas al formato esperado por el frontend
      const coordenadasFormateadas = coordenadas?.map(coord => ({
        id: coord.glc_id.toString(),
        latitud: coord.glc_latitud.toString(),
        longitud: coord.glc_longitud.toString(),
        fecha: coord.glc_fecha.split('T')[0],
        hora: coord.glc_fecha.split('T')[1]?.substring(0, 5) || '',
        descripcion: ''
      })) || [];

      return c.json({ 
        success: true, 
        tienePatrullajeEnProgreso: true,
        patrullaje: patrullaje,
        coordenadas: coordenadasFormateadas
      });
    }

    return c.json({ success: true, tienePatrullajeEnProgreso: false });
  } catch (error) {
    console.error('Error en GET /actividades/patrullajes-en-progreso:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Iniciar una actividad (cambiar estado a "En Progreso")
 * @route PUT /make-server-811550f1/actividades/:id/iniciar
 */
app.put("/make-server-811550f1/actividades/:id/iniciar", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const actividadId = c.req.param('id');
    const body = await c.req.json();
    const { horaInicio, coordenadasInicio } = body;

    // Obtener el estado "En Progreso"
    const { data: estadoData } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'En Progreso')
      .maybeSingle();

    if (!estadoData) {
      return c.json({ success: false, error: "Estado 'En Progreso' no encontrado" }, 400);
    }

    // Actualizar la actividad con hora de Guatemala
    const { data, error } = await supabaseAdmin
      .from('actividad')
      .update({
        act_estado: estadoData.std_id,
        act_fechah_iniciio: getGuatemalaDateTime(),
        act_latitud_inicio: coordenadasInicio?.lat || null,
        act_longitud_inicio: coordenadasInicio?.lng || null
      })
      .eq('act_id', parseInt(actividadId))
      .select(`
        *,
        estado:act_estado(std_id, std_nombre),
        tipo:act_tipo(tp_id, tp_nombre),
        usuario:act_usuario(usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('Error al iniciar actividad:', error);
      return c.json({ success: false, error: "Error al iniciar la actividad" }, 500);
    }

    return c.json({ success: true, actividad: data });
  } catch (error) {
    console.error('Error en PUT /actividades/:id/iniciar:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Finalizar una actividad (cambiar estado a "Completada")
 * @route PUT /make-server-811550f1/actividades/:id/finalizar
 */
app.put("/make-server-811550f1/actividades/:id/finalizar", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const actividadId = c.req.param('id');
    const body = await c.req.json();
    const { horaFin, coordenadasFin, observaciones, hallazgos, evidencias, puntosRecorrido } = body;

    console.log('🔍 Buscando estado "Completada"...');
    // Obtener el estado "Completada"
    const { data: estadoData, error: estadoError } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Completada')
      .maybeSingle();

    if (estadoError) {
      console.error('❌ Error al buscar estado Completada:', estadoError);
      return c.json({ success: false, error: `Error al buscar estado: ${estadoError.message}` }, 500);
    }

    if (!estadoData) {
      console.error('❌ Estado "Completada" no encontrado en la base de datos');
      return c.json({ success: false, error: "Estado 'Completada' no encontrado. Por favor ejecute la inicialización de datos." }, 400);
    }

    console.log('✅ Estado "Completada" encontrado:', estadoData.std_id);

    // Obtener usuario desde la BD
    console.log('🔍 Buscando usuario por email:', userData.user.email);
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError) {
      console.error('❌ Error al buscar usuario:', usuarioError);
      return c.json({ success: false, error: `Error al buscar usuario: ${usuarioError.message}` }, 500);
    }

    if (!usuarioData) {
      console.error('❌ Usuario no encontrado en la BD:', userData.user.email);
      return c.json({ success: false, error: "Usuario no encontrado en la base de datos" }, 404);
    }

    console.log('✅ Usuario encontrado:', usuarioData.usr_id);

    // Actualizar la actividad con hora de Guatemala (NOTA: NO se cambia la descripción, solo coordenadas y hora de fin)
    console.log('📝 Actualizando actividad:', actividadId);
    const { data, error } = await supabaseAdmin
      .from('actividad')
      .update({
        act_estado: estadoData.std_id,
        act_fechah_fin: getGuatemalaDateTime(),
        act_latitud_fin: coordenadasFin?.lat || null,
        act_longitud_fin: coordenadasFin?.lng || null
      })
      .eq('act_id', parseInt(actividadId))
      .select(`
        *,
        estado:act_estado(std_id, std_nombre),
        tipo:act_tipo(tp_id, tp_nombre),
        usuario:act_usuario(usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('❌ Error al actualizar actividad en la BD:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return c.json({ 
        success: false, 
        error: `Error al finalizar la actividad: ${error.message || JSON.stringify(error)}` 
      }, 500);
    }

    console.log('✅ Actividad actualizada a Completada:', data);

    // Guardar hallazgos en la tabla hallazgo si hay
    if (hallazgos && hallazgos.length > 0) {
      console.log(`📝 Guardando ${hallazgos.length} hallazgos...`);
      // Obtener estado "Reportado" para hallazgos
      const { data: estadoReportado } = await supabaseAdmin
        .from('estado')
        .select('std_id')
        .eq('std_nombre', 'Reportado')
        .maybeSingle();

      for (const hallazgo of hallazgos) {
        try {
          // Obtener categoría (usamos gravedad como categoría)
          const { data: categoriaData } = await supabaseAdmin
            .from('categoria')
            .select('ctg_id')
            .eq('ctg_nombre', hallazgo.gravedad || 'Moderado')
            .maybeSingle();

          if (categoriaData && estadoReportado) {
            // Insertar hallazgo con fecha de Guatemala
            const { error: hallazgoError } = await supabaseAdmin
              .from('hallazgo')
              .insert({
                hlz_nombre: hallazgo.titulo || 'Hallazgo sin título',
                hlz_descripcion: hallazgo.descripcion || '',
                hlz_latitud: parseFloat(hallazgo.latitud) || 0,
                hlz_longitud: parseFloat(hallazgo.longitud) || 0,
                hlz_fecha: getGuatemalaDate(),
                hlz_usuario: usuarioData.usr_id,
                hlz_categoria: categoriaData.ctg_id,
                hlz_estado: estadoReportado.std_id
              });
            
            if (hallazgoError) {
              console.error('⚠️ Error al guardar hallazgo:', hallazgoError);
            }
          }
        } catch (hallazgoErr) {
          console.error('⚠️ Error procesando hallazgo:', hallazgoErr);
        }
      }
    }

    // Guardar evidencias fotográficas si hay
    if (evidencias && evidencias.length > 0) {
      console.log(`📸 Guardando ${evidencias.length} evidencias fotográficas...`);
      for (const evidencia of evidencias) {
        try {
          const { error: evidenciaError } = await supabaseAdmin
            .from('fotografia')
            .insert({
              ftg_descripcion: evidencia.descripcion || 'Evidencia fotográfica',
              ftg_fecha: getGuatemalaDate(),
              ftg_latitud: parseFloat(evidencia.latitud) || 0,
              ftg_longitud: parseFloat(evidencia.longitud) || 0,
              ftg_usuario: usuarioData.usr_id,
              ftg_url: evidencia.url || '',
              ftg_actividad: parseInt(actividadId)
            });
          
          if (evidenciaError) {
            console.error('⚠️ Error al guardar evidencia:', evidenciaError);
          }
        } catch (evidenciaErr) {
          console.error('⚠️ Error procesando evidencia:', evidenciaErr);
        }
      }
    }

    // Los puntos de recorrido no se guardan aquí porque ya están guardados en tiempo real
    // durante el patrullaje mediante el endpoint POST /actividades/:id/coordenadas
    console.log('ℹ️ Los puntos de recorrido ya fueron guardados durante el patrullaje');

    console.log('✅ Actividad finalizada exitosamente');
    return c.json({ success: true, actividad: data });
  } catch (error) {
    console.error('❌ Error en PUT /actividades/:id/finalizar:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Error interno del servidor"
    }, 500);
  }
});

// =============================================
// 📍 AGREGAR PUNTO DE COORDENADA DURANTE ACTIVIDAD
// =============================================

/**
 * Agregar punto de coordenada a una actividad en progreso
 * @route POST /make-server-811550f1/actividades/:id/coordenadas
 * @param id - ID de la actividad
 * @body { latitud, longitud, fecha, hora, descripcion? } - descripcion es opcional y solo se retorna, no se guarda en BD
 * @returns Punto de coordenada creado
 */
app.post('/make-server-811550f1/actividades/:id/coordenadas', async (c) => {
  try {
    console.log('🔵 === INICIO POST /actividades/:id/coordenadas ===');
    
    // 1. VALIDAR TOKEN
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔑 Token recibido:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN');
    
    if (!accessToken || accessToken === 'undefined') {
      console.error('❌ ERROR: Token no proporcionado o inválido');
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    // 2. CREAR CLIENTE SUPABASE
    console.log('🔧 Creando cliente Supabase con SERVICE_ROLE_KEY...');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );
    console.log('✅ Cliente Supabase creado correctamente');

    // 3. VALIDAR AUTENTICACIÓN DEL USUARIO
    console.log('👤 Validando autenticación del usuario...');
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError) {
      console.error('❌ ERROR DE AUTENTICACIÓN:', {
        message: authError.message,
        name: authError.name,
        status: authError.status
      });
      return c.json({ success: false, error: `Token inválido: ${authError.message}` }, 401);
    }
    
    if (!userData.user) {
      console.error('❌ ERROR: Usuario no encontrado en respuesta de auth');
      return c.json({ success: false, error: "Token inválido - Usuario no encontrado" }, 401);
    }
    
    console.log('✅ Usuario autenticado:', {
      id: userData.user.id,
      email: userData.user.email
    });

    // 4. OBTENER PARÁMETROS Y BODY
    const actividadId = c.req.param('id');
    console.log('📋 Actividad ID del parámetro:', actividadId);
    
    const body = await c.req.json();
    const { latitud, longitud, fecha, hora, descripcion } = body;
    
    console.log('📦 Datos del body:', {
      latitud,
      longitud,
      fecha,
      hora,
      descripcion: descripcion || '(sin descripción - no se guardará en BD)'
    });

    // 5. VERIFICAR QUE LA ACTIVIDAD EXISTE
    console.log('🔍 Buscando actividad en la base de datos...');
    const { data: actividad, error: actError } = await supabaseAdmin
      .from('actividad')
      .select('act_id, act_usuario, act_estado')
      .eq('act_id', parseInt(actividadId))
      .maybeSingle();

    if (actError) {
      console.error('❌ ERROR AL BUSCAR ACTIVIDAD:', {
        message: actError.message,
        details: actError.details,
        hint: actError.hint,
        code: actError.code
      });
      return c.json({ 
        success: false, 
        error: `Error al buscar actividad: ${actError.message}`,
        details: actError.details 
      }, 500);
    }

    if (!actividad) {
      console.error('❌ ERROR: Actividad no encontrada con ID:', actividadId);
      return c.json({ success: false, error: `Actividad no encontrada con ID: ${actividadId}` }, 404);
    }
    
    console.log('✅ Actividad encontrada:', {
      act_id: actividad.act_id,
      act_usuario: actividad.act_usuario,
      act_estado: actividad.act_estado
    });

    // 6. VALIDAR DATOS REQUERIDOS
    console.log('✔️ Validando datos requeridos...');
    if (!latitud || !longitud || !fecha || !hora) {
      console.error('❌ ERROR: Datos incompletos:', {
        latitud: latitud ? '✓' : '✗',
        longitud: longitud ? '✓' : '✗',
        fecha: fecha ? '✓' : '✗',
        hora: hora ? '✓' : '✗'
      });
      return c.json({ 
        success: false, 
        error: "Datos incompletos: se requiere latitud, longitud, fecha y hora" 
      }, 400);
    }
    console.log('✅ Todos los datos requeridos están presentes');

    // 7. PREPARAR DATOS PARA INSERCIÓN (usar hora del servidor en horario de Guatemala)
    const fechaHoraGuatemala = getGuatemalaDateTime();
    const coordenadaData = {
      glc_latitud: parseFloat(latitud),
      glc_longitud: parseFloat(longitud),
      glc_fecha: fechaHoraGuatemala,
      glc_actividad: parseInt(actividadId)
    };
    
    console.log('📝 Datos preparados para inserción en geolocalizacion (horario Guatemala GMT-6):', coordenadaData);
    console.log('⚠️ NOTA: glc_descripcion NO existe en la tabla - descripcion solo se retorna en respuesta');

    // 8. INTENTAR INSERTAR EN LA BASE DE DATOS
    console.log('💾 Insertando coordenada en tabla geolocalizacion...');
    const { data: coordenada, error: insertError } = await supabaseAdmin
      .from('geolocalizacion')
      .insert(coordenadaData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ ERROR AL INSERTAR COORDENADA:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      // Logging adicional para errores de RLS
      if (insertError.code === '42501' || insertError.message.includes('policy')) {
        console.error('⚠️ POSIBLE ERROR DE RLS (Row Level Security)');
        console.error('   - Verifica que las políticas RLS estén configuradas correctamente');
        console.error('   - Usuario autenticado:', userData.user.email);
        console.error('   - Actividad ID:', actividadId);
      }
      
      // Logging adicional para errores de constraint/validación
      if (insertError.code === '23503' || insertError.message.includes('foreign key')) {
        console.error('⚠️ ERROR DE FOREIGN KEY');
        console.error('   - Verifica que act_id existe:', actividadId);
      }
      
      return c.json({ 
        success: false, 
        error: `Error al guardar coordenada: ${insertError.message}`,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      }, 500);
    }

    if (!coordenada) {
      console.error('❌ ERROR: La inserción no devolvió datos');
      return c.json({ 
        success: false, 
        error: "Error al guardar coordenada: No se obtuvieron datos después de la inserción" 
      }, 500);
    }

    console.log('✅ Coordenada guardada exitosamente en geolocalizacion:', {
      glc_id: coordenada.glc_id,
      glc_latitud: coordenada.glc_latitud,
      glc_longitud: coordenada.glc_longitud,
      glc_fecha: coordenada.glc_fecha,
      glc_actividad: coordenada.glc_actividad
    });

    // 9. RETORNAR RESPUESTA EXITOSA
    const responseData = {
      success: true, 
      coordenada: {
        id: coordenada.glc_id.toString(),
        latitud: coordenada.glc_latitud.toString(),
        longitud: coordenada.glc_longitud.toString(),
        fecha: coordenada.glc_fecha.split('T')[0],
        hora: coordenada.glc_fecha.split('T')[1]?.substring(0, 5) || '',
        descripcion: descripcion || '' // Se retorna en respuesta pero NO se guarda en BD
      }
    };
    
    console.log('📤 Retornando respuesta exitosa:', responseData);
    console.log('🔵 === FIN POST /actividades/:id/coordenadas (ÉXITO) ===\n');
    
    return c.json(responseData);
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO en POST /actividades/:id/coordenadas:');
    console.error('   Tipo de error:', error?.constructor?.name || 'Unknown');
    console.error('   Mensaje:', error?.message || 'Sin mensaje');
    console.error('   Stack trace:', error?.stack || 'Sin stack trace');
    console.log('🔵 === FIN POST /actividades/:id/coordenadas (ERROR) ===\n');
    
    return c.json({ 
      success: false, 
      error: "Error interno del servidor",
      details: error?.message || 'Error desconocido'
    }, 500);
  }
});

/**
 * Eliminar punto de coordenada
 * @route DELETE /make-server-811550f1/actividades/:id/coordenadas/:coordId
 * @param id - ID de la actividad
 * @param coordId - ID de la coordenada
 * @returns Confirmación de eliminación
 */
app.delete('/make-server-811550f1/actividades/:id/coordenadas/:coordId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const coordId = c.req.param('coordId');

    const { error: deleteError } = await supabaseAdmin
      .from('geolocalizacion')
      .delete()
      .eq('glc_id', parseInt(coordId));

    if (deleteError) {
      console.error('Error al eliminar coordenada:', deleteError);
      return c.json({ success: false, error: "Error al eliminar coordenada" }, 500);
    }

    console.log('✅ Coordenada eliminada:', coordId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /actividades/:id/coordenadas/:coordId:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Agregar hallazgo a una actividad en progreso
 * @route POST /make-server-811550f1/actividades/:id/hallazgos
 * @param id - ID de la actividad
 * @body { titulo, descripcion, gravedad, latitud, longitud }
 * @returns Hallazgo creado
 */
app.post('/make-server-811550f1/actividades/:id/hallazgos', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const actividadId = c.req.param('id');
    const body = await c.req.json();
    const { titulo, descripcion, gravedad, latitud, longitud } = body;

    // Obtener usuario desde la BD
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    // Obtener estado "Reportado"
    const { data: estadoReportado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Reportado')
      .maybeSingle();

    // Obtener categoría (gravedad)
    const { data: categoriaData } = await supabaseAdmin
      .from('categoria')
      .select('ctg_id')
      .eq('ctg_nombre', gravedad || 'Moderado')
      .maybeSingle();

    if (!categoriaData || !estadoReportado) {
      return c.json({ success: false, error: "Categoría o estado no encontrado" }, 400);
    }

    // Insertar hallazgo con fecha de Guatemala
    const { data: hallazgo, error: insertError } = await supabaseAdmin
      .from('hallazgo')
      .insert({
        hlz_nombre: titulo,
        hlz_descripcion: descripcion,
        hlz_latitud: parseFloat(latitud),
        hlz_longitud: parseFloat(longitud),
        hlz_fecha: getGuatemalaDate(),
        hlz_usuario: usuarioData.usr_id,
        hlz_categoria: categoriaData.ctg_id,
        hlz_estado: estadoReportado.std_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al insertar hallazgo:', insertError);
      return c.json({ success: false, error: "Error al guardar hallazgo" }, 500);
    }

    console.log('✅ Hallazgo guardado:', hallazgo);
    return c.json({ 
      success: true, 
      hallazgo: {
        id: hallazgo.hlz_id.toString(),
        titulo: hallazgo.hlz_nombre,
        descripcion: hallazgo.hlz_descripcion,
        gravedad: gravedad,
        latitud: hallazgo.hlz_latitud.toString(),
        longitud: hallazgo.hlz_longitud.toString(),
        fecha: hallazgo.hlz_fecha
      }
    });
  } catch (error) {
    console.error('Error en POST /actividades/:id/hallazgos:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Eliminar hallazgo
 * @route DELETE /make-server-811550f1/actividades/:id/hallazgos/:hallazgoId
 * @param id - ID de la actividad
 * @param hallazgoId - ID del hallazgo
 * @returns Confirmación de eliminación
 */
app.delete('/make-server-811550f1/actividades/:id/hallazgos/:hallazgoId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    const hallazgoId = c.req.param('hallazgoId');

    const { error: deleteError } = await supabaseAdmin
      .from('hallazgo')
      .delete()
      .eq('hlz_id', parseInt(hallazgoId));

    if (deleteError) {
      console.error('Error al eliminar hallazgo:', deleteError);
      return c.json({ success: false, error: "Error al eliminar hallazgo" }, 500);
    }

    console.log('✅ Hallazgo eliminado:', hallazgoId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /actividades/:id/hallazgos/:hallazgoId:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

// =============================================
// 🗺️ ENDPOINTS DE GEOLOCALIZACIÓN DE RUTAS
// =============================================

/**
 * Obtener rutas completadas con coordenadas GPS
 * @route GET /make-server-811550f1/rutas
 * @query guardarecurso - ID del guardarecurso (opcional, para filtrar)
 * @query fechaInicio - Fecha inicio para filtrar (opcional)
 * @query fechaFin - Fecha fin para filtrar (opcional)
 * @returns Array de rutas completadas con coordenadas GPS
 */
app.get("/make-server-811550f1/rutas", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener parámetros de query
    const guardarecursoId = c.req.query('guardarecurso');
    const fechaInicio = c.req.query('fechaInicio');
    const fechaFin = c.req.query('fechaFin');

    // Tipo "Patrullaje de Control y Vigilancia" tiene ID = 1
    const tipoPatrullajeId = 1;

    // Obtener ID del estado "Completada"
    const { data: estadoCompletada, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Completada')
      .maybeSingle();

    if (errorEstado || !estadoCompletada) {
      console.error('Error al obtener estado Completada:', errorEstado);
      return c.json({ success: true, rutas: [] });
    }

    // Construir query base
    let query = supabaseAdmin
      .from('actividad')
      .select(`
        act_id,
        act_codigo,
        act_descripcion,
        act_fechah_programacion,
        act_fechah_iniciio,
        act_fechah_fin,
        act_latitud_inicio,
        act_longitud_inicio,
        act_latitud_fin,
        act_longitud_fin,
        tipo:act_tipo (tp_id, tp_nombre),
        usuario:act_usuario (usr_id, usr_nombre, usr_apellido, area:usr_area (ar_id, ar_nombre)),
        estado:act_estado (std_id, std_nombre)
      `)
      .eq('act_tipo', tipoPatrullajeId)
      .eq('act_estado', estadoCompletada.std_id);

    // Filtrar por guardarecurso si se proporciona
    if (guardarecursoId) {
      query = query.eq('act_usuario', parseInt(guardarecursoId));
    }

    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio) {
      query = query.gte('act_fechah_programacion', `${fechaInicio}T00:00:00`);
    }
    if (fechaFin) {
      query = query.lte('act_fechah_programacion', `${fechaFin}T23:59:59`);
    }

    // Ordenar por fecha descendente
    query = query.order('act_fechah_programacion', { ascending: false });

    const { data: actividades, error } = await query;

    if (error) {
      console.error('Error al obtener rutas:', error);
      return c.json({ success: false, error: "Error al obtener las rutas" }, 500);
    }

    if (!actividades || actividades.length === 0) {
      return c.json({ success: true, rutas: [] });
    }

    // Para cada actividad, obtener sus coordenadas GPS
    const rutasConCoordenadas = await Promise.all(
      actividades.map(async (actividad) => {
        // Obtener coordenadas de la ruta
        const { data: coordenadas, error: errorCoord } = await supabaseAdmin
          .from('geolocalizacion')
          .select('glc_id, glc_latitud, glc_longitud, glc_fecha')
          .eq('glc_actividad', actividad.act_id)
          .order('glc_fecha', { ascending: true });

        if (errorCoord) {
          console.error(`Error al obtener coordenadas para actividad ${actividad.act_id}:`, errorCoord);
        }

        // Mapear a formato esperado por el frontend
        return {
          id: actividad.act_id.toString(),
          codigo: actividad.act_codigo || '',
          tipo: actividad.tipo?.tp_nombre || 'Patrullaje',
          descripcion: actividad.act_descripcion,
          fecha: actividad.act_fechah_programacion?.split('T')[0] || '',
          fechaHoraInicio: actividad.act_fechah_iniciio || null,
          fechaHoraFin: actividad.act_fechah_fin || null,
          coordenadasInicio: actividad.act_latitud_inicio && actividad.act_longitud_inicio ? {
            lat: actividad.act_latitud_inicio,
            lng: actividad.act_longitud_inicio
          } : null,
          coordenadasFin: actividad.act_latitud_fin && actividad.act_longitud_fin ? {
            lat: actividad.act_latitud_fin,
            lng: actividad.act_longitud_fin
          } : null,
          guardarecurso: actividad.usuario?.usr_id?.toString() || '',
          guardarecursoNombre: actividad.usuario ? `${actividad.usuario.usr_nombre} ${actividad.usuario.usr_apellido}` : '',
          areaAsignada: actividad.usuario?.area?.ar_nombre || '',
          ubicacion: actividad.usuario?.area?.ar_nombre || 'Sin área',
          estado: actividad.estado?.std_nombre || 'Completada',
          // Coordenadas GPS de la ruta
          ruta: coordenadas && coordenadas.length > 0 ? coordenadas.map(coord => ({
            lat: coord.glc_latitud,
            lng: coord.glc_longitud,
            timestamp: coord.glc_fecha
          })) : null,
          tieneGPS: coordenadas && coordenadas.length > 0
        };
      })
    );

    return c.json({ success: true, rutas: rutasConCoordenadas });
  } catch (error) {
    console.error('Error en GET /rutas:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

// =============================================
// 🚨 ENDPOINTS DE INCIDENTES CON VISITANTES
// =============================================

/**
 * Obtener todos los incidentes
 * @route GET /make-server-811550f1/incidentes
 * @returns Array de incidentes
 */
app.get("/make-server-811550f1/incidentes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener incidentes con JOINs
    const { data, error } = await supabaseAdmin
      .from('incidente')
      .select(`
        inc_id,
        inc_titulo,
        inc_descipcion,
        inc_fecha,
        created_at,
        categoria:inc_categoria (ctg_id, ctg_nombre),
        usuario:inc_usuario (usr_id, usr_nombre, usr_apellido, usr_area),
        estado:inc_estado (std_id, std_nombre)
      `)
      .order('inc_fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener incidentes:', error);
      return c.json({ success: false, error: "Error al obtener incidentes" }, 500);
    }

    // Obtener IDs de áreas únicas
    const areaIds = [...new Set((data || [])
      .map(inc => inc.usuario?.usr_area)
      .filter(id => id != null))];

    // Obtener información de áreas
    let areasMap: Record<number, { ar_id: number; ar_nombre: string }> = {};
    if (areaIds.length > 0) {
      const { data: areasData } = await supabaseAdmin
        .from('area')
        .select('ar_id, ar_nombre')
        .in('ar_id', areaIds);
      
      if (areasData) {
        areasMap = Object.fromEntries(
          areasData.map(area => [area.ar_id, area])
        );
      }
    }

    // Obtener seguimientos para todos los incidentes
    const incidenteIds = (data || []).map(inc => inc.inc_id);
    let seguimientosMap: Record<number, any[]> = {};
    
    if (incidenteIds.length > 0) {
      const { data: seguimientosData } = await supabaseAdmin
        .from('seguimiento')
        .select(`
          sgm_id,
          sgm_incidente,
          sgm_accion,
          sgm_observaciones,
          sgm_fecha,
          usuario:sgm_usuario (usr_id, usr_nombre, usr_apellido)
        `)
        .in('sgm_incidente', incidenteIds)
        .order('sgm_fecha', { ascending: true });
      
      if (seguimientosData) {
        // Agrupar seguimientos por incidente
        seguimientosData.forEach((seg: any) => {
          const incId = seg.sgm_incidente;
          if (!seguimientosMap[incId]) {
            seguimientosMap[incId] = [];
          }
          seguimientosMap[incId].push({
            id: seg.sgm_id,
            fecha: seg.sgm_fecha,
            accion: seg.sgm_accion,
            responsable: seg.usuario ? `${seg.usuario.usr_nombre} ${seg.usuario.usr_apellido}` : 'Usuario',
            observaciones: seg.sgm_observaciones
          });
        });
      }
    }

    // Mapear a formato esperado por el frontend
    const incidentes = (data || []).map(inc => {
      const areaId = inc.usuario?.usr_area;
      const area = areaId ? areasMap[areaId] : null;
      
      return {
        id: inc.inc_id.toString(),
        titulo: inc.inc_titulo,
        descripcion: inc.inc_descipcion || '', // Nota: hay un typo en la BD (descipcion)
        fechaIncidente: inc.inc_fecha,
        fechaReporte: inc.created_at || inc.inc_fecha, // Usar created_at si está disponible
        gravedad: inc.categoria?.ctg_nombre || 'Leve',
        categoria: inc.categoria?.ctg_nombre || 'Leve',
        estado: inc.estado?.std_nombre || 'Reportado',
        guardarecurso: inc.usuario?.usr_id?.toString() || '',
        guardarecursoNombre: inc.usuario ? `${inc.usuario.usr_nombre} ${inc.usuario.usr_apellido}` : '',
        areaProtegida: area?.ar_id?.toString() || '',
        areaProtegidaNombre: area?.ar_nombre || '',
        acciones: [],
        autoridades: [],
        seguimiento: seguimientosMap[inc.inc_id] || []
      };
    });

    return c.json({ success: true, incidentes });
  } catch (error) {
    console.error('Error en GET /incidentes:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Crear un nuevo incidente
 * @route POST /make-server-811550f1/incidentes
 * @body { titulo, descripcion, categoria }
 * @returns Incidente creado
 */
app.post("/make-server-811550f1/incidentes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación y obtener usuario
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener usuario desde la BD
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    const body = await c.req.json();
    const { titulo, descripcion, gravedad } = body;

    if (!titulo || !descripcion) {
      return c.json({ success: false, error: "Faltan campos requeridos" }, 400);
    }

    // Obtener ID de categoría (gravedad)
    const { data: categoriaData, error: errorCategoria } = await supabaseAdmin
      .from('categoria')
      .select('ctg_id')
      .eq('ctg_nombre', gravedad || 'Leve')
      .maybeSingle();

    if (errorCategoria || !categoriaData) {
      return c.json({ success: false, error: "Categoría no encontrada" }, 400);
    }

    // Obtener ID del estado "Reportado"
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Reportado')
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: "Estado 'Reportado' no encontrado" }, 500);
    }

    // Crear incidente con fecha/hora de Guatemala
    const { data: nuevoIncidente, error } = await supabaseAdmin
      .from('incidente')
      .insert([{
        inc_titulo: titulo,
        inc_descipcion: descripcion, // Nota: typo en la BD
        inc_fecha: getGuatemalaDateTime(),
        inc_categoria: categoriaData.ctg_id,
        inc_usuario: usuarioData.usr_id,
        inc_estado: estadoData.std_id
      }])
      .select(`
        inc_id,
        inc_titulo,
        inc_descipcion,
        inc_fecha,
        created_at,
        categoria:inc_categoria (ctg_id, ctg_nombre),
        usuario:inc_usuario (usr_id, usr_nombre, usr_apellido, usr_area),
        estado:inc_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al crear incidente:', error);
      return c.json({ success: false, error: "Error al crear incidente" }, 500);
    }

    // Obtener información del área si existe
    let areaNombre = '';
    if (nuevoIncidente.usuario?.usr_area) {
      const { data: areaData } = await supabaseAdmin
        .from('area')
        .select('ar_nombre')
        .eq('ar_id', nuevoIncidente.usuario.usr_area)
        .maybeSingle();
      
      areaNombre = areaData?.ar_nombre || '';
    }

    // Mapear a formato del frontend
    const incidente = {
      id: nuevoIncidente.inc_id.toString(),
      titulo: nuevoIncidente.inc_titulo,
      descripcion: nuevoIncidente.inc_descipcion || '',
      fechaIncidente: nuevoIncidente.inc_fecha,
      fechaReporte: nuevoIncidente.created_at || nuevoIncidente.inc_fecha,
      gravedad: nuevoIncidente.categoria?.ctg_nombre || 'Leve',
      categoria: nuevoIncidente.categoria?.ctg_nombre || 'Leve',
      estado: nuevoIncidente.estado?.std_nombre || 'Reportado',
      guardarecurso: nuevoIncidente.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: nuevoIncidente.usuario ? `${nuevoIncidente.usuario.usr_nombre} ${nuevoIncidente.usuario.usr_apellido}` : '',
      areaProtegida: nuevoIncidente.usuario?.usr_area?.toString() || '',
      areaProtegidaNombre: areaNombre,
      acciones: [],
      autoridades: [],
      seguimiento: []
    };

    return c.json({ success: true, incidente });
  } catch (error) {
    console.error('Error en POST /incidentes:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Cambiar estado de un incidente
 * @route PATCH /make-server-811550f1/incidentes/:id/estado
 * @body { nuevoEstado }
 * @returns Incidente actualizado
 */
app.patch("/make-server-811550f1/incidentes/:id/estado", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const incidenteId = c.req.param('id');
    const body = await c.req.json();
    const { nuevoEstado } = body;

    if (!nuevoEstado) {
      return c.json({ success: false, error: "Nuevo estado requerido" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener ID del nuevo estado
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: `Estado '${nuevoEstado}' no encontrado` }, 400);
    }

    // Actualizar estado del incidente
    const { data, error } = await supabaseAdmin
      .from('incidente')
      .update({ inc_estado: estadoData.std_id })
      .eq('inc_id', parseInt(incidenteId))
      .select(`
        inc_id,
        inc_titulo,
        inc_descipcion,
        inc_fecha,
        created_at,
        categoria:inc_categoria (ctg_id, ctg_nombre),
        usuario:inc_usuario (usr_id, usr_nombre, usr_apellido, usr_area),
        estado:inc_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al cambiar estado:', error);
      return c.json({ success: false, error: "Error al cambiar estado" }, 500);
    }

    // Obtener información del área si existe
    let areaNombre = '';
    if (data.usuario?.usr_area) {
      const { data: areaData } = await supabaseAdmin
        .from('area')
        .select('ar_nombre')
        .eq('ar_id', data.usuario.usr_area)
        .maybeSingle();
      
      areaNombre = areaData?.ar_nombre || '';
    }

    // Mapear a formato del frontend
    const incidente = {
      id: data.inc_id.toString(),
      titulo: data.inc_titulo,
      descripcion: data.inc_descipcion || '',
      fechaIncidente: data.inc_fecha,
      fechaReporte: data.created_at || data.inc_fecha,
      gravedad: data.categoria?.ctg_nombre || 'Leve',
      categoria: data.categoria?.ctg_nombre || 'Leve',
      estado: data.estado?.std_nombre || 'Reportado',
      guardarecurso: data.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: data.usuario ? `${data.usuario.usr_nombre} ${data.usuario.usr_apellido}` : '',
      areaProtegida: data.usuario?.usr_area?.toString() || '',
      areaProtegidaNombre: areaNombre,
      acciones: [],
      autoridades: [],
      seguimiento: []
    };

    return c.json({ success: true, incidente });
  } catch (error) {
    console.error('Error en PATCH /incidentes/:id/estado:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Eliminar un incidente
 * @route DELETE /make-server-811550f1/incidentes/:id
 * @returns Mensaje de éxito
 */
app.delete("/make-server-811550f1/incidentes/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const incidenteId = c.req.param('id');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Eliminar incidente
    const { error } = await supabaseAdmin
      .from('incidente')
      .delete()
      .eq('inc_id', parseInt(incidenteId));

    if (error) {
      console.error('Error al eliminar incidente:', error);
      return c.json({ success: false, error: "Error al eliminar incidente" }, 500);
    }

    return c.json({ success: true, message: "Incidente eliminado correctamente" });
  } catch (error) {
    console.error('Error en DELETE /incidentes/:id:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Crear un nuevo seguimiento para un incidente
 * @route POST /make-server-811550f1/incidentes/:id/seguimiento
 * @body { accion, observaciones }
 * @returns Seguimiento creado
 */
app.post("/make-server-811550f1/incidentes/:id/seguimiento", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const incidenteId = c.req.param('id');
    const body = await c.req.json();
    const { accion, observaciones } = body;

    if (!accion || !observaciones) {
      return c.json({ success: false, error: "Faltan campos requeridos" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación y obtener usuario
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener usuario desde la BD
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_nombre, usr_apellido')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    // Crear seguimiento con fecha de Guatemala
    const { data: nuevoSeguimiento, error } = await supabaseAdmin
      .from('seguimiento')
      .insert([{
        sgm_accion: accion,
        sgm_observaciones: observaciones,
        sgm_fecha: getGuatemalaDate(),
        sgm_usuario: usuarioData.usr_id,
        sgm_incidente: parseInt(incidenteId)
      }])
      .select(`
        sgm_id,
        sgm_accion,
        sgm_observaciones,
        sgm_fecha,
        usuario:sgm_usuario (usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('Error al crear seguimiento:', error);
      return c.json({ success: false, error: "Error al crear seguimiento" }, 500);
    }

    // Mapear a formato del frontend
    const seguimiento = {
      id: nuevoSeguimiento.sgm_id,
      fecha: nuevoSeguimiento.sgm_fecha,
      accion: nuevoSeguimiento.sgm_accion,
      responsable: nuevoSeguimiento.usuario ? `${nuevoSeguimiento.usuario.usr_nombre} ${nuevoSeguimiento.usuario.usr_apellido}` : 'Usuario',
      observaciones: nuevoSeguimiento.sgm_observaciones
    };

    return c.json({ success: true, seguimiento });
  } catch (error) {
    console.error('Error en POST /incidentes/:id/seguimiento:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

// =============================================
// 🔍 ENDPOINTS DE REPORTE DE HALLAZGOS
// =============================================

/**
 * Obtener todos los hallazgos
 * @route GET /make-server-811550f1/hallazgos
 * @returns Array de hallazgos
 */
app.get("/make-server-811550f1/hallazgos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener hallazgos con JOINs
    const { data, error } = await supabaseAdmin
      .from('hallazgo')
      .select(`
        hlz_id,
        hlz_nombre,
        hlz_descripcion,
        hlz_latitud,
        hlz_longitud,
        hlz_fecha,
        categoria:hlz_categoria (ctg_id, ctg_nombre),
        usuario:hlz_usuario (usr_id, usr_nombre, usr_apellido, usr_area, area:usr_area (ar_id, ar_nombre)),
        estado:hlz_estado (std_id, std_nombre)
      `)
      .order('hlz_fecha', { ascending: false });

    if (error) {
      console.error('Error detallado al obtener hallazgos:', JSON.stringify(error, null, 2));
      return c.json({ success: false, error: `Error al obtener hallazgos: ${error.message || error.details || 'Error desconocido'}` }, 500);
    }

    // Obtener seguimientos para todos los hallazgos
    const hallazgoIds = (data || []).map(h => h.hlz_id);
    let seguimientosPorHallazgo: Record<number, any[]> = {};
    
    if (hallazgoIds.length > 0) {
      const { data: seguimientos, error: errorSeguimientos } = await supabaseAdmin
        .from('seguimiento')
        .select(`
          sgm_id,
          sgm_accion,
          sgm_observaciones,
          sgm_fecha,
          sgm_hallazgo,
          usuario:sgm_usuario (usr_id, usr_nombre, usr_apellido)
        `)
        .in('sgm_hallazgo', hallazgoIds)
        .order('sgm_fecha', { ascending: false });

      if (!errorSeguimientos && seguimientos) {
        // Agrupar seguimientos por hallazgo
        seguimientos.forEach(seg => {
          if (!seguimientosPorHallazgo[seg.sgm_hallazgo]) {
            seguimientosPorHallazgo[seg.sgm_hallazgo] = [];
          }
          seguimientosPorHallazgo[seg.sgm_hallazgo].push({
            id: seg.sgm_id,
            fecha: seg.sgm_fecha,
            accion: seg.sgm_accion,
            responsable: seg.usuario ? `${seg.usuario.usr_nombre} ${seg.usuario.usr_apellido}` : 'Usuario',
            observaciones: seg.sgm_observaciones
          });
        });
      }
    }

    // Mapear a formato esperado por el frontend
    const hallazgos = (data || []).map(h => ({
      id: h.hlz_id.toString(),
      titulo: h.hlz_nombre,
      descripcion: h.hlz_descripcion || '',
      ubicacion: `${h.hlz_latitud.toFixed(6)}, ${h.hlz_longitud.toFixed(6)}`,
      coordenadas: {
        lat: h.hlz_latitud,
        lng: h.hlz_longitud
      },
      observaciones: '',
      accionesTomadas: '',
      fechaReporte: h.hlz_fecha,
      fechaResolucion: undefined,
      prioridad: h.categoria?.ctg_nombre || 'Moderado',
      estado: h.estado?.std_nombre || 'Reportado',
      guardarecurso: h.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: h.usuario ? `${h.usuario.usr_nombre} ${h.usuario.usr_apellido}` : '',
      areaProtegida: h.usuario?.area?.ar_id?.toString() || '',
      areaProtegidaNombre: h.usuario?.area?.ar_nombre || '',
      actividadId: null,
      evidencias: [],
      seguimiento: seguimientosPorHallazgo[h.hlz_id] || []
    }));

    return c.json({ success: true, hallazgos });
  } catch (error) {
    console.error('Error en GET /hallazgos:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Crear un nuevo hallazgo
 * @route POST /make-server-811550f1/hallazgos
 * @body { titulo, descripcion, ubicacion, prioridad, coordenadas, observaciones }
 * @returns Hallazgo creado
 */
app.post("/make-server-811550f1/hallazgos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación y obtener usuario
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener usuario desde la BD con su área
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_nombre, usr_apellido, usr_area, area:usr_area (ar_id, ar_nombre)')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    const body = await c.req.json();
    const { titulo, descripcion, prioridad, coordenadas } = body;

    if (!titulo || !descripcion || !coordenadas?.lat || !coordenadas?.lng) {
      return c.json({ success: false, error: "Faltan campos requeridos (título, descripción y coordenadas son obligatorios)" }, 400);
    }

    // Obtener ID de categoría (prioridad)
    const { data: categoriaData, error: errorCategoria } = await supabaseAdmin
      .from('categoria')
      .select('ctg_id')
      .eq('ctg_nombre', prioridad || 'Moderado')
      .maybeSingle();

    if (errorCategoria || !categoriaData) {
      return c.json({ success: false, error: "Categoría no encontrada" }, 400);
    }

    // Obtener ID del estado "Reportado"
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', 'Reportado')
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: "Estado 'Reportado' no encontrado" }, 500);
    }

    // Crear hallazgo con fecha de Guatemala
    const { data: nuevoHallazgo, error } = await supabaseAdmin
      .from('hallazgo')
      .insert([{
        hlz_nombre: titulo,
        hlz_descripcion: descripcion,
        hlz_latitud: coordenadas.lat,
        hlz_longitud: coordenadas.lng,
        hlz_fecha: getGuatemalaDate(),
        hlz_categoria: categoriaData.ctg_id,
        hlz_usuario: usuarioData.usr_id,
        hlz_estado: estadoData.std_id
      }])
      .select(`
        hlz_id,
        hlz_nombre,
        hlz_descripcion,
        hlz_latitud,
        hlz_longitud,
        hlz_fecha,
        categoria:hlz_categoria (ctg_id, ctg_nombre),
        usuario:hlz_usuario (usr_id, usr_nombre, usr_apellido),
        estado:hlz_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al crear hallazgo:', error);
      return c.json({ success: false, error: "Error al crear hallazgo" }, 500);
    }

    // Mapear a formato del frontend
    const hallazgo = {
      id: nuevoHallazgo.hlz_id.toString(),
      titulo: nuevoHallazgo.hlz_nombre,
      descripcion: nuevoHallazgo.hlz_descripcion || '',
      ubicacion: `${nuevoHallazgo.hlz_latitud.toFixed(6)}, ${nuevoHallazgo.hlz_longitud.toFixed(6)}`,
      coordenadas: {
        lat: nuevoHallazgo.hlz_latitud,
        lng: nuevoHallazgo.hlz_longitud
      },
      observaciones: '',
      accionesTomadas: '',
      fechaReporte: nuevoHallazgo.hlz_fecha,
      fechaResolucion: undefined,
      prioridad: nuevoHallazgo.categoria?.ctg_nombre || 'Moderado',
      estado: nuevoHallazgo.estado?.std_nombre || 'Reportado',
      guardarecurso: nuevoHallazgo.usuario?.usr_id?.toString() || usuarioData.usr_id.toString(),
      guardarecursoNombre: nuevoHallazgo.usuario ? `${nuevoHallazgo.usuario.usr_nombre} ${nuevoHallazgo.usuario.usr_apellido}` : `${usuarioData.usr_nombre} ${usuarioData.usr_apellido}`,
      areaProtegida: usuarioData.area?.ar_id?.toString() || '',
      areaProtegidaNombre: usuarioData.area?.ar_nombre || '',
      actividadId: null,
      evidencias: [],
      seguimiento: []
    };

    return c.json({ success: true, hallazgo });
  } catch (error) {
    console.error('Error en POST /hallazgos:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Cambiar estado de un hallazgo
 * @route PATCH /make-server-811550f1/hallazgos/:id/estado
 * @body { nuevoEstado }
 * @returns Hallazgo actualizado
 */
app.patch("/make-server-811550f1/hallazgos/:id/estado", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const hallazgoId = c.req.param('id');
    const body = await c.req.json();
    const { nuevoEstado } = body;

    if (!nuevoEstado) {
      return c.json({ success: false, error: "Nuevo estado requerido" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener ID del nuevo estado
    const { data: estadoData, error: errorEstado } = await supabaseAdmin
      .from('estado')
      .select('std_id')
      .eq('std_nombre', nuevoEstado)
      .maybeSingle();

    if (errorEstado || !estadoData) {
      return c.json({ success: false, error: `Estado '${nuevoEstado}' no encontrado` }, 400);
    }

    // Actualizar estado del hallazgo
    const { data, error } = await supabaseAdmin
      .from('hallazgo')
      .update({ hlz_estado: estadoData.std_id })
      .eq('hlz_id', parseInt(hallazgoId))
      .select(`
        hlz_id,
        hlz_nombre,
        hlz_descripcion,
        hlz_latitud,
        hlz_longitud,
        hlz_fecha,
        categoria:hlz_categoria (ctg_id, ctg_nombre),
        usuario:hlz_usuario (usr_id, usr_nombre, usr_apellido),
        estado:hlz_estado (std_id, std_nombre)
      `)
      .single();

    if (error) {
      console.error('Error al cambiar estado:', error);
      return c.json({ success: false, error: "Error al cambiar estado" }, 500);
    }

    // Mapear a formato del frontend
    const hallazgo = {
      id: data.hlz_id.toString(),
      titulo: data.hlz_nombre,
      descripcion: data.hlz_descripcion || '',
      ubicacion: '',
      coordenadas: {
        lat: data.hlz_latitud,
        lng: data.hlz_longitud
      },
      observaciones: '',
      accionesTomadas: '',
      fechaReporte: data.hlz_fecha,
      fechaResolucion: undefined,
      prioridad: data.categoria?.ctg_nombre || 'Media',
      estado: data.estado?.std_nombre || 'Reportado',
      guardarecurso: data.usuario?.usr_id?.toString() || '',
      guardarecursoNombre: data.usuario ? `${data.usuario.usr_nombre} ${data.usuario.usr_apellido}` : '',
      areaProtegida: '',
      evidencias: [],
      seguimiento: []
    };

    return c.json({ success: true, hallazgo });
  } catch (error) {
    console.error('Error en PATCH /hallazgos/:id/estado:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Eliminar un hallazgo
 * @route DELETE /make-server-811550f1/hallazgos/:id
 * @returns Mensaje de éxito
 */
app.delete("/make-server-811550f1/hallazgos/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const hallazgoId = c.req.param('id');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Eliminar hallazgo
    const { error } = await supabaseAdmin
      .from('hallazgo')
      .delete()
      .eq('hlz_id', parseInt(hallazgoId));

    if (error) {
      console.error('Error al eliminar hallazgo:', error);
      return c.json({ success: false, error: "Error al eliminar hallazgo" }, 500);
    }

    return c.json({ success: true, message: "Hallazgo eliminado correctamente" });
  } catch (error) {
    console.error('Error en DELETE /hallazgos/:id:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * Agregar seguimiento a un hallazgo
 * @route POST /make-server-811550f1/hallazgos/:id/seguimiento
 * @body { accion, observaciones }
 * @returns Seguimiento creado
 */
app.post("/make-server-811550f1/hallazgos/:id/seguimiento", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const hallazgoId = c.req.param('id');
    const body = await c.req.json();
    const { accion, observaciones } = body;

    if (!accion || !observaciones) {
      return c.json({ success: false, error: "Faltan campos requeridos" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación y obtener usuario
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener usuario desde la BD
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_nombre, usr_apellido')
      .eq('usr_correo', userData.user.email)
      .maybeSingle();

    if (usuarioError || !usuarioData) {
      return c.json({ success: false, error: "Usuario no encontrado" }, 404);
    }

    // Crear seguimiento con fecha de Guatemala
    const { data: nuevoSeguimiento, error } = await supabaseAdmin
      .from('seguimiento')
      .insert([{
        sgm_accion: accion,
        sgm_observaciones: observaciones,
        sgm_fecha: getGuatemalaDate(),
        sgm_usuario: usuarioData.usr_id,
        sgm_hallazgo: parseInt(hallazgoId)
      }])
      .select(`
        sgm_id,
        sgm_accion,
        sgm_observaciones,
        sgm_fecha,
        usuario:sgm_usuario (usr_id, usr_nombre, usr_apellido)
      `)
      .single();

    if (error) {
      console.error('Error al crear seguimiento:', error);
      return c.json({ success: false, error: "Error al crear seguimiento" }, 500);
    }

    // Mapear a formato del frontend
    const seguimiento = {
      id: nuevoSeguimiento.sgm_id,
      fecha: nuevoSeguimiento.sgm_fecha,
      accion: nuevoSeguimiento.sgm_accion,
      responsable: nuevoSeguimiento.usuario ? `${nuevoSeguimiento.usuario.usr_nombre} ${nuevoSeguimiento.usuario.usr_apellido}` : 'Usuario',
      observaciones: nuevoSeguimiento.sgm_observaciones
    };

    return c.json({ success: true, seguimiento });
  } catch (error) {
    console.error('Error en POST /hallazgos/:id/seguimiento:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

/**
 * ============================================================================
 * 🔍 ENDPOINTS: Hallazgos
 * Manejo de hallazgos reportados
 * ============================================================================
 */

/**
 * DEBUG: Verificar datos de usuario y área
 * @route GET /make-server-811550f1/debug/usuario/:id
 */
app.get("/make-server-811550f1/debug/usuario/:id", async (c) => {
  try {
    const userId = c.req.param('id');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Consultar usuario con área
    const { data: usuario, error } = await supabaseAdmin
      .from('usuario')
      .select(`
        usr_id,
        usr_nombre,
        usr_apellido,
        usr_area,
        area:usr_area(ar_id, ar_nombre)
      `)
      .eq('usr_id', userId)
      .single();

    if (error) {
      console.error('Error en debug:', error);
      return c.json({ success: false, error: error.message });
    }

    return c.json({ success: true, usuario });
  } catch (error) {
    console.error('Error en debug:', error);
    return c.json({ success: false, error: String(error) });
  }
});

// =============================================
// 🔐 CAMBIAR CONTRASEÑA DE USUARIO
// =============================================

/**
 * Cambiar contraseña de un usuario
 * Admin puede cambiar contraseñas de Coordinadores y Guardarecursos
 * Coordinador puede cambiar contraseñas de Guardarecursos
 * @route POST /make-server-811550f1/cambiar-contrasena
 */
app.post("/make-server-811550f1/cambiar-contrasena", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken || accessToken === 'undefined') {
      return c.json({ success: false, error: "No autorizado" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar autenticación del usuario actual
    const { data: currentUserAuth, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !currentUserAuth.user) {
      return c.json({ success: false, error: "Token inválido" }, 401);
    }

    // Obtener datos del usuario actual desde la BD
    const { data: currentUsuario, error: currentUsuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_correo, rol:usr_rol(rl_id, rl_nombre)')
      .eq('usr_correo', currentUserAuth.user.email)
      .maybeSingle();

    if (currentUsuarioError || !currentUsuario) {
      return c.json({ success: false, error: "Usuario actual no encontrado en BD" }, 404);
    }

    const body = await c.req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return c.json({ success: false, error: "Faltan parámetros: userId y newPassword son requeridos" }, 400);
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return c.json({ success: false, error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }

    // Obtener datos del usuario objetivo
    const { data: targetUsuario, error: targetUsuarioError } = await supabaseAdmin
      .from('usuario')
      .select('usr_id, usr_correo, rol:usr_rol(rl_id, rl_nombre)')
      .eq('usr_id', parseInt(userId))
      .maybeSingle();

    if (targetUsuarioError || !targetUsuario) {
      return c.json({ success: false, error: "Usuario objetivo no encontrado" }, 404);
    }

    // Verificar permisos según roles
    const currentRol = currentUsuario.rol?.rl_nombre;
    const targetRol = targetUsuario.rol?.rl_nombre;

    // REGLA 1: NUNCA se puede cambiar la contraseña de un Administrador
    if (targetRol === 'Administrador') {
      return c.json({ success: false, error: "No se puede cambiar la contraseña de un Administrador" }, 403);
    }

    // REGLA 2: Administradores pueden cambiar contraseñas de Coordinadores y Guardarecursos
    if (currentRol === 'Administrador' && (targetRol === 'Coordinador' || targetRol === 'Guardarecurso')) {
      // Permitido
    }
    // REGLA 3: Coordinadores solo pueden cambiar contraseñas de Guardarecursos
    else if (currentRol === 'Coordinador' && targetRol === 'Guardarecurso') {
      // Permitido
    }
    // Cualquier otra combinación no está permitida
    else {
      return c.json({ success: false, error: `No tiene permisos. ${currentRol} no puede cambiar contraseña de ${targetRol}` }, 403);
    }

    // Buscar el usuario en Supabase Auth por email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error al listar usuarios de Auth:', listError);
      return c.json({ success: false, error: "Error al buscar usuario en Auth" }, 500);
    }

    const authUser = authUsers.users.find(u => u.email === targetUsuario.usr_correo);
    
    if (!authUser) {
      console.error(`Usuario con email ${targetUsuario.usr_correo} no encontrado en Supabase Auth`);
      return c.json({ success: false, error: "Usuario no encontrado en sistema de autenticación" }, 404);
    }

    // Cambiar contraseña usando Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error al actualizar contraseña en Supabase Auth:', updateError);
      return c.json({ success: false, error: `Error al cambiar contraseña: ${updateError.message}` }, 500);
    }

    console.log(`Contraseña actualizada exitosamente para usuario ${targetUsuario.usr_correo} (ID: ${userId}) por ${currentUsuario.usr_correo}`);
    return c.json({ success: true, message: "Contraseña actualizada exitosamente" });

  } catch (error) {
    console.error('Error en POST /cambiar-contrasena:', error);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
  }
});

Deno.serve(app.fetch);
