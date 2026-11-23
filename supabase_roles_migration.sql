-- ==============================================================================
-- MIGRACIÓN DE TABLA STUDENTS: ROLES Y CONTRASEÑAS - CEIIS FIIS 2026
-- ==============================================================================
-- Acceso exclusivo con CÓDIGO UNI (no existen cuentas genéricas de usuario).
-- 
-- Instrucciones:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard).
-- 2. En el menú de la izquierda, entra a "SQL Editor".
-- 3. Haz clic en "New query", pega todo este contenido y presiona "Run" (botón verde).
-- ==============================================================================

-- 1. Agregar columna 'role' ('ninguno' | 'delegado' | 'ceiis') con valor por defecto 'ninguno'
ALTER TABLE students ADD COLUMN IF NOT EXISTS role text DEFAULT 'ninguno';

-- 2. Agregar columna 'password' (opcional / NULL para estudiantes con rol 'ninguno')
ALTER TABLE students ADD COLUMN IF NOT EXISTS password text;

-- 3. Eliminar la columna obsoleta 'is_delegate' si todavía existe
ALTER TABLE students DROP COLUMN IF EXISTS is_delegate;

-- 4. Asegurar que los alumnos existentes sin rol queden con 'ninguno' y sin contraseña
UPDATE students 
SET role = 'ninguno', password = NULL 
WHERE role IS NULL;

-- 5. Eliminar cualquier usuario genérico previo que no sea código UNI
DELETE FROM students WHERE student_code IN ('CEIIS', 'ADMIN');

-- 6. Configurar tu código UNI oficial (Leonel Cruzado) con rol 'ceiis' y su contraseña
UPDATE students 
SET role = 'ceiis', password = 'ceiis2026', promo_code = '24-2'
WHERE student_code = '20244517G';

-- 7. (Opcional) Plantilla para agregar delegados u otros miembros CEIIS con su CÓDIGO UNI:
-- INSERT INTO students (student_code, full_name, promo_code, role, password)
-- VALUES ('20231001A', 'Nombre del Delegado', '23-1', 'delegado', 'dele2026')
-- ON CONFLICT (student_code) DO UPDATE SET role = 'delegado', password = 'dele2026';

-- 8. Asegurar políticas de seguridad RLS en la tabla students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Lectura publica students') THEN
    CREATE POLICY "Lectura publica students" ON students FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Insercion publica students') THEN
    CREATE POLICY "Insercion publica students" ON students FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Actualizacion publica students') THEN
    CREATE POLICY "Actualizacion publica students" ON students FOR UPDATE USING (true);
  END IF;
END $$;

-- ==============================================================================
-- FIN DE LA MIGRACIÓN
-- ==============================================================================
