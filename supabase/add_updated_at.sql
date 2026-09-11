-- Columna updated_at en products, para que el <lastmod> del sitemap diga la
-- verdad.
--
-- Hoy el sitemap usa created_at, que es la fecha de alta y no se mueve nunca:
-- si cambias el precio, el stock o la descripción de un producto, Google lee
-- una fecha de hace meses y no tiene motivo para volver a rastrear la ficha.
--
-- Ejecutar en el SQL Editor del Dashboard de Supabase. Es seguro correrlo dos
-- veces.

-- 1. La columna. Arranca igual que created_at para no inventar una fecha de
--    modificación que nunca ocurrió.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.products
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE public.products
ALTER COLUMN updated_at SET DEFAULT now();

-- 2. El trigger, para que se mantenga sola. Sin esto habría que acordarse de
--    tocarla en cada UPDATE del admin, y tarde o temprano se olvida.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3. Comprobación: las dos fechas deberían coincidir ahora, y separarse en
--    cuanto edites un producto desde el admin.
-- SELECT name, created_at, updated_at FROM public.products ORDER BY updated_at DESC LIMIT 5;
