"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Clean up the timer on component unmount
    };
  }, []);

  const formattedDate = format(currentDateTime, "EEEE, MMM d, yyyy");
  const formattedTime = format(currentDateTime, "h:mm:ss a");

  return (
    <div className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-300">
      <span className="font-medium">{formattedDate}</span>
      <span className="font-mono text-lg">{formattedTime}</span>
    </div>
  );
};