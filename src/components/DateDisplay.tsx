"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const DateDisplay: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute for date

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedDate = format(currentDate, "EEEE, MMM d, yyyy");

  return (
    <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
      {formattedDate}
    </div>
  );
};