import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/logic/supabaseClient';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  isInteractive?: boolean;
  category?: string;
  market_scraped_cost?: number;
  margin_goal?: number;
  translations?: Record<string, string>;
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
  category?: string;
  totalGuests: number;
  staffCount: number;
  hourlyRate: number;
  estimatedHours: number;
  mileage: number;
  menuItems: MenuItem[];
  inventoryCosts: number;
  market_scraped_cost?: number;
  margin_goal?: number;
  translations?: Record<string, string>;
  s_e_e_oversight?: Record<string, any>;
  globalTime?: number;
  timelineEvents?: TimelineEvent[];
  kitchenNotifications?: KitchenNotification[];
  estimatedTotalValue?: number;
  actualCosts?: number;
  lessonsLearned?: string;
  isLegacy?: boolean;
  /** Shared across proposal view + Dashboard via localStorage */
  masterpieceContractSealed?: boolean;
  masterpieceContractSealedAt?: string;
}

interface EventContextType {
  eventState: EventState;
  setEventState: React.Dispatch<React.SetStateAction<EventState>>;
  updateEventState: (updates: Partial<EventState>) => void;
}

const defaultState: EventState = {
  eventName: "Harrison, Maine (Infrastructure-Zero Demo)",
  category: "Catering",
  totalGuests: 180,
  staffCount: 12,
  hourlyRate: 25.00,
  estimatedHours: 6,
  mileage: 50, // 50 miles to trigger $250 Remote Surcharge
  menuItems: [
    { id: "m1", name: "Live Carving Station", price: 45, quantity: 1, isInteractive: true },
    { id: "m2", name: "Plated Filet Mignon", price: 65, quantity: 1, isInteractive: false }
  ],
  inventoryCosts: 0,
  margin_goal: 70.00,
  globalTime: 16,
  timelineEvents: [],
  kitchenNotifications: [],
};

/** Persists DCE masterpiece seal across routes (ClientQuote + Dashboard use separate providers). */
export const EBW_MASTERPIECE_SEAL_LS_KEY = "ebw_masterpiece_seal_v1";

function readMasterpieceSealFromStorage(): Pick<EventState, "masterpieceContractSealed" | "masterpieceContractSealedAt"> {
  try {
    const raw = localStorage.getItem(EBW_MASTERPIECE_SEAL_LS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as { sealed?: boolean; at?: string };
    if (p?.sealed && typeof p.at === "string") {
      return { masterpieceContractSealed: true, masterpieceContractSealedAt: p.at };
    }
  } catch {
    /* ignore */
  }
  return {};
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [eventState, setEventState] = useState<EventState>(() => ({
    ...defaultState,
    ...readMasterpieceSealFromStorage(),
  }));
  const [userId, setUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Supabase fetch bypassed for demo
    /*
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
    */
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
            category: newData.category,
            totalGuests: newData.total_guests,
            staffCount: newData.staff_count,
            hourlyRate: Number(newData.hourly_rate),
            estimatedHours: Number(newData.estimated_hours),
            mileage: Number(newData.mileage),
            menuItems: newData.menu_items || [],
            inventoryCosts: Number(newData.inventory_costs),
            market_scraped_cost: newData.market_scraped_cost ? Number(newData.market_scraped_cost) : undefined,
            margin_goal: newData.margin_goal ? Number(newData.margin_goal) : 70.00,
            translations: newData.translations || {},
            s_e_e_oversight: newData.s_e_e_oversight || {},
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

    if (updates.masterpieceContractSealed === true && updates.masterpieceContractSealedAt) {
      try {
        localStorage.setItem(
          EBW_MASTERPIECE_SEAL_LS_KEY,
          JSON.stringify({ sealed: true, at: updates.masterpieceContractSealedAt })
        );
      } catch {
        /* ignore */
      }
    }

    if (userId) {
      // If we don't have an eventId yet, we are creating the first one
      const payload = {
        user_id: userId,
        event_name: newState.eventName,
        category: newState.category,
        total_guests: newState.totalGuests,
        staff_count: newState.staffCount,
        hourly_rate: newState.hourlyRate,
        estimated_hours: newState.estimatedHours,
        mileage: newState.mileage,
        menu_items: newState.menuItems,
        inventory_costs: newState.inventoryCosts,
        market_scraped_cost: newState.market_scraped_cost,
        margin_goal: newState.margin_goal,
        translations: newState.translations,
        s_e_e_oversight: newState.s_e_e_oversight,
        updated_at: new Date().toISOString()
      };

      // Supabase update bypassed for demo
      /*
      if (eventId) {
        await supabase.from('events').update(payload).eq('id', eventId);
      } else {
        const { data } = await supabase.from('events').insert(payload).select().single();
        if (data) setEventId(data.id);
      }
      */
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
