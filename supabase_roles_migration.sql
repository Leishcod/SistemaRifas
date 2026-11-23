-- ==============================================================================
-- MIGRACIÓN: ROLES Y CONTRASEÑAS - SISTEMA DE RIFAS FIIS 2026
-- ==============================================================================
-- Ejecutar en Supabase: SQL Editor -> New query -> Run

-- 1. Agregar columna 'role' (ninguno | delegado | ceiis) y 'password'
ALTER TABLE students ADD COLUMN IF NOT EXISTS role text DEFAULT 'ninguno';
ALTER TABLE students ADD COLUMN IF NOT EXISTS password text;

-- 2. Eliminar columna obsoleta 'is_delegate'
ALTER TABLE students DROP COLUMN IF EXISTS is_delegate;

-- 3. Configurar tu cuenta (Leonel Cruzado) como rol 'ceiis'
UPDATE students 
SET role = 'ceiis', password = 'ceiis2026' 
WHERE student_code = '20244517G';

-- 4. Registrar cuenta directiva CEIIS
INSERT INTO students (student_code, full_name, promo_code, role, password)
VALUES ('CEIIS', 'Directiva CEIIS - FIIS', 'CEIIS', 'ceiis', 'ceiis2026')
ON CONFLICT (student_code) 
DO UPDATE SET role = 'ceiis', password = 'ceiis2026';

-- ==============================================================================
-- LISTO: Ahora la tabla students cuenta con roles diferenciados y contraseñas.
-- ==============================================================================
