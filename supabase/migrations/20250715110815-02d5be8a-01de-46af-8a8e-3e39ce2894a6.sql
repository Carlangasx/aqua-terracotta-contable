-- Create conciliaciones table for bank reconciliation
CREATE TABLE public.conciliaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cuenta_bancaria_id UUID REFERENCES public.cuentas_bancarias(id) ON DELETE CASCADE,
  movimiento_id UUID REFERENCES public.pagos(id) ON DELETE SET NULL,
  referencia_bancaria TEXT,
  monto NUMERIC NOT NULL DEFAULT 0,
  fecha DATE NOT NULL,
  conciliado BOOLEAN NOT NULL DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conciliaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conciliaciones" 
ON public.conciliaciones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conciliaciones" 
ON public.conciliaciones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conciliaciones" 
ON public.conciliaciones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conciliaciones" 
ON public.conciliaciones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_conciliaciones_updated_at
BEFORE UPDATE ON public.conciliaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_conciliaciones_cuenta_bancaria ON public.conciliaciones(cuenta_bancaria_id);
CREATE INDEX idx_conciliaciones_fecha ON public.conciliaciones(fecha);
CREATE INDEX idx_conciliaciones_conciliado ON public.conciliaciones(conciliado);
CREATE INDEX idx_conciliaciones_user_id ON public.conciliaciones(user_id);