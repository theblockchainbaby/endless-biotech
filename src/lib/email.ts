import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "VitrOS <onboarding@resend.dev>";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping email:", subject);
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return null;
  }
}

// Pre-built alert templates

export async function sendContaminationAlert(params: {
  vesselBarcode: string;
  contaminationType: string;
  detectedBy: string;
  recipientEmails: string[];
}) {
  return sendEmail({
    to: params.recipientEmails,
    subject: `[VitrOS Alert] Contamination Detected — ${params.vesselBarcode}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">Contamination Alert</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280;">Vessel</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${params.vesselBarcode}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Type</td><td style="padding: 6px 0; text-transform: capitalize;">${params.contaminationType}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Detected by</td><td style="padding: 6px 0;">${params.detectedBy}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString()}</td></tr>
          </table>
          <p style="margin-top: 16px; font-size: 14px; color: #374151;">Isolate this vessel immediately and check nearby vessels for cross-contamination.</p>
        </div>
      </div>
    `,
  });
}

export async function sendBatchDisposeAlert(params: {
  vesselCount: number;
  disposedBy: string;
  reason: string;
  recipientEmails: string[];
}) {
  return sendEmail({
    to: params.recipientEmails,
    subject: `[VitrOS Alert] ${params.vesselCount} Vessels Disposed`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <div style="background: #f59e0b; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">Batch Disposal Alert</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280;">Vessels Disposed</td><td style="padding: 6px 0; font-weight: bold;">${params.vesselCount}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Reason</td><td style="padding: 6px 0;">${params.reason}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Disposed by</td><td style="padding: 6px 0;">${params.disposedBy}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Time</td><td style="padding: 6px 0;">${new Date().toLocaleString()}</td></tr>
          </table>
        </div>
      </div>
    `,
  });
}

export async function sendSubcultureReminderEmail(params: {
  overdueCount: number;
  dueTodayCount: number;
  recipientEmails: string[];
}) {
  return sendEmail({
    to: params.recipientEmails,
    subject: `[VitrOS] ${params.overdueCount} overdue, ${params.dueTodayCount} due today — Subculture Reminder`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <div style="background: #2563eb; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">Daily Subculture Reminder</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="text-align: center; flex: 1;">
              <div style="font-size: 28px; font-weight: bold; color: ${params.overdueCount > 0 ? '#dc2626' : '#22c55e'};">${params.overdueCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Overdue</div>
            </div>
            <div style="text-align: center; flex: 1;">
              <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${params.dueTodayCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Due Today</div>
            </div>
          </div>
          <p style="font-size: 14px; color: #374151;">Log in to VitrOS to view and process these vessels.</p>
        </div>
      </div>
    `,
  });
}

export async function sendContaminationSpikeAlert(params: {
  currentWeekCount: number;
  previousWeekCount: number;
  orgName: string;
  recipientEmails: string[];
}) {
  return sendEmail({
    to: params.recipientEmails,
    subject: `[VitrOS Alert] Contamination Spike Detected — ${params.orgName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">Contamination Spike Detected</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="text-align: center; flex: 1;">
              <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${params.currentWeekCount}</div>
              <div style="font-size: 12px; color: #6b7280;">This Week</div>
            </div>
            <div style="text-align: center; flex: 1;">
              <div style="font-size: 28px; font-weight: bold; color: #6b7280;">${params.previousWeekCount}</div>
              <div style="font-size: 12px; color: #6b7280;">Last Week</div>
            </div>
          </div>
          <p style="margin: 0; font-size: 14px; color: #374151;">
            Contamination cases have ${params.previousWeekCount === 0 ? "appeared" : `increased ${Math.round((params.currentWeekCount / params.previousWeekCount) * 100 - 100)}%`} compared to last week. Review affected vessels immediately and check for environmental or procedural causes.
          </p>
          <p style="margin-top: 12px; font-size: 13px; color: #6b7280;">Log in to VitrOS to view contamination analytics and affected vessels.</p>
        </div>
      </div>
    `,
  });
}

export async function sendLowInventoryAlert(params: {
  itemName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  recipientEmails: string[];
}) {
  return sendEmail({
    to: params.recipientEmails,
    subject: `[VitrOS Alert] Low Stock — ${params.itemName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px;">
        <div style="background: #f59e0b; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 16px;">Low Inventory Alert</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280;">Item</td><td style="padding: 6px 0; font-weight: bold;">${params.itemName}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Current Stock</td><td style="padding: 6px 0; color: #dc2626; font-weight: bold;">${params.currentStock} ${params.unit}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Reorder Level</td><td style="padding: 6px 0;">${params.reorderLevel} ${params.unit}</td></tr>
          </table>
          <p style="margin-top: 16px; font-size: 14px; color: #374151;">Restock this item as soon as possible to avoid disruptions.</p>
        </div>
      </div>
    `,
  });
}
