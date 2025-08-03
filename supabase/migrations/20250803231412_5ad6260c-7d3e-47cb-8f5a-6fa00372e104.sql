-- Agregar campos faltantes a la tabla cotizaciones
ALTER TABLE public.cotizaciones 
ADD COLUMN corte TEXT,
ADD COLUMN tamaños_por_corte TEXT,
ADD COLUMN tamaños_por_pliego TEXT;