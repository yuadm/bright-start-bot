-- Fix the update_document_status function to handle both date and text values
CREATE OR REPLACE FUNCTION public.update_document_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only calculate status if expiry_date looks like a date (YYYY-MM-DD format)
  IF NEW.expiry_date ~ '^\d{4}-\d{2}-\d{2}$' THEN
    DECLARE 
      days_until_expiry INTEGER;
      expiry_date_value DATE;
    BEGIN
      -- Try to convert to date and calculate days until expiry
      expiry_date_value := NEW.expiry_date::DATE;
      days_until_expiry := expiry_date_value - CURRENT_DATE;
      
      -- Set status based on days until expiry
      IF days_until_expiry < 0 THEN
        NEW.status := 'expired';
      ELSIF days_until_expiry <= 30 THEN
        NEW.status := 'expiring';
      ELSE
        NEW.status := 'valid';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If date conversion fails, set to valid
        NEW.status := 'valid';
    END;
  ELSE
    -- For text values, set status to valid
    NEW.status := 'valid';
  END IF;
  
  RETURN NEW;
END;
$function$;