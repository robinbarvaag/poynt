import { ContactModal } from "@/components/contact/contact-modal";
import { getContactForm } from "@/lib/contact";

interface ModalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Intercepting-route: fanger opp klient-navigasjon til /kontakt og viser
 * skjemaet i et modal oppå siden brukeren står på. Ved refresh/direktelenke
 * faller man gjennom til den dedikerte /kontakt-siden i stedet.
 */
export default async function InterceptedContactPage({
  searchParams,
}: ModalPageProps) {
  const [form, sp] = await Promise.all([getContactForm(), searchParams]);
  if (!form) return null;

  const subject = typeof sp.emne === "string" ? sp.emne : undefined;

  return <ContactModal form={form} subject={subject} />;
}
