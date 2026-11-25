import type { SessionUser, Student } from '../types';
import { supabase } from '../lib/supabase';
import { INITIAL_STUDENTS } from '../data/students';

const AUTH_STORAGE_KEY = 'ceiis_rifas_session';

export function getAuthSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setAuthSession(user: SessionUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export async function loginUser(
  identifier: string,
  rawPassword: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = rawPassword.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: 'Por favor ingresa tu código UNI y contraseña.' };
  }

  // 1. Intentar autenticación segura en el servidor mediante RPC en Supabase
  try {
    const { data, error } = await supabase.rpc('verify_student_login', {
      p_student_code: cleanId,
      p_password: cleanPass,
    });

    if (!error && data && data.length > 0) {
      const result = data[0];
      if (result.success) {
        const sessionUser: SessionUser = {
          studentCode: result.student_code,
          fullName: result.full_name,
          promoCode: result.promo_code,
          role: result.role,
        };
        setAuthSession(sessionUser);
        return { success: true, user: sessionUser };
      } else {
        return { success: false, error: result.error_message || 'Credenciales incorrectas.' };
      }
    }
  } catch (rpcErr) {
    console.warn('RPC verify_student_login falló o no está instalada aún, verificando método alternativo:', rpcErr);
  }

  // 2. Método alternativo directo en Supabase (si el RPC aún no fue ejecutado en SQL Editor)
  try {
    const { data: dbUser, error: dbError } = await supabase
      .from('students')
      .select('student_code, full_name, promo_code, role, password')
      .eq('student_code', cleanId)
      .maybeSingle();

    if (!dbError && dbUser) {
      if (!dbUser.role || dbUser.role === 'ninguno') {
        return {
          success: false,
          error: 'Acceso Denegado: Tu código no cuenta con permisos de Delegado ni de Administración CEIIS.',
        };
      }

      if (dbUser.password === cleanPass) {
        const sessionUser: SessionUser = {
          studentCode: dbUser.student_code,
          fullName: dbUser.full_name,
          promoCode: dbUser.promo_code,
          role: dbUser.role,
        };
        setAuthSession(sessionUser);
        return { success: true, user: sessionUser };
      } else {
        return {
          success: false,
          error: 'Contraseña incorrecta. Verifica tu clave o solicita un reseteo al CEIIS.',
        };
      }
    }
  } catch (dbErr) {
    console.error('Error consultando base de datos:', dbErr);
  }

  // 3. Fallback de emergencia con INITIAL_STUDENTS
  const fallback = INITIAL_STUDENTS.find((s) => s.studentCode.toUpperCase() === cleanId);
  if (!fallback) {
    return { success: false, error: 'Código UNI no encontrado en el padrón.' };
  }
  if (!fallback.role || fallback.role === 'ninguno') {
    return {
      success: false,
      error: 'Acceso Denegado: Tu código no cuenta con permisos de Delegado ni de Administración CEIIS.',
    };
  }
  if (fallback.password && fallback.password !== cleanPass) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Verifica tu clave o solicita un reseteo al CEIIS.',
    };
  }

  const sessionUser: SessionUser = {
    studentCode: fallback.studentCode,
    fullName: fallback.fullName,
    promoCode: fallback.promoCode,
    role: fallback.role,
  };
  setAuthSession(sessionUser);
  return { success: true, user: sessionUser };
}
