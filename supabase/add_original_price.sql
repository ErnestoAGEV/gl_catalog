-- Script para agregar la columna original_price en la tabla products de Supabase
-- Ejecuta este comando en el SQL Editor de tu Dashboard de Supabase.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL;
