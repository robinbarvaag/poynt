import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medlemskap - Poynt',
  description:
    'Bli medlem av On Poynt og få tilgang til markedsføringsverktøy, AI-assistanse og et community av markedsførere.',
};

export default function MedlemskapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
