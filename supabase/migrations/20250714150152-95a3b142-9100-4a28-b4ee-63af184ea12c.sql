-- Crear tipos ENUM
CREATE TYPE public.estado_venta AS ENUM ('emitida', 'cobrada', 'anulada');
CREATE TYPE public.estado_cuenta AS ENUM ('pendiente', 'parcial', 'pagado');
CREATE TYPE public.tipo_pago AS ENUM ('cobranza', 'pago');
CREATE TYPE public.tipo_cuenta_bancaria AS ENUM ('ahorro', 'corriente');
CREATE TYPE public.moneda AS ENUM ('VES', 'USD');

-- Actualizar tabla clientes con nuevos campos
ALTER TABLE public.clientes 
  RENAME COLUMN empresa_nombre TO nombre_empresa;
  
ALTER TABLE public.clientes 
  RENAME COLUMN contacto_nombre TO persona_contacto;
  
ALTER TABLE public.clientes 
  RENAME COLUMN contacto_telefono TO telefono_contacto;

-- Actualizar tabla productos para que coincida con inventario
ALTER TABLE public.productos 
  RENAME TO inventario;
  
ALTER TABLE public.inventario 
  RENAME COLUMN nombre TO nombre_producto;
  
ALTER TABLE public.inventario 
  RENAME COLUMN stock_minimo_alerta TO stock_minimo;

-- Actualizar tabla ventas con nuevos campos
ALTER TABLE public.ventas 
  ADD COLUMN iva NUMERIC DEFAULT 0,
  ADD COLUMN estado estado_venta DEFAULT 'emitida',
  ADD COLUMN observaciones TEXT;

-- Renombrar impuestos a iva para ser más específico
UPDATE public.ventas SET iva = impuestos WHERE impuestos IS NOT NULL;
ALTER TABLE public.ventas DROP COLUMN impuestos;

-- Crear tabla cuentas_por_cobrar
CREATE TABLE public.cuentas_por_cobrar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  monto_total NUMERIC NOT NULL DEFAULT 0,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  estado estado_cuenta NOT NULL DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cuentas_por_cobrar
ALTER TABLE public.cuentas_por_cobrar ENABLE ROW LEVEL SECURITY;

-- Create policies for cuentas_por_cobrar
CREATE POLICY "Users can view their own cuentas_por_cobrar" 
ON public.cuentas_por_cobrar 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuentas_por_cobrar" 
ON public.cuentas_por_cobrar 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuentas_por_cobrar" 
ON public.cuentas_por_cobrar 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuentas_por_cobrar" 
ON public.cuentas_por_cobrar 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla cuentas_por_pagar
CREATE TABLE public.cuentas_por_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proveedor_nombre TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto_total NUMERIC NOT NULL DEFAULT 0,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  estado estado_cuenta NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cuentas_por_pagar
ALTER TABLE public.cuentas_por_pagar ENABLE ROW LEVEL SECURITY;

-- Create policies for cuentas_por_pagar
CREATE POLICY "Users can view their own cuentas_por_pagar" 
ON public.cuentas_por_pagar 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuentas_por_pagar" 
ON public.cuentas_por_pagar 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuentas_por_pagar" 
ON public.cuentas_por_pagar 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuentas_por_pagar" 
ON public.cuentas_por_pagar 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla cuentas_bancarias
CREATE TABLE public.cuentas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banco_nombre TEXT NOT NULL,
  tipo tipo_cuenta_bancaria NOT NULL DEFAULT 'corriente',
  numero_cuenta TEXT NOT NULL,
  saldo_actual NUMERIC NOT NULL DEFAULT 0,
  moneda moneda NOT NULL DEFAULT 'VES',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cuentas_bancarias
ALTER TABLE public.cuentas_bancarias ENABLE ROW LEVEL SECURITY;

-- Create policies for cuentas_bancarias
CREATE POLICY "Users can view their own cuentas_bancarias" 
ON public.cuentas_bancarias 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cuentas_bancarias" 
ON public.cuentas_bancarias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cuentas_bancarias" 
ON public.cuentas_bancarias 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cuentas_bancarias" 
ON public.cuentas_bancarias 
FOR DELETE 
USING (auth.uid() = user_id);

-- Crear tabla pagos
CREATE TABLE public.pagos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo tipo_pago NOT NULL,
  cuenta_por_cobrar_id UUID REFERENCES public.cuentas_por_cobrar(id) ON DELETE CASCADE,
  cuenta_por_pagar_id UUID REFERENCES public.cuentas_por_pagar(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID REFERENCES public.cuentas_bancarias(id) ON DELETE SET NULL,
  monto NUMERIC NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: debe tener una referencia a cuenta por cobrar O por pagar, no ambas
  CONSTRAINT check_single_account_reference CHECK (
    (cuenta_por_cobrar_id IS NOT NULL AND cuenta_por_pagar_id IS NULL) OR
    (cuenta_por_cobrar_id IS NULL AND cuenta_por_pagar_id IS NOT NULL)
  )
);

-- Enable RLS for pagos
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Create policies for pagos
CREATE POLICY "Users can view their own pagos" 
ON public.pagos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pagos" 
ON public.pagos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pagos" 
ON public.pagos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pagos" 
ON public.pagos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_cuentas_por_cobrar_updated_at
BEFORE UPDATE ON public.cuentas_por_cobrar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuentas_por_pagar_updated_at
BEFORE UPDATE ON public.cuentas_por_pagar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuentas_bancarias_updated_at
BEFORE UPDATE ON public.cuentas_bancarias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at
BEFORE UPDATE ON public.pagos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for inventario (renamed from productos)
CREATE TRIGGER update_inventario_updated_at
BEFORE UPDATE ON public.inventario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();