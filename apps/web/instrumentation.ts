/**
 * Kjøres én gang ved server-oppstart (Next instrumentation hook). Registrerer
 * oppslaget mot admin-redigerte e-postmaler («E-postmaler» i Payload) slik at
 * send-funksjonene i @poynt/email bruker partnerens tekster — også de som
 * kalles fra pakker uten Payload-tilgang (f.eks. magic link i planner-auth).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { setEmailTemplateProvider } = await import("@poynt/email");
  const { fetchEmailTemplateOverride } = await import("@/lib/email-templates");
  setEmailTemplateProvider(fetchEmailTemplateOverride);
}
