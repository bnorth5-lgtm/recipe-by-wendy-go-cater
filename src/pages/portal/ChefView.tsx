import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventContext } from '@/context/EventContext';
import { ChefHat, Users, Flame, CheckCircle2, ArrowLeft, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export const ChefView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { eventState, updateEventState } = useEventContext();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // In a real app, we'd fetch the specific event by eventId if it's not the current one.
  // For this demo, we'll use the global eventState.

  const signatureDish = eventState.menuItems.find(item => item.name === "Blueberry Cranberry Bread")?.name || "Signature Dish";
  const guests = eventState.totalGuests || 0;
  
  // Check if it's currently Food Service time
  const currentGlobalTime = eventState.globalTime || 16;
  const activeFoodServiceEvent = eventState.timelineEvents?.find(e => 
    e.type === "food_service" && 
    currentGlobalTime >= e.time && 
    currentGlobalTime < e.time + 1 // Active for 1 hour
  );

  const isPlatingNow = !!activeFoodServiceEvent;
  
  // Calculate prep list
  const loavesNeeded = Math.ceil(guests / 8);
  const prepList = [
    { id: 'prep-1', task: `Bake ${loavesNeeded} loaves of ${signatureDish}` },
    { id: 'prep-2', task: `Prep ${guests} portions of side salad` },
    { id: 'prep-3', task: `Marinate ${guests} portions of protein` },
  ];

  const equipmentList = [
    { id: 'eq-1', name: 'Staging Kitchen (Ovens/Fryers)', qty: 1 },
    { id: 'eq-2', name: 'Cambro Hot Boxes', qty: Math.ceil(guests / 40) },
    { id: 'eq-3', name: 'Prep Tables (6ft)', qty: 2 },
  ];

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReadyForPickup = () => {
    const newNotification = {
      id: crypto.randomUUID(),
      message: `${signatureDish} is READY FOR PICKUP!`,
      timestamp: Date.now()
    };
    
    updateEventState({
      kitchenNotifications: [...(eventState.kitchenNotifications || []), newNotification]
    });
    
    toast.success("Notification sent to servers!");
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12 font-sans transition-all duration-1000 ${isPlatingNow ? 'border-8 border-[#fbbf24] shadow-[inset_0_0_50px_rgba(251,191,36,0.3)]' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                <ChefHat className="w-8 h-8 text-[#fbbf24]" />
                Chef's View
              </h1>
              <p className="text-slate-400 mt-1">Event: {eventState.eventName || "Current Event"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#fbbf24]">{guests}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider">Final Guest Count</div>
          </div>
        </div>

        {isPlatingNow && (
          <div className="bg-amber-500/20 border border-[#fbbf24] rounded-xl p-6 flex items-center justify-between animate-pulse shadow-[0_0_30px_rgba(251,191,36,0.3)]">
            <div className="flex items-center gap-4">
              <BellRing className="w-8 h-8 text-[#fbbf24]" />
              <div>
                <h2 className="text-2xl font-bold text-[#fbbf24] tracking-wider">NOW PLATING: {activeFoodServiceEvent.name}</h2>
                <p className="text-amber-200/80">Food Service time has started according to the Run of Show.</p>
              </div>
            </div>
            <Button 
              onClick={handleReadyForPickup}
              className="bg-[#fbbf24] hover:bg-amber-500 text-slate-950 font-bold text-lg px-8 py-6 h-auto"
            >
              Ready for Pickup
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Prep List */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Dynamic Prep List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {prepList.map(item => (
                  <div 
                    key={item.id} 
                    className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checkedItems[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                      {checkedItems[item.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-lg transition-all ${checkedItems[item.id] ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment List */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Kitchen Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {equipmentList.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-full">Qty: {item.qty}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
