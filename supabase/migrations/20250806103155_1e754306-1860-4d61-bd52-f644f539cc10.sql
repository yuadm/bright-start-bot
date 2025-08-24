-- Add expiration tracking to signing requests
ALTER TABLE signing_request_recipients 
ADD COLUMN expired_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN access_count INTEGER DEFAULT 0;

-- Create function to check and mark expired documents
CREATE OR REPLACE FUNCTION check_signing_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as expired if accessed after already being signed
  IF NEW.access_count > OLD.access_count AND OLD.status = 'signed' THEN
    NEW.expired_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expiration check
CREATE TRIGGER signing_expiration_check
  BEFORE UPDATE ON signing_request_recipients
  FOR EACH ROW
  EXECUTE FUNCTION check_signing_expiration();

-- Create index for better performance
CREATE INDEX idx_signing_recipients_status_expired ON signing_request_recipients(status, expired_at);