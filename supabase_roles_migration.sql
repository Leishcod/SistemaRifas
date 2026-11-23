-- ==============================================================================
-- MIGRACIÓN DE TABLA STUDENTS: ROLES Y CONTRASEÑAS - CEIIS FIIS 2026
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard).
-- 2. En el menú de la izquierda, entra a "SQL Editor".
-- 3. Haz clic en "New query", pega todo este contenido y presiona "Run" (botón verde).
-- ==============================================================================

-- 1. Agregar columna 'role' ('ninguno' | 'delegado' | 'ceiis') con valor por defecto 'ninguno'
ALTER TABLE students ADD COLUMN IF NOT EXISTS role text DEFAULT 'ninguno';

-- 2. Agregar columna 'password' (opcional / NULL para los que tienen rol 'ninguno')
ALTER TABLE students ADD COLUMN IF NOT EXISTS password text;

-- 3. Eliminar la columna obsoleta 'is_delegate' si todavía existe
ALTER TABLE students DROP COLUMN IF EXISTS is_delegate;

-- 4. Asegurar que los alumnos existentes que tengan role nulo queden con 'ninguno' y sin contraseña
UPDATE students 
SET role = 'ninguno', password = NULL 
WHERE role IS NULL;

-- 5. Configurar tu cuenta oficial (Leonel Cruzado) como rol 'ceiis' con contraseña
UPDATE students 
SET role = 'ceiis', password = 'ceiis2026', promo_code = '24-2'
WHERE student_code = '20244517G';

-- 6. Insertar o actualizar la cuenta directiva institucional 'CEIIS'
INSERT INTO students (student_code, full_name, promo_code, role, password)
VALUES ('CEIIS', 'Directiva CEIIS - FIIS', 'CEIIS', 'ceiis', 'ceiis2026')
ON CONFLICT (student_code) 
DO UPDATE SET role = 'ceiis', password = 'ceiis2026', promo_code = 'CEIIS';

-- 7. (Opcional) Plantilla para agregar o promover delegados de códigos:
-- Descomenta y adapta estas líneas cuando quieras asignar delegados:
-- INSERT INTO students (student_code, full_name, promo_code, role, password)
-- VALUES ('CODIGO_UNI', 'Nombre del Delegado', '24-1', 'delegado', 'dele2026')
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
