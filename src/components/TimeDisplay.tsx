"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const TimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formattedTime = format(currentTime, "h:mm:ss a");

  return (
    <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
      {formattedTime}
    </div>
  );
};