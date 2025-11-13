/**
 * 🔐 Supabase Client
 * 
 * Cliente centralizado de Supabase para autenticación y consultas a la base de datos.
 * 
 * @module utils/supabase/client
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Crear cliente de Supabase con la configuración del proyecto
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Helper para verificar si hay una sesión activa
export async function getActiveSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  return error ? null : session;
}

// Helper para cerrar sesión
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return !error;
}
