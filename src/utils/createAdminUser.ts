import { supabase } from "@/integrations/supabase/client";

export async function createAdminUser() {
  try {
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {
        email: 'admin@example.com',
        password: '111111'
      }
    });

    if (error) throw error;

    console.log('Admin user created:', data);
    return data;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}