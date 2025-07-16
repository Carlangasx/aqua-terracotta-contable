-- Extend inventario table for printing shop workflow
ALTER TABLE public.inventario 
ADD COLUMN tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'especial')),
ADD COLUMN unidad_medida TEXT DEFAULT 'und';

-- Update existing records
UPDATE public.inventario SET tipo = 'normal' WHERE tipo IS NULL;
UPDATE public.inventario SET unidad_medida = 'und' WHERE unidad_medida IS NULL;

-- Create documentos_generados table
CREATE TABLE public.documentos_generados (
    id SERIAL PRIMARY KEY,
    tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('FACT', 'NDE', 'SAL')),
    numero_documento TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    fecha_emision DATE DEFAULT CURRENT_DATE,
    productos JSONB DEFAULT '[]'::jsonb,
    extras JSONB DEFAULT '[]'::jsonb,
    total NUMERIC DEFAULT 0,
    observaciones TEXT,
    url_pdf TEXT,
    estado TEXT DEFAULT 'emitido' CHECK (estado IN ('emitido', 'anulado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID NOT NULL
);

-- Enable RLS on documentos_generados
ALTER TABLE public.documentos_generados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documentos_generados
CREATE POLICY "Users can view their own documentos_generados" 
ON public.documentos_generados 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documentos_generados" 
ON public.documentos_generados 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documentos_generados" 
ON public.documentos_generados 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documentos_generados" 
ON public.documentos_generados 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_documentos_generados_updated_at
    BEFORE UPDATE ON public.documentos_generados
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for document numbering
CREATE SEQUENCE public.documento_numero_seq;

-- Function to generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type TEXT)
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Get next number for this document type and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_documento FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.documentos_generados 
    WHERE tipo_documento = doc_type 
    AND EXTRACT(YEAR FROM fecha_emision) = current_year;
    
    -- Return formatted document number
    RETURN doc_type || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;