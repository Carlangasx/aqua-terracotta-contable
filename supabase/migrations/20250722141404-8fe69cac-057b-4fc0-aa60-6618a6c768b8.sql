-- Actualizar las funciones con search_path seguro

-- Actualizar generate_control_number con search_path seguro
CREATE OR REPLACE FUNCTION public.generate_control_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    next_num INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Get next control number for current year
    SELECT COALESCE(MAX(numero_control_general), 0) + 1
    INTO next_num
    FROM public.documentos_generados 
    WHERE EXTRACT(YEAR FROM fecha_emision) = current_year;
    
    RETURN next_num;
END;
$function$;

-- Actualizar generate_document_number con search_path seguro
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    next_num INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    prefix TEXT;
BEGIN
    -- Define prefixes for each document type
    CASE doc_type
        WHEN 'FACT' THEN prefix := 'FACT';
        WHEN 'NDE' THEN prefix := 'NDE';
        WHEN 'REC' THEN prefix := 'REC';
        WHEN 'SAL' THEN prefix := 'SAL';
        WHEN 'NCRE' THEN prefix := 'NCRE';
        WHEN 'CAC' THEN prefix := 'CAC';
        ELSE prefix := 'DOC';
    END CASE;

    -- Get next number for this document type and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_documento FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.documentos_generados 
    WHERE tipo_documento = doc_type 
    AND EXTRACT(YEAR FROM fecha_emision) = current_year;
    
    -- Return formatted document number
    RETURN prefix || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$function$;

-- Actualizar update_updated_at_column con search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;