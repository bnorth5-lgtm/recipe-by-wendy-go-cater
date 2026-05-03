import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Map as MapIcon, ListTodo, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutionProgress } from "@/components/ExecutionProgress";
import { cn } from "@/lib/utils";

// Simulated fetch for crew data
const fetchCrewData = async (eventId: string) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return {
    eventName: "Smith Wedding Reception",
    date: "2026-05-15",
    tasks: [
      { id: "t1", title: "Set up 60\" Round Tables (x12)", completed: false, type: "layout" },
      { id: "t2", title: "Drape Ivory Damask Linens", completed: false, type: "linen" },
      { id: "t3", title: "Place Gold Accent Napkins", completed: false, type: "linen" },
      { id: "t4", title: "Assemble Floral Arches", completed: false, type: "atmosphere" },
      { id: "t5", title: "Set up Buffet Station", completed: false, type: "layout" },
    ]
  };
};

export const CrewPortal = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (eventId) {
      fetchCrewData(eventId).then(res => {
        setData(res);
        setTasks(res.tasks);
        setLoading(false);
      });
    }
  }, [eventId]);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const progressPercentage = tasks.length > 0 
    ? (tasks.filter(t => t.completed).length / tasks.length) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-[#fbbf24]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <ExecutionProgress percentage={progressPercentage} />
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-serif text-lg text-[#fbbf24] font-bold">{data.eventName}</h1>
            <p className="text-xs text-slate-400">Crew Portal • {data.date}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-emerald-400">{Math.round(progressPercentage)}%</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Completion</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto mt-4">
        {/* Simplified Map View */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
              <MapIcon className="w-4 h-4 text-[#fbbf24]" />
              Load-In Map (Simplified)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
              {/* Mock Map Elements */}
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="w-16 h-16 rounded-full border-2 border-slate-600 bg-slate-800 absolute top-4 left-4 flex items-center justify-center text-[10px] text-slate-400">T1</div>
              <div className="w-16 h-16 rounded-full border-2 border-slate-600 bg-slate-800 absolute top-4 right-4 flex items-center justify-center text-[10px] text-slate-400">T2</div>
              <div className="w-24 h-8 rounded border-2 border-slate-600 bg-emerald-900/50 absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center text-[10px] text-emerald-400">Buffet</div>
            </div>
          </CardContent>
        </Card>

        {/* Task Checklist */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-200">
              <ListTodo className="w-4 h-4 text-[#fbbf24]" />
              Execution Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  task.completed 
                    ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-100" 
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                )}
              >
                <CheckCircle2 className={cn("w-5 h-5 shrink-0", task.completed ? "text-emerald-500" : "text-slate-600")} />
                <span className={cn("text-sm", task.completed && "line-through opacity-70")}>{task.title}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
