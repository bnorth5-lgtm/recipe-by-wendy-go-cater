"use client";

import React, { useEffect } from 'react';
import { useCateringStore } from '@/store/cateringStore';

export const BrandingInjector: React.FC = () => {
  const { primaryColor, secondaryColor, fontFamilyPrimary, fontFamilySecondary } = useCateringStore();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary-color', primaryColor);
    root.style.setProperty('--brand-secondary-color', secondaryColor);
    root.style.setProperty('--brand-font-primary', fontFamilyPrimary);
    root.style.setProperty('--brand-font-secondary', fontFamilySecondary);
  }, [primaryColor, secondaryColor, fontFamilyPrimary, fontFamilySecondary]);

  return null; // This component doesn't render anything visible
};