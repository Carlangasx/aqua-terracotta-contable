
-- Crear tabla para productos elaborados (bajo pedido)
CREATE TABLE public.productos_elaborados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre_producto TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  alto NUMERIC,
  ancho NUMERIC,
  profundidad NUMERIC,
  cantidad INTEGER DEFAULT 1,
  numero_colores INTEGER,
  tipo_material TEXT,
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  actualizado_por UUID NOT NULL,
  ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para historial de cambios de productos elaborados
CREATE TABLE public.productos_elaborados_historial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  producto_elaborado_id UUID REFERENCES public.productos_elaborados(id) ON DELETE CASCADE,
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  descripcion TEXT NOT NULL,
  usuario_modificador UUID NOT NULL,
  cotizacion_pdf_url TEXT,
  arte_final_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Renombrar tabla actual de inventario a inventario_consumibles
ALTER TABLE public.inventario RENAME TO inventario_consumibles;

-- Agregar campos faltantes a inventario_consumibles
ALTER TABLE public.inventario_consumibles 
ADD COLUMN IF NOT EXISTS proveedor TEXT,
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE DEFAULT CURRENT_DATE;

-- Enable Row Level Security para productos_elaborados
ALTER TABLE public.productos_elaborados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies para productos_elaborados
CREATE POLICY "Users can view their own productos_elaborados" 
ON public.productos_elaborados 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own productos_elaborados" 
ON public.productos_elaborados 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos_elaborados" 
ON public.productos_elaborados 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos_elaborados" 
ON public.productos_elaborados 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable Row Level Security para productos_elaborados_historial
ALTER TABLE public.productos_elaborados_historial ENABLE ROW LEVEL SECURITY;

-- Create RLS policies para productos_elaborados_historial
CREATE POLICY "Users can view their own productos_elaborados_historial" 
ON public.productos_elaborados_historial 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own productos_elaborados_historial" 
ON public.productos_elaborados_historial 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos_elaborados_historial" 
ON public.productos_elaborados_historial 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos_elaborados_historial" 
ON public.productos_elaborados_historial 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_productos_elaborados_updated_at
BEFORE UPDATE ON public.productos_elaborados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_productos_elaborados_user_id ON public.productos_elaborados(user_id);
CREATE INDEX idx_productos_elaborados_cliente_id ON public.productos_elaborados(cliente_id);
CREATE INDEX idx_productos_elaborados_historial_producto_id ON public.productos_elaborados_historial(producto_elaborado_id);
CREATE INDEX idx_productos_elaborados_historial_user_id ON public.productos_elaborados_historial(user_id);
