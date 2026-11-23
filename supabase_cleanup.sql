-- ==============================================================================
-- LIMPIEZA Y ACTUALIZACIÓN - SISTEMA DE RIFAS CEIIS FIIS 2026
-- ==============================================================================

-- 1. Eliminar la columna operation_number de la tabla sales
ALTER TABLE sales DROP COLUMN IF EXISTS operation_number;

-- 2. Vaciar todos los alumnos de prueba de la tabla students
TRUNCATE TABLE students;

-- 3. Insertar únicamente el registro oficial de Leonel Adriano Cruzado Vega
INSERT INTO students (student_code, full_name, promo_code, is_delegate)
VALUES ('20244517G', 'Leonel Adriano Cruzado Vega', '24-2', false)
ON CONFLICT (student_code) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    promo_code = EXCLUDED.promo_code,
    is_delegate = EXCLUDED.is_delegate;

-- 4. Habilitar políticas completas (Select, Insert, Update, Delete) en students
CREATE POLICY "Eliminar estudiantes" ON students FOR DELETE USING (true);
CREATE POLICY "Actualizar estudiantes" ON students FOR UPDATE USING (true);
