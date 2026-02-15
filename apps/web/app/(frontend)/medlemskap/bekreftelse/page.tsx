import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";

export default function MembershipConfirmationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
            <Icon name="check" className="size-10 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Takk for at du ble medlem!
          </h1>
          <p className="text-lg text-slate-600">
            Ditt medlemskap er nå aktivt, og du har full tilgang til On Poynt.
          </p>
        </div>

        {/* Next Steps */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-left shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Neste steg
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Icon name="mail" className="mt-1 size-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">
                  Sjekk e-posten din
                </p>
                <p className="text-sm text-slate-600">
                  Du vil motta en velkomst-e-post med lenke til On Poynt.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="sparkles" className="mt-1 size-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">
                  Utforsk plattformen
                </p>
                <p className="text-sm text-slate-600">
                  Gå gjennom onboarding for å sette opp din bedrift og få en
                  rask omvisning av funksjoner.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Icon name="file-text" className="mt-1 size-5 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900">
                  Kom i gang med innhold
                </p>
                <p className="text-sm text-slate-600">
                  Du har nå tilgang til artikler, guider og AI-verktøy for
                  markedsføring.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/on-poynt/onboarding">
              <Icon name="arrow-right" className="mr-2 size-4" />
              Gå til On Poynt
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Gå tilbake til forsiden</Link>
          </Button>
        </div>

        {/* Support Info */}
        <p className="text-sm text-slate-500">
          Har du spørsmål? Kontakt oss på{" "}
          <a
            href="mailto:support@poynt.no"
            className="text-slate-900 underline"
          >
            support@poynt.no
          </a>
        </p>
      </div>
    </div>
  );
}
