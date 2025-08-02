-- Create cotizaciones table
CREATE TABLE public.cotizaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES public.clientes(id),
  sku text NOT NULL,
  nombre_producto text NOT NULL,
  troquel_id integer,
  medidas_caja_mm jsonb NOT NULL DEFAULT '{"ancho_mm": 0, "alto_mm": 0, "profundidad_mm": 0}'::jsonb,
  descripcion_montaje text,
  cantidad_cotizada integer NOT NULL DEFAULT 0,
  precio_unitario numeric NOT NULL DEFAULT 0,
  fecha_cotizacion date NOT NULL DEFAULT CURRENT_DATE,
  observaciones text,
  documento_pdf text,
  tipo_empaque text,
  industria text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cotizaciones" 
ON public.cotizaciones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cotizaciones" 
ON public.cotizaciones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cotizaciones" 
ON public.cotizaciones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cotizaciones" 
ON public.cotizaciones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cotizaciones_updated_at
BEFORE UPDATE ON public.cotizaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();