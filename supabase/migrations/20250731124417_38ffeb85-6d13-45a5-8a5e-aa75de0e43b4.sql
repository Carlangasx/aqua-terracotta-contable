-- Fix function search path for security
ALTER FUNCTION public.actualizar_inventario_por_movimiento() 
SET search_path TO 'public';