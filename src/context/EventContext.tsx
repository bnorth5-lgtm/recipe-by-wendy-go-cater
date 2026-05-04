import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/logic/supabaseClient';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  isInteractive?: boolean;
}

export interface TimelineEvent {
  id: string;
  name: string;
  time: number;
  type: "general" | "food_service" | "entertainment";
}

export interface KitchenNotification {
  id: string;
  message: string;
  timestamp: number;
}

export interface EventState {
  id?: string;
  eventId?: string;
  eventName: string;
  totalGuests: number;
  staffCount: number;
  hourlyRate: number;
  estimatedHours: number;
  mileage: number;
  menuItems: MenuItem[];
  inventoryCosts: number;
  globalTime?: number;
  timelineEvents?: TimelineEvent[];
  kitchenNotifications?: KitchenNotification[];
  estimatedTotalValue?: number;
  actualCosts?: number;
  lessonsLearned?: string;
  isLegacy?: boolean;
}

interface EventContextType {
  eventState: EventState;
  setEventState: React.Dispatch<React.SetStateAction<EventState>>;
  updateEventState: (updates: Partial<EventState>) => void;
}

const defaultState: EventState = {
  eventName: "Smith Wedding Reception",
  totalGuests: 0,
  staffCount: 0,
  hourlyRate: 25.00,
  estimatedHours: 6,
  mileage: 15, // Default 15 miles
  menuItems: [
    { id: "m1", name: "Live Carving Station", price: 45, quantity: 1, isInteractive: true },
    { id: "m2", name: "Plated Filet Mignon", price: 65, quantity: 1, isInteractive: false }
  ],
  inventoryCosts: 0,
  globalTime: 16,
  timelineEvents: [],
  kitchenNotifications: [],
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [eventState, setEventState] = useState<EventState>(defaultState);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const initSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch the latest event for this user (or create one)
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
          
        if (data && !error) {
          setEventId(data.id);
          setEventState({
            id: data.id,
            eventName: data.event_name,
            totalGuests: data.total_guests,
            staffCount: data.staff_count,
            hourlyRate: Number(data.hourly_rate),
            estimatedHours: Number(data.estimated_hours),
            mileage: Number(data.mileage),
            menuItems: data.menu_items || [],
            inventoryCosts: Number(data.inventory_costs),
          });
        }
      }
    };
    
    initSupabase();
  }, []);

  // Set up Real-time Sync
  useEffect(() => {
    if (!userId || !eventId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          // Only update if the change came from another client/device
          const newData = payload.new;
          setEventState(prev => ({
            ...prev,
            eventName: newData.event_name,
            totalGuests: newData.total_guests,
            staffCount: newData.staff_count,
            hourlyRate: Number(newData.hourly_rate),
            estimatedHours: Number(newData.estimated_hours),
            mileage: Number(newData.mileage),
            menuItems: newData.menu_items || [],
            inventoryCosts: Number(newData.inventory_costs),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, eventId]);

  const updateEventState = async (updates: Partial<EventState>) => {
    const newState = { ...eventState, ...updates };
    setEventState(newState);

    if (userId) {
      // If we don't have an eventId yet, we are creating the first one
      const payload = {
        user_id: userId,
        event_name: newState.eventName,
        total_guests: newState.totalGuests,
        staff_count: newState.staffCount,
        hourly_rate: newState.hourlyRate,
        estimated_hours: newState.estimatedHours,
        mileage: newState.mileage,
        menu_items: newState.menuItems,
        inventory_costs: newState.inventoryCosts,
        updated_at: new Date().toISOString()
      };

      if (eventId) {
        await supabase.from('events').update(payload).eq('id', eventId);
      } else {
        const { data } = await supabase.from('events').insert(payload).select().single();
        if (data) setEventId(data.id);
      }
    }
  };

  return (
    <EventContext.Provider value={{ eventState, setEventState, updateEventState }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};
