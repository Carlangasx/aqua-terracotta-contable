-- Migrar datos de observaciones a campos específicos para cotizaciones existentes
UPDATE public.cotizaciones 
SET 
  corte = CASE 
    WHEN observaciones LIKE '%Corte:%' THEN
      TRIM(REGEXP_REPLACE(
        SPLIT_PART(
          SPLIT_PART(observaciones, 'Corte:', 2), 
          '|', 1
        ), 
        'Tamaños por corte:.*', '', 'g'
      ))
    ELSE NULL
  END,
  tamaños_por_corte = CASE 
    WHEN observaciones LIKE '%Tamaños por corte:%' THEN
      TRIM(REGEXP_REPLACE(
        SPLIT_PART(
          SPLIT_PART(observaciones, 'Tamaños por corte:', 2), 
          '|', 1
        ), 
        'Tamaños por pliego:.*', '', 'g'
      ))
    ELSE NULL
  END,
  tamaños_por_pliego = CASE 
    WHEN observaciones LIKE '%Tamaños por pliego:%' THEN
      TRIM(SPLIT_PART(
        SPLIT_PART(observaciones, 'Tamaños por pliego:', 2), 
        '|', 1
      ))
    ELSE NULL
  END
WHERE observaciones IS NOT NULL 
  AND (observaciones LIKE '%Corte:%' OR observaciones LIKE '%Tamaños por corte:%' OR observaciones LIKE '%Tamaños por pliego:%');