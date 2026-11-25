-- ==============================================================================
-- BLINDAJE DE SEGURIDAD TOTAL: LOGIN RPC Y PRIVACIDAD DE CONTRASEÑAS
-- Sistema de Rifas FIIS 2026 - CEIIS
-- ==============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Abre tu panel de Supabase: https://supabase.com/dashboard
-- 2. En el menú izquierdo ve a "SQL Editor" -> "New query"
-- 3. Pega todo este código y haz clic en "Run" (botón verde).
-- ==============================================================================

-- 1. Función RPC segura para autenticación (SECURITY DEFINER)
-- Esta función se ejecuta con permisos de administrador en la base de datos,
-- verifica las credenciales y devuelve únicamente los datos de sesión seguros.
-- ¡JAMÁS expone la contraseña al cliente ni por la red!
CREATE OR REPLACE FUNCTION public.verify_student_login(
    p_student_code text,
    p_password text
)
RETURNS TABLE (
    success boolean,
    student_code text,
    full_name text,
    promo_code text,
    role text,
    error_message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student record;
BEGIN
    -- Limpiar parámetros de entrada
    p_student_code := UPPER(TRIM(p_student_code));
    p_password := TRIM(p_password);

    -- Buscar estudiante por código UNI
    SELECT s.student_code, s.full_name, s.promo_code, s.role, s.password
    INTO v_student
    FROM students s
    WHERE UPPER(s.student_code) = p_student_code;

    -- Si no existe
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'Código UNI no encontrado en el padrón.'::text;
        RETURN;
    END IF;

    -- Si no tiene rol autorizado
    IF v_student.role IS NULL OR v_student.role = 'ninguno' THEN
        RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'Acceso Denegado: Tu código no cuenta con permisos de Delegado ni de Administración CEIIS.'::text;
        RETURN;
    END IF;

    -- Verificar contraseña
    IF v_student.password IS NULL OR v_student.password != p_password THEN
        RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, 'Contraseña incorrecta. Verifica tu clave o solicita un reseteo al CEIIS.'::text;
        RETURN;
    END IF;

    -- Credenciales válidas: devolver sesión
    RETURN QUERY SELECT 
        true,
        v_student.student_code,
        v_student.full_name,
        v_student.promo_code,
        v_student.role,
        NULL::text;
    RETURN;
END;
$$;

-- 2. Dar permisos de ejecución a la función para usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.verify_student_login(text, text) TO anon, authenticated, service_role;

-- 3. Crear una vista pública segura para que el buscador de estudiantes del formulario
-- NUNCA pueda consultar ni ver la columna 'password'
CREATE OR REPLACE VIEW public.students_public AS
SELECT 
    student_code,
    full_name,
    promo_code
FROM students;

GRANT SELECT ON public.students_public TO anon, authenticated, service_role;
