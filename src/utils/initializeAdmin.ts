
import { supabase } from '@/integrations/supabase/client';

export async function initializeAdminUser() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Check if user is admin@example.com
    if (user.email === 'admin@example.com') {
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      // If no admin role exists, create one
      if (!existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin'
          });

        if (error) {
          console.error('Error creating admin role:', error);
        } else {
          console.log('Admin role created for admin@example.com');
        }
      }
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}
