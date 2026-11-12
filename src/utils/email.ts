import { supabase } from './supabase';

export type EmailNotificationType =
  | 'submission_received'
  | 'submission_approved'
  | 'submission_rejected'
  | 'payment_receipt'
  | 'new_comment'
  | 'sponsor_live'
  | 'milestone'
  | 'draft_reminder'
  | 'sponsor_expiring'
  | 'sponsor_ended'
  | 'weekly_digest';

export interface SendEmailNotificationParams {
  type: EmailNotificationType;
  to?: string | null;
  data?: Record<string, unknown>;
  idempotencyKey?: string;
}

/**
 * Fire-and-forget email notification via the `send-email` Supabase Edge Function.
 * Never throws or blocks the caller's UI flow.
 */
export async function sendEmailNotification({
  type,
  to,
  data = {},
  idempotencyKey,
}: SendEmailNotificationParams): Promise<void> {
  const recipient = typeof to === 'string' ? to.trim() : '';
  if (!recipient || !recipient.includes('@')) return;

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { type, to: recipient, data, idempotencyKey },
    });
    if (error) {
      console.warn(`Email notification (${type}) skipped:`, error.message);
    }
  } catch (err) {
    console.warn(`Email notification (${type}) error:`, err);
  }
}

