/**
 * Shared Resend "from" address for all outbound clinic mail.
 *
 * Prefer RESEND_FROM on Vercel (Preview + Production), e.g.:
 *   RESEND_FROM=Clinica Katya Heras <citas@katyaheras.app>
 *
 * Until the katyaheras.app domain is verified in Resend, keep the sandbox
 * default — Resend only delivers onboarding@resend.dev mail to the account
 * owner (clinic contact), never to arbitrary patient addresses.
 */
export function resendFromAddress(): string {
  const configured = process.env.RESEND_FROM?.trim();
  if (configured) return configured;
  return "Clinica Katya Heras <onboarding@resend.dev>";
}
