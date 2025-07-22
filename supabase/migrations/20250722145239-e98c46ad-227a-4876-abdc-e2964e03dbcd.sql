-- Extender tabla productos_elaborados con nuevos campos
ALTER TABLE public.productos_elaborados 
ADD COLUMN IF NOT EXISTS tipo_producto TEXT CHECK (tipo_producto IN ('Estuche', 'Caja', 'Microcorrugado', 'Otro')),
ADD COLUMN IF NOT EXISTS industria TEXT CHECK (industria IN ('Farmacia', 'Alimentos', 'Cosmética', 'Otros')),
ADD COLUMN IF NOT EXISTS sustrato TEXT,
ADD COLUMN IF NOT EXISTS calibre TEXT,
ADD COLUMN IF NOT EXISTS colores TEXT,
ADD COLUMN IF NOT EXISTS barniz TEXT CHECK (barniz IN ('UV', 'AQ', 'Ninguno')),
ADD COLUMN IF NOT EXISTS plastificado TEXT CHECK (plastificado IN ('Mate', 'Brillante', 'Ninguno')),
ADD COLUMN IF NOT EXISTS troquelado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS empaquetado TEXT,
ADD COLUMN IF NOT EXISTS pegado TEXT,
ADD COLUMN IF NOT EXISTS numero_paquetes TEXT,
ADD COLUMN IF NOT EXISTS precio_unitario_usd NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS arte_final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS cotizacion_pdf_url TEXT;

-- Crear tabla para archivos adjuntos de productos elaborados
CREATE TABLE IF NOT EXISTS public.productos_elaborados_archivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producto_elaborado_id UUID REFERENCES public.productos_elaborados(id) ON DELETE CASCADE,
  tipo_archivo TEXT NOT NULL CHECK (tipo_archivo IN ('arte_final', 'cotizacion')),
  nombre_archivo TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security para productos_elaborados_archivos
ALTER TABLE public.productos_elaborados_archivos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies para productos_elaborados_archivos
CREATE POLICY "Users can view their own productos_elaborados_archivos" 
ON public.productos_elaborados_archivos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own productos_elaborados_archivos" 
ON public.productos_elaborados_archivos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos_elaborados_archivos" 
ON public.productos_elaborados_archivos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos_elaborados_archivos" 
ON public.productos_elaborados_archivos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear storage bucket para archivos de productos elaborados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos-elaborados-archivos', 'productos-elaborados-archivos', false)
ON CONFLICT (id) DO NOTHING;

-- Crear policies para el bucket de productos elaborados
CREATE POLICY "Users can view their own productos elaborados files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'productos-elaborados-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own productos elaborados files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'productos-elaborados-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own productos elaborados files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'productos-elaborados-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own productos elaborados files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'productos-elaborados-archivos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX idx_productos_elaborados_archivos_producto_id ON public.productos_elaborados_archivos(producto_elaborado_id);
CREATE INDEX idx_productos_elaborados_archivos_user_id ON public.productos_elaborados_archivos(user_id);
CREATE INDEX idx_productos_elaborados_tipo_producto ON public.productos_elaborados(tipo_producto);
CREATE INDEX idx_productos_elaborados_industria ON public.productos_elaborados(industria);