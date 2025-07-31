-- Create enum for movement types
CREATE TYPE public.tipo_movimiento_inventario AS ENUM ('ENTRADA', 'SALIDA');

-- Create movimientos_inventario table
CREATE TABLE public.movimientos_inventario (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES public.inventario_consumibles(id) ON DELETE RESTRICT,
    tipo_movimiento tipo_movimiento_inventario NOT NULL,
    cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
    costo_unitario NUMERIC,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo TEXT,
    referencia_documento TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own movimientos_inventario" 
ON public.movimientos_inventario 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movimientos_inventario" 
ON public.movimientos_inventario 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movimientos_inventario" 
ON public.movimientos_inventario 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movimientos_inventario" 
ON public.movimientos_inventario 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update inventory quantities
CREATE OR REPLACE FUNCTION public.actualizar_inventario_por_movimiento()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        IF NEW.tipo_movimiento = 'ENTRADA' THEN
            -- Increase inventory
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible + NEW.cantidad,
                updated_at = now()
            WHERE id = NEW.producto_id;
        ELSE
            -- Decrease inventory (SALIDA)
            -- First check if there's enough stock
            IF (SELECT cantidad_disponible FROM public.inventario_consumibles WHERE id = NEW.producto_id) < NEW.cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente. Cantidad disponible: %, cantidad solicitada: %', 
                    (SELECT cantidad_disponible FROM public.inventario_consumibles WHERE id = NEW.producto_id), 
                    NEW.cantidad;
            END IF;
            
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible - NEW.cantidad,
                updated_at = now()
            WHERE id = NEW.producto_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        -- Revert old movement
        IF OLD.tipo_movimiento = 'ENTRADA' THEN
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible - OLD.cantidad,
                updated_at = now()
            WHERE id = OLD.producto_id;
        ELSE
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible + OLD.cantidad,
                updated_at = now()
            WHERE id = OLD.producto_id;
        END IF;
        
        -- Apply new movement
        IF NEW.tipo_movimiento = 'ENTRADA' THEN
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible + NEW.cantidad,
                updated_at = now()
            WHERE id = NEW.producto_id;
        ELSE
            -- Check stock for SALIDA
            IF (SELECT cantidad_disponible FROM public.inventario_consumibles WHERE id = NEW.producto_id) < NEW.cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente. Cantidad disponible: %, cantidad solicitada: %', 
                    (SELECT cantidad_disponible FROM public.inventario_consumibles WHERE id = NEW.producto_id), 
                    NEW.cantidad;
            END IF;
            
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible - NEW.cantidad,
                updated_at = now()
            WHERE id = NEW.producto_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Revert the movement
        IF OLD.tipo_movimiento = 'ENTRADA' THEN
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible - OLD.cantidad,
                updated_at = now()
            WHERE id = OLD.producto_id;
        ELSE
            UPDATE public.inventario_consumibles 
            SET cantidad_disponible = cantidad_disponible + OLD.cantidad,
                updated_at = now()
            WHERE id = OLD.producto_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_actualizar_inventario_movimiento
    AFTER INSERT OR UPDATE OR DELETE ON public.movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_inventario_por_movimiento();

-- Create updated_at trigger
CREATE TRIGGER update_movimientos_inventario_updated_at
    BEFORE UPDATE ON public.movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();