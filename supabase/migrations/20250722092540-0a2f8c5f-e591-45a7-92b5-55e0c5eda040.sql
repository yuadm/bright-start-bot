-- Create password verification function
CREATE OR REPLACE FUNCTION public.verify_password(password_input TEXT, password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (password_hash = crypt(password_input, password_hash));
END;
$$;