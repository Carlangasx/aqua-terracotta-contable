-- Crear tablas para ContApp

-- Tabla de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nombre TEXT NOT NULL,
  telefono_empresa TEXT,
  correo TEXT,
  rif TEXT UNIQUE NOT NULL,
  direccion_fiscal TEXT,
  contribuyente_especial BOOLEAN DEFAULT FALSE,
  industria TEXT,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de productos/inventario
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  sku TEXT,
  categoria TEXT,
  descripcion TEXT,
  cantidad_disponible NUMERIC DEFAULT 0,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  stock_minimo_alerta NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de ventas
CREATE TABLE public.ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  productos JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  impuestos NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Users can view their own clientes" 
ON public.clientes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clientes" 
ON public.clientes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clientes" 
ON public.clientes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para productos
CREATE POLICY "Users can view their own productos" 
ON public.productos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own productos" 
ON public.productos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own productos" 
ON public.productos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own productos" 
ON public.productos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para ventas
CREATE POLICY "Users can view their own ventas" 
ON public.ventas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ventas" 
ON public.ventas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ventas" 
ON public.ventas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ventas" 
ON public.ventas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_clientes_rif ON public.clientes(rif);
CREATE INDEX idx_productos_user_id ON public.productos(user_id);
CREATE INDEX idx_productos_sku ON public.productos(sku);
CREATE INDEX idx_ventas_user_id ON public.ventas(user_id);
CREATE INDEX idx_ventas_cliente_id ON public.ventas(cliente_id);
CREATE INDEX idx_ventas_fecha ON public.ventas(fecha);