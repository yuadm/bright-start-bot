
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanySettings {
  id?: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

interface CompanyContextType {
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  loading: boolean;
  refetchCompanySettings: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
  name: "Daryel Care",
  tagline: "HR Management",
  address: "",
  phone: "",
  email: "",
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching company settings:', error);
        return;
      }

      if (data) {
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchCompanySettings = async () => {
    await fetchCompanySettings();
  };

  const updateCompanySettings = async (newSettings: Partial<CompanySettings>) => {
    try {
      const updatedSettings = { ...companySettings, ...newSettings };
      
      if (companySettings.id) {
        // Update existing record
        const { error } = await supabase
          .from('company_settings')
          .update({
            name: updatedSettings.name,
            tagline: updatedSettings.tagline,
            address: updatedSettings.address,
            phone: updatedSettings.phone,
            email: updatedSettings.email,
            logo: updatedSettings.logo
          })
          .eq('id', companySettings.id);

        if (error) {
          console.error('Error updating company settings:', error);
          toast({
            title: "Error",
            description: "Failed to update company settings",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Check if any record exists first
        const { data: existingData, error: fetchError } = await supabase
          .from('company_settings')
          .select('*')
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking existing company settings:', fetchError);
          toast({
            title: "Error",
            description: "Failed to check existing company settings",
            variant: "destructive",
          });
          return;
        }

        if (existingData) {
          // Update the existing record
          const { error } = await supabase
            .from('company_settings')
            .update({
              name: updatedSettings.name,
              tagline: updatedSettings.tagline,
              address: updatedSettings.address,
              phone: updatedSettings.phone,
              email: updatedSettings.email,
              logo: updatedSettings.logo
            })
            .eq('id', existingData.id);

          if (error) {
            console.error('Error updating existing company settings:', error);
            toast({
              title: "Error",
              description: "Failed to update company settings",
              variant: "destructive",
            });
            return;
          }

          updatedSettings.id = existingData.id;
        } else {
          // Create new record only if none exists
          const { data, error } = await supabase
            .from('company_settings')
            .insert([{
              name: updatedSettings.name,
              tagline: updatedSettings.tagline,
              address: updatedSettings.address,
              phone: updatedSettings.phone,
              email: updatedSettings.email,
              logo: updatedSettings.logo
            }])
            .select()
            .single();

          if (error) {
            console.error('Error creating company settings:', error);
            toast({
              title: "Error",
              description: "Failed to create company settings",
              variant: "destructive",
            });
            return;
          }

          updatedSettings.id = data.id;
        }
      }

      // Update local state immediately to reflect changes in sidebar
      setCompanySettings(updatedSettings);
      
      toast({
        title: "Success",
        description: "Company settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error", 
        description: "Failed to save company settings",
        variant: "destructive",
      });
    }
  };

  return (
    <CompanyContext.Provider value={{ companySettings, updateCompanySettings, loading, refetchCompanySettings }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
