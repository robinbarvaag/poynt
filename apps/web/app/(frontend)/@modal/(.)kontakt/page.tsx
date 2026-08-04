import { ContactModal } from "@/components/contact/contact-modal";
import { getContactForm } from "@/lib/contact";
import { getKontaktPage } from "@/lib/kontakt-page";
import { resolveMedia } from "@/lib/payload";
import { Suspense } from "react";

interface ModalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Bildet i modal-headeren: hero-bildet fra kontakt-siden (partneren styrer det
 * i admin), med meta-bildet som fallback. Selve siden hentes via den delte
 * (cachede) kontakt-henteren.
 */
async function getContactImage() {
  const page = await getKontaktPage();
  if (!page) return null;

  const heroBlock = page.layout?.find((block) => block.blockType === "hero");
  return resolveMedia(heroBlock?.image) ?? resolveMedia(page.meta?.image);
}

/**
 * Intercepting-route: fanger opp klient-navigasjon til /kontakt og viser
 * skjemaet i et modal oppå siden brukeren står på. Ved refresh/direktelenke
 * faller man gjennom til den dedikerte /kontakt-siden i stedet.
 */
export default function InterceptedContactPage({
  searchParams,
}: ModalPageProps) {
  // searchParams er runtime-data — les dem bak en Suspense-grense slik at
  // navigasjonen forblir instant (modalen streamer inn uten fallback-UI).
  return (
    <Suspense fallback={null}>
      <ContactModalLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function ContactModalLoader({
  searchParams,
}: {
  searchParams: ModalPageProps["searchParams"];
}) {
  const [form, image, sp] = await Promise.all([
    getContactForm(),
    getContactImage(),
    searchParams,
  ]);
  if (!form) return null;

  const subject = typeof sp.emne === "string" ? sp.emne : undefined;

  return (
    <ContactModal form={form} subject={subject} image={image ?? undefined} />
  );
}
