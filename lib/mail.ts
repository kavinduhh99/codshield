import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({ 
    apiKey: process.env.BREVO_API_KEY as string 
});

const SENDER = { 
    name: 'CODShield System', 
    email: process.env.BREVO_SENDER_EMAIL as string 
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@codshield.com";

export async function sendAdminPaymentNotification(userName: string, businessName: string, userEmail: string) {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      subject: `[PAYMENT REQUEST] ${businessName} - Verification Required`,
      sender: SENDER,
      to: [{ email: ADMIN_EMAIL, name: 'CODShield Admin' }],
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; padding: 40px; border-radius: 16px; color: #f1f5f9; border: 1px solid #1e293b;">
          <h2 style="color: #6366f1; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">New Payment Verification Request</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #94a3b8;">
            A user has reported a manual bank transfer of **Rs. 400** and is waiting for account activation.
          </p>
          <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <p style="margin: 8px 0;"><strong>Business:</strong> ${businessName}</p>
            <p style="margin: 8px 0;"><strong>User Name:</strong> ${userName}</p>
            <p style="margin: 8px 0;"><strong>User Email:</strong> ${userEmail}</p>
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
            Please log in to the <a href="${process.env.NEXTAUTH_URL}/admin/subscriptions" style="color: #6366f1; text-decoration: none;">Admin Subscriptions Dashboard</a> to verify and approve this transaction.
          </p>
        </div>
      `
    });
    console.log(`[MAIL] Admin notified for ${businessName}`);
  } catch (error) {
    console.error("[MAIL] Failed to notify admin:", error);
  }
}
