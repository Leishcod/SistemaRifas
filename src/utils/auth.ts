import type { SessionUser, Student } from '../types';
import { fetchStudentsFromSupabase, getStudents } from './storage';
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

  // Cargar estudiantes actualizados de Supabase
  let students = await fetchStudentsFromSupabase();
  if (!students || students.length === 0) {
    students = getStudents();
  }

  // Buscar estrictamente por código de estudiante UNI
  const found = students.find((s) => s.studentCode.toUpperCase() === cleanId);

  // Si no se encuentra en Supabase, verificar con INITIAL_STUDENTS por si acaso
  const student: Student | undefined =
    found || INITIAL_STUDENTS.find((s) => s.studentCode.toUpperCase() === cleanId);

  if (!student) {
    return {
      success: false,
      error: 'Código UNI no encontrado en el padrón.',
    };
  }

  // Verificar rol
  if (!student.role || student.role === 'ninguno') {
    return {
      success: false,
      error:
        'Acceso Denegado: Tu código no cuenta con permisos de Delegado ni de Administración CEIIS.',
    };
  }

  // Verificar contraseña
  const expectedPassword =
    student.password || (student.role === 'ceiis' ? 'ceiis2026' : 'dele2026');

  if (cleanPass !== expectedPassword) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Verifica tu clave o solicita un reseteo al CEIIS.',
    };
  }

  const sessionUser: SessionUser = {
    studentCode: student.studentCode,
    fullName: student.fullName,
    promoCode: student.promoCode,
    role: student.role,
  };

  setAuthSession(sessionUser);
  return { success: true, user: sessionUser };
}
