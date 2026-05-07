import { logSystemAlert } from "@/lib/switchboardHook";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface HandoffPayload {
  userId: string;
  clientLicenseTier: string;
  chatTranscript: ChatMessage[];
  issueDescription: string;
}

/**
 * NBS Escalation Protocol: The Email Bridge
 * Triggered when a user's technical issue is unresolved.
 */
export async function trigger_human_handoff(payload: HandoffPayload) {
  console.log("Triggering human handoff for user:", payload.userId);
  
  // 1. Log the 'Pending Handoff' to the Switchboard
  await logSystemAlert({
    alert_type: 'Pending Handoff',
    severity: 'critical',
    message: `Unresolved technical issue for user ${payload.userId} (${payload.clientLicenseTier} tier)`,
    metadata: {
      userId: payload.userId,
      clientLicenseTier: payload.clientLicenseTier,
      issueDescription: payload.issueDescription,
      transcriptLength: payload.chatTranscript.length,
    }
  });

  // 2. Simulate sending a structured email to the admin
  // In a real environment, this would call an edge function or email service (SendGrid, Resend, etc.)
  const emailBody = `
    URGENT: Human Handoff Required
    App: Catering & Events by Wendy (Masterpiece OS)
    User ID: ${payload.userId}
    License Tier: ${payload.clientLicenseTier}
    
    Issue Description:
    ${payload.issueDescription}
    
    Transcript:
    ${payload.chatTranscript.map(msg => `[${msg.timestamp}] ${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
  `;
  
  console.log("Simulated Email Sent to Admin:\n", emailBody);
  
  return { success: true, message: "Handoff triggered and logged to Switchboard." };
}
