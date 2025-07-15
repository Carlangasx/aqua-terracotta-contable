-- Add PDF URL field to ventas table
ALTER TABLE public.ventas 
ADD COLUMN factura_pdf_url TEXT;

-- Add comment to document the new field
COMMENT ON COLUMN public.ventas.factura_pdf_url IS 'URL of the generated PDF invoice for this sale';