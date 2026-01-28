"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StyledProgress } from "@/components/StyledProgress"; // Use StyledProgress

interface RecipeTimerProps {
  initialTimeInSeconds: number;
  recipeName: string;
  onAlarm: () => void;
}

const RecipeTimer: React.FC<RecipeTimerProps> = ({ initialTimeInSeconds, recipeName, onAlarm }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = initialTimeInSeconds;
  const progressValue = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  // Reset time if initialTimeInSeconds changes (e.g., switching between prep/cook)
  useEffect(() => {
    setTimeRemaining(initialTimeInSeconds);
    setIsRunning(false);
    setIsAlarming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    toast.dismiss(`alarm-${recipeName}`);
  }, [initialTimeInSeconds, recipeName]);


  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      handleAlarm();
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, recipeName]);

  const handleAlarm = () => {
    setIsAlarming(true);
    onAlarm();
    
    const alarmId = `alarm-${recipeName}`;
    
    toast.warning(`TIME'S UP! ${recipeName} is ready!`, {
      duration: 20000, // 20 seconds alarm duration
      id: alarmId,
      action: {
        label: "Dismiss",
        onClick: () => {
          setIsAlarming(false);
          toast.dismiss(alarmId);
        },
      },
    });

    // Automatically stop alarming after 20 seconds
    setTimeout(() => {
      setIsAlarming(false);
      toast.dismiss(alarmId);
    }, 20000);
  };

  const toggleRun = () => {
    if (timeRemaining > 0) {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(initialTimeInSeconds);
    setIsAlarming(false);
    toast.dismiss(`alarm-${recipeName}`);
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(h.toString().padStart(2, '0'));
    parts.push(m.toString().padStart(2, '0'));
    parts.push(s.toString().padStart(2, '0'));
    
    return parts.join(':');
  };

  return (
    <div className={cn(
      "p-3 border rounded-lg transition-all duration-500",
      isAlarming ? "bg-destructive/20 border-destructive ring-4 ring-destructive/50" : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-base truncate">{recipeName}</h4>
        {isAlarming && <Bell className="h-5 w-5 text-destructive animate-pulse" />}
      </div>
      
      <div className="text-3xl font-mono font-bold text-center mb-3">
        {formatTime(timeRemaining)}
      </div>

      <StyledProgress 
        value={progressValue} 
        className="h-2 mb-3" 
        indicatorClassName={timeRemaining <= 60 && timeRemaining > 0 ? "bg-destructive" : "bg-primary"} 
      />

      <div className="flex justify-center space-x-2">
        <Button onClick={toggleRun} disabled={timeRemaining === 0 && !isAlarming} variant={isRunning ? "secondary" : "default"}>
          {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button onClick={resetTimer} variant="outline">
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
};

export default RecipeTimer;