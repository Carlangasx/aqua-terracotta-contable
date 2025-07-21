
-- Update the constraint to include all 5 document types
ALTER TABLE public.documentos_generados 
DROP CONSTRAINT IF EXISTS documentos_generados_tipo_documento_check;

ALTER TABLE public.documentos_generados 
ADD CONSTRAINT documentos_generados_tipo_documento_check 
CHECK (tipo_documento IN ('FACT', 'NDE', 'SAL', 'REC', 'NCRE'));

-- Update the generate_document_number function to handle all document types
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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
