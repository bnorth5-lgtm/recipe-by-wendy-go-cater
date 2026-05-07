import { supabase } from "@/logic/supabaseClient";

export type AlertType = 'Active Session' | 'Pending Handoff' | 'Profit Alert' | string;
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SystemAlertPayload {
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
}

export async function logSystemAlert(payload: SystemAlertPayload) {
  try {
    const { error } = await supabase.from('system_alerts').insert({
      project_name: 'Catering & Events by Wendy',
      alert_type: payload.alert_type,
      severity: payload.severity,
      message: payload.message,
      metadata: payload.metadata || {},
    });
    
    if (error) {
      console.error("Failed to log system alert to Switchboard:", error);
    }
  } catch (err) {
    console.error("Error logging system alert:", err);
  }
}
