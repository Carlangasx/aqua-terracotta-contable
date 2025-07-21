-- Crear tabla de configuración de empresa (una sola vez)
CREATE TABLE public.configuracion_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  razon_social TEXT NOT NULL,
  rif TEXT NOT NULL,
  direccion_fiscal TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  condiciones_pago_default TEXT DEFAULT 'Contado',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS para configuracion_empresa
ALTER TABLE public.configuracion_empresa ENABLE ROW LEVEL SECURITY;

-- Create RLS policies para configuracion_empresa
CREATE POLICY "Users can view their own empresa config" 
ON public.configuracion_empresa 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own empresa config" 
ON public.configuracion_empresa 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own empresa config" 
ON public.configuracion_empresa 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own empresa config" 
ON public.configuracion_empresa 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at en configuracion_empresa
CREATE TRIGGER update_configuracion_empresa_updated_at
BEFORE UPDATE ON public.configuracion_empresa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar campos faltantes a documentos_generados
ALTER TABLE public.documentos_generados 
ADD COLUMN IF NOT EXISTS numero_control_general INTEGER,
ADD COLUMN IF NOT EXISTS condiciones_pago TEXT DEFAULT 'Contado',
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS descuento NUMERIC DEFAULT 0;

-- Crear función para generar número de control general autoincremental
CREATE OR REPLACE FUNCTION public.generate_control_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    next_num INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Get next control number for current year
    SELECT COALESCE(MAX(numero_control_general), 0) + 1
    INTO next_num
    FROM public.documentos_generados 
    WHERE EXTRACT(YEAR FROM fecha_emision) = current_year;
    
    RETURN next_num;
END;
$function$;

-- Actualizar función de generación de número de documento
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
        WHEN 'factura' THEN prefix := 'FACT';
        WHEN 'nota_entrega' THEN prefix := 'NDE';
        WHEN 'recibo' THEN prefix := 'REC';
        WHEN 'salida_almacen' THEN prefix := 'SAL';
        WHEN 'nota_credito' THEN prefix := 'NC';
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

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_configuracion_empresa_user_id ON public.configuracion_empresa(user_id);
CREATE INDEX IF NOT EXISTS idx_documentos_generados_tipo ON public.documentos_generados(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_generados_year ON public.documentos_generados(EXTRACT(YEAR FROM fecha_emision));