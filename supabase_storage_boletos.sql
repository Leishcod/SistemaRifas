-- ==============================================================================
-- CREAR BUCKET PÚBLICO 'boletos' Y PERMISOS DE ALMACENAMIENTO
-- Sistema de Rifas FIIS 2026 - CEIIS
-- ==============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase -> SQL Editor -> New query
-- 2. Pega este código y presiona "Run"
-- ==============================================================================

-- 1. Insertar el bucket público 'boletos' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('boletos', 'boletos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir lectura pública de los boletos para que cualquier comprador pueda ver su rifa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Lectura publica boletos'
  ) THEN
    CREATE POLICY "Lectura publica boletos" ON storage.objects
    FOR SELECT USING (bucket_id = 'boletos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Subida boletos'
  ) THEN
    CREATE POLICY "Subida boletos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'boletos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Actualizacion boletos'
  ) THEN
    CREATE POLICY "Actualizacion boletos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'boletos');
  END IF;
END $$;
