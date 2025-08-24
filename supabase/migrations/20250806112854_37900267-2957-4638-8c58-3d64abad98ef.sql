-- Create a trigger to automatically expire signing links when accessed after being signed
CREATE OR REPLACE FUNCTION expire_signed_link_on_access()
RETURNS TRIGGER AS $$
BEGIN
  -- If this recipient is already signed and someone is accessing it again, expire it immediately
  IF NEW.access_count > OLD.access_count AND OLD.status = 'signed' THEN
    NEW.expired_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to signing_request_recipients table
DROP TRIGGER IF EXISTS expire_signed_link_trigger ON signing_request_recipients;
CREATE TRIGGER expire_signed_link_trigger
  BEFORE UPDATE ON signing_request_recipients
  FOR EACH ROW
  EXECUTE FUNCTION expire_signed_link_on_access();