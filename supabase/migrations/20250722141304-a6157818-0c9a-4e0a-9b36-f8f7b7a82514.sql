-- Extender constraint para permitir CAC
ALTER TABLE public.documentos_generados 
DROP CONSTRAINT IF EXISTS documentos_generados_tipo_documento_check;

ALTER TABLE public.documentos_generados 
ADD CONSTRAINT documentos_generados_tipo_documento_check 
CHECK (tipo_documento IN ('FACT', 'NDE', 'SAL', 'REC', 'NCRE', 'CAC'));

-- Añadir columnas específicas para CAC en documentos_generados
ALTER TABLE public.documentos_generados 
ADD COLUMN codificacion TEXT,
ADD COLUMN revision INTEGER,
ADD COLUMN fecha_caducidad DATE,
ADD COLUMN documento_origen_id INTEGER;

-- Crear tabla para resultados del CAC (relación 1-1)
CREATE TABLE public.cac_resultados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  documento_id INTEGER NOT NULL UNIQUE,
  ancho_real NUMERIC,
  alto_real NUMERIC, 
  profundidad_real NUMERIC,
  sustrato TEXT,
  calibre TEXT,
  colores TEXT,
  barniz TEXT,
  plastificado TEXT,
  troquelado TEXT,
  empaquetado TEXT,
  pegado TEXT,
  n_paquetes TEXT,
  extras JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (documento_id) REFERENCES public.documentos_generados(id) ON DELETE CASCADE
);

-- Crear tabla para archivos del CAC
CREATE TABLE public.cac_archivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  documento_id INTEGER NOT NULL,
  tipo_archivo TEXT NOT NULL CHECK (tipo_archivo IN ('arte_final', 'cotizacion')),
  nombre_archivo TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (documento_id) REFERENCES public.documentos_generados(id) ON DELETE CASCADE
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.cac_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cac_archivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cac_resultados
CREATE POLICY "Users can view their own cac_resultados" 
ON public.cac_resultados 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cac_resultados" 
ON public.cac_resultados 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cac_resultados" 
ON public.cac_resultados 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cac_resultados" 
ON public.cac_resultados 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para cac_archivos
CREATE POLICY "Users can view their own cac_archivos" 
ON public.cac_archivos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cac_archivos" 
ON public.cac_archivos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cac_archivos" 
ON public.cac_archivos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cac_archivos" 
ON public.cac_archivos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear triggers para updated_at
CREATE TRIGGER update_cac_resultados_updated_at
  BEFORE UPDATE ON public.cac_resultados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Actualizar función para manejar CAC
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_num INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    prefix TEXT;
BEGIN
    -- Define prefixes for each document type
    CASE doc_type
        WHEN 'FACT' THEN prefix := 'FACT';
        WHEN 'NDE' THEN prefix := 'NDE';
        WHEN 'REC' THEN prefix := 'REC';
        WHEN 'SAL' THEN prefix := 'SAL';
        WHEN 'NCRE' THEN prefix := 'NCRE';
        WHEN 'CAC' THEN prefix := 'CAC';
        ELSE prefix := 'DOC';
    END CASE;

    -- Get next number for this document type and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_documento FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.documentos_generados 
    WHERE tipo_documento = doc_type 
    AND EXTRACT(YEAR FROM fecha_emision) = current_year;
    
    -- Return formatted document number
    RETURN prefix || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$function$;

-- Crear bucket de storage para archivos CAC
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cac-archivos', 'cac-archivos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para archivos CAC
CREATE POLICY "Users can view their own CAC files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cac-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own CAC files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cac-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own CAC files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cac-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own CAC files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cac-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_cac_resultados_documento_id ON public.cac_resultados(documento_id);
CREATE INDEX idx_cac_archivos_documento_id ON public.cac_archivos(documento_id);
CREATE INDEX idx_documentos_generados_documento_origen ON public.documentos_generados(documento_origen_id);