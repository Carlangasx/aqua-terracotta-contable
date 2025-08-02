-- Create table for logging quote imports
CREATE TABLE public.log_cargas_cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nombre_archivo TEXT NOT NULL,
  total_filas INTEGER NOT NULL DEFAULT 0,
  filas_insertadas INTEGER NOT NULL DEFAULT 0,
  filas_actualizadas INTEGER NOT NULL DEFAULT 0,
  filas_con_error INTEGER NOT NULL DEFAULT 0,
  detalle_errores JSONB DEFAULT '[]'::jsonb,
  tamaño_archivo BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.log_cargas_cotizaciones ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own log_cargas_cotizaciones" 
ON public.log_cargas_cotizaciones 
FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create their own log_cargas_cotizaciones" 
ON public.log_cargas_cotizaciones 
FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own log_cargas_cotizaciones" 
ON public.log_cargas_cotizaciones 
FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own log_cargas_cotizaciones" 
ON public.log_cargas_cotizaciones 
FOR DELETE 
USING (auth.uid() = usuario_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_log_cargas_cotizaciones_updated_at
BEFORE UPDATE ON public.log_cargas_cotizaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();