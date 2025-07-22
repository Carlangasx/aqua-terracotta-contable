-- Create historial_elaboraciones table
CREATE TABLE public.historial_elaboraciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producto_id UUID NOT NULL REFERENCES public.productos_elaborados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_documento_origen TEXT NOT NULL CHECK (tipo_documento_origen IN ('FACT', 'NDE', 'SAL')),
  numero_documento_origen TEXT,
  documento_generado_id INTEGER REFERENCES public.documentos_generados(id),
  precio_cliente_usd NUMERIC(10,2),
  arte_final_pdf_url TEXT,
  cac_id INTEGER REFERENCES public.documentos_generados(id),
  observaciones TEXT,
  creado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.historial_elaboraciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own historial_elaboraciones" 
ON public.historial_elaboraciones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own historial_elaboraciones" 
ON public.historial_elaboraciones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own historial_elaboraciones" 
ON public.historial_elaboraciones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own historial_elaboraciones" 
ON public.historial_elaboraciones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_historial_elaboraciones_updated_at
BEFORE UPDATE ON public.historial_elaboraciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_historial_elaboraciones_producto_id ON public.historial_elaboraciones(producto_id);
CREATE INDEX idx_historial_elaboraciones_fecha ON public.historial_elaboraciones(fecha DESC);
CREATE INDEX idx_historial_elaboraciones_user_id ON public.historial_elaboraciones(user_id);
CREATE INDEX idx_historial_elaboraciones_documento_generado_id ON public.historial_elaboraciones(documento_generado_id);
CREATE INDEX idx_historial_elaboraciones_cac_id ON public.historial_elaboraciones(cac_id);