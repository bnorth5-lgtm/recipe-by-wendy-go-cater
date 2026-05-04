import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/logic/supabaseClient';

export interface BrandState {
  companyName: string;
  stateOfIncorporation: string;
  logoUrl: string | null;
  primaryColor: string;
  contactPhone: string;
  contactEmail: string;
}

interface BrandContextType {
  brand: BrandState;
  updateBrand: (updates: Partial<BrandState>) => void;
}

const defaultBrand: BrandState = {
  companyName: "Delicious Catering & Events by Wendy",
  stateOfIncorporation: "New Hampshire",
  logoUrl: null,
  primaryColor: "#fbbf24", // Gold
  contactPhone: "(555) 123-4567",
  contactEmail: "events@deliciouscatering.com",
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandState>(defaultBrand);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get current user
    const fetchUserAndBrand = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // For local dev without auth, we might not have a user. 
      // In a real app, we'd force login. Here we handle both.
      if (user) {
        setUserId(user.id);
        // Fetch brand from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (data && !error) {
          setBrand({
            companyName: data.company_name || defaultBrand.companyName,
            stateOfIncorporation: data.state_of_incorporation || defaultBrand.stateOfIncorporation,
            logoUrl: data.logo_url || defaultBrand.logoUrl,
            primaryColor: data.primary_color || defaultBrand.primaryColor,
            contactPhone: data.contact_phone || defaultBrand.contactPhone,
            contactEmail: data.contact_email || defaultBrand.contactEmail,
          });
        }
      } else {
        // Fallback to local storage if no user (local dev mode)
        const saved = localStorage.getItem('nbs_brand_settings');
        if (saved) setBrand(JSON.parse(saved));
      }
    };
    
    fetchUserAndBrand();
  }, []);

  const updateBrand = async (updates: Partial<BrandState>) => {
    const newBrand = { ...brand, ...updates };
    setBrand(newBrand);
    
    // Save to Supabase if user exists
    if (userId) {
      await supabase.from('profiles').upsert({
        user_id: userId,
        company_name: newBrand.companyName,
        state_of_incorporation: newBrand.stateOfIncorporation,
        logo_url: newBrand.logoUrl,
        primary_color: newBrand.primaryColor,
        contact_phone: newBrand.contactPhone,
        contact_email: newBrand.contactEmail,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } else {
      // Fallback
      localStorage.setItem('nbs_brand_settings', JSON.stringify(newBrand));
    }
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
