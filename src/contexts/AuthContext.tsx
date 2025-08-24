import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState, forceSignOut } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  const fetchUserRole = async (userId: string): Promise<string> => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) {
        console.error('Error fetching user role:', error);
        return 'user';
      }
      
      return roles?.[0]?.role || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  };

  const handleAuthState = async (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      // Defer role fetching to prevent deadlocks
      setTimeout(async () => {
        try {
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
        } catch (error) {
          console.error('Error in handleAuthState:', error);
          setUserRole('user');
        }
      }, 0);
    } else {
      setUserRole(null);
    }
    
    setLoading(false);
    setInitialAuthCheckComplete(true);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          cleanupAuthState();
          if (isMounted) {
            setLoading(false);
            setInitialAuthCheckComplete(true);
          }
          return;
        }

        if (isMounted) {
          await handleAuthState(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        cleanupAuthState();
        if (isMounted) {
          setLoading(false);
          setInitialAuthCheckComplete(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_OUT') {
          cleanupAuthState();
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          setInitialAuthCheckComplete(true);
        } else {
          // Synchronous state updates only
          setSession(session);
          setUser(session?.user ?? null);
          
          // Defer async operations
          if (session?.user) {
            setTimeout(async () => {
              try {
                const role = await fetchUserRole(session.user.id);
                setUserRole(role);
              } catch (error) {
                console.error('Error fetching user role:', error);
                setUserRole('user');
              }
            }, 0);
          } else {
            setUserRole(null);
          }
          
          setLoading(false);
          setInitialAuthCheckComplete(true);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await forceSignOut(supabase);
      
      // Reset state
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force page reload anyway
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading: loading && !initialAuthCheckComplete,
    userRole,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}