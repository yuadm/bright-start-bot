
-- Complete removal of all RLS restrictions on compliance_types table
-- This allows full CRUD operations without any authentication requirements

-- First, ensure we're working with the right table
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_types') THEN
        -- Disable RLS completely
        ALTER TABLE public.compliance_types DISABLE ROW LEVEL SECURITY;
        
        -- Drop ALL existing policies (using a more comprehensive approach)
        DROP POLICY IF EXISTS "Allow all authenticated users to view compliance types" ON public.compliance_types;
        DROP POLICY IF EXISTS "Allow public read access to compliance types" ON public.compliance_types;
        DROP POLICY IF EXISTS "Admins can manage compliance types" ON public.compliance_types;
        DROP POLICY IF EXISTS "Allow authenticated users to view compliance types" ON public.compliance_types;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.compliance_types;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.compliance_types;
        DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.compliance_types;
        DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.compliance_types;
        
        -- Grant full permissions to anon role (for unauthenticated access)
        GRANT ALL ON public.compliance_types TO anon;
        GRANT ALL ON public.compliance_types TO authenticated;
        
        -- Ensure sequence permissions if needed
        IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name LIKE '%compliance_types%') THEN
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        END IF;
        
        RAISE NOTICE 'Successfully disabled RLS and granted permissions on compliance_types table';
    ELSE
        RAISE NOTICE 'compliance_types table does not exist';
    END IF;
END
$$;

-- Add explanatory comment
COMMENT ON TABLE public.compliance_types IS 'RLS completely disabled - full CRUD access allowed for development';

-- Verify the changes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' 
        AND c.relname = 'compliance_types' 
        AND c.relrowsecurity = false
    ) THEN
        RAISE NOTICE 'SUCCESS: RLS is disabled on compliance_types table';
    ELSE
        RAISE NOTICE 'WARNING: RLS may still be enabled on compliance_types table';
    END IF;
END
$$;
