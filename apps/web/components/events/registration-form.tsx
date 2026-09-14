"use client";

import { PrivacyNotice } from "@/components/privacy-notice";
import {
  type RegistrationWindow,
  registrationWindow,
} from "@/lib/events/capacity";
import { formatEventDay, formatEventTime } from "@/lib/events/format";
import {
  Button,
  Checkbox,
  ConfettiBurst,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from "@poynt/ui";
import { CalendarCheck, Hourglass, Ticket, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

export interface RegistrationQuestion {
  name: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "select";
  options?: string[] | null;
  required?: boolean | null;
}

export interface RegistrationFormProps {
  eventId: number;
  startsAt: string;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  eventStatus?: string | null;
  /** Null = ingen plassgrense. */
  spotsLeft: number | null;
  waitlistEnabled: boolean;
  ticketsEnabled: boolean;
  newsletterOptIn: boolean;
  newsletterText: string;
  questions: RegistrationQuestion[];
  /** Hvor mange man kan ta med (0 = hver melder seg på selv). */
  maxGuests: number;
}

interface SuccessState {
  status: "registered" | "waitlisted";
  alreadyRegistered: boolean;
  code?: string | null;
  ticketUrl?: string;
  waitlistPosition?: number | null;
  guestCount?: number;
}

/**
 * Påmeldingsskjemaet på eventsiden. Sida er statisk, så «er påmeldingen
 * åpen?» regnes ut i nettleseren etter mount (serveren vet ikke hvilken dag
 * det er når siden besøkes). Serveren sjekker uansett alt på nytt.
 */
export function RegistrationForm(props: RegistrationFormProps) {
  const [window, setWindow] = useState<RegistrationWindow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [newsletter, setNewsletter] = useState(false);
  const [guests, setGuests] = useState<{ id: number; name: string }[]>([]);
  const nextGuestId = useRef(1);

  useEffect(() => {
    setWindow(registrationWindow(props));
  }, [props]);

  if (success)
    return <Success {...success} ticketsEnabled={props.ticketsEnabled} />;

  if (props.eventStatus && props.eventStatus !== "scheduled") {
    return (
      <Notice>
        {props.eventStatus === "cancelled"
          ? "Eventet er avlyst, så påmeldingen er stengt."
          : "Eventet er utsatt. Ny dato kommer, og påmeldingen åpner igjen da."}
      </Notice>
    );
  }

  if (window === "not_open" && props.registrationOpensAt) {
    return (
      <Notice>
        Påmeldingen åpner {formatEventDay(props.registrationOpensAt)} kl.{" "}
        {formatEventTime(props.registrationOpensAt)}.
      </Notice>
    );
  }
  if (window === "closed") {
    return <Notice>Påmeldingsfristen har gått ut.</Notice>;
  }
  if (window === "ended") {
    return (
      <Notice>Dette eventet har allerede vært. Takk til alle som kom!</Notice>
    );
  }

  const full = props.spotsLeft === 0;
  if (full && !props.waitlistEnabled) {
    return <Notice>Det er dessverre fullt.</Notice>;
  }
  const partySize = 1 + guests.length;
  // Er det ikke plass til hele følget, havner alle på ventelista (eller avvises).
  const tooFew = props.spotsLeft !== null && props.spotsLeft < partySize;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/eventer/${props.eventId}/pamelding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("navn"),
          email: data.get("epost"),
          website: data.get("website"),
          answers,
          newsletter,
          guests: guests.map((guest) => guest.name.trim()),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setSuccess(json);
    } catch {
      setError("Fikk ikke kontakt. Sjekk nettet og prøv igjen.");
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (name: string, value: string | boolean) =>
    setAnswers((prev) => ({ ...prev, [name]: value }));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="event-navn">Navn</Label>
        <Input id="event-navn" name="navn" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event-epost">E-post</Label>
        <Input
          id="event-epost"
          name="epost"
          type="email"
          required
          autoComplete="email"
        />
        <Text variant="muted" customStyles="text-xs">
          Billetten kommer hit, så sjekk at adressen stemmer.
        </Text>
      </div>

      {props.maxGuests > 0 && (
        <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
          <div>
            <p className="font-semibold text-foreground text-sm">
              Tar du med noen?
            </p>
            <Text variant="muted" customStyles="text-xs">
              Du kan ta med inntil {props.maxGuests}{" "}
              {props.maxGuests === 1 ? "person" : "personer"}. Alle får hver sin
              billett, og billettene kommer til deg.
            </Text>
          </div>
          {guests.map((guest, index) => (
            <div key={guest.id} className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={`event-folge-${guest.id}`}>
                  Navn, person {index + 2}
                </Label>
                <Input
                  id={`event-folge-${guest.id}`}
                  required
                  autoComplete="off"
                  value={guest.name}
                  onChange={(e) =>
                    setGuests((prev) =>
                      prev.map((g) =>
                        g.id === guest.id ? { ...g, name: e.target.value } : g
                      )
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Fjern ${guest.name || `person ${index + 2}`}`}
                onClick={() =>
                  setGuests((prev) => prev.filter((g) => g.id !== guest.id))
                }
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
          {guests.length < props.maxGuests && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setGuests((prev) => [
                  ...prev,
                  { id: nextGuestId.current++, name: "" },
                ])
              }
            >
              <UserPlus className="size-4" aria-hidden />
              Legg til en person
            </Button>
          )}
        </div>
      )}

      {props.questions.map((q) => {
        const id = `event-q-${q.name}`;
        if (q.type === "checkbox") {
          return (
            <div key={q.name} className="flex items-start gap-3">
              <Checkbox
                id={id}
                size="sm"
                className="mt-0.5"
                required={Boolean(q.required)}
                checked={answers[q.name] === true}
                onCheckedChange={(checked) =>
                  setAnswer(q.name, checked === true)
                }
              />
              <Label
                htmlFor={id}
                className="block cursor-pointer font-normal text-sm leading-snug"
              >
                {q.label}
                {q.required && (
                  <span className="text-destructive">&nbsp;*</span>
                )}
              </Label>
            </div>
          );
        }
        return (
          <div key={q.name} className="space-y-2">
            <Label htmlFor={id} className="block leading-snug">
              {q.label}
              {q.required ? (
                <span className="text-destructive">&nbsp;*</span>
              ) : (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  (valgfritt)
                </span>
              )}
            </Label>
            {q.type === "textarea" ? (
              <Textarea
                id={id}
                rows={3}
                required={Boolean(q.required)}
                value={String(answers[q.name] ?? "")}
                onChange={(e) => setAnswer(q.name, e.target.value)}
              />
            ) : q.type === "select" ? (
              <Select
                required={Boolean(q.required)}
                value={String(answers[q.name] ?? "")}
                onValueChange={(value) => setAnswer(q.name, value)}
              >
                <SelectTrigger id={id} className="w-full">
                  <SelectValue placeholder="Velg…" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={id}
                required={Boolean(q.required)}
                value={String(answers[q.name] ?? "")}
                onChange={(e) => setAnswer(q.name, e.target.value)}
              />
            )}
          </div>
        );
      })}

      {props.newsletterOptIn && (
        <div className="flex items-start gap-3 rounded-2xl bg-accent-3/30 p-4">
          <Checkbox
            id="event-nyhetsbrev"
            size="sm"
            className="mt-0.5"
            checked={newsletter}
            onCheckedChange={(checked) => setNewsletter(checked === true)}
          />
          <Label
            htmlFor="event-nyhetsbrev"
            className="block cursor-pointer font-normal text-sm leading-snug"
          >
            {props.newsletterText}
          </Label>
        </div>
      )}

      {/* Honningkrukke for roboter — skjult for mennesker og skjermlesere. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 overflow-hidden"
      >
        <label htmlFor="event-website">Nettside</label>
        <input
          id="event-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 p-3 text-destructive text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting
            ? "Melder på…"
            : tooFew && props.waitlistEnabled
              ? guests.length
                ? "Sett oss på ventelista"
                : "Sett meg på ventelista"
              : guests.length
                ? `Meld på ${partySize} personer`
                : "Meld meg på"}
        </Button>
        <PrivacyNotice
          purpose="Vi bruker opplysningene til påmeldingen og billetten. Svar på ekstra spørsmål slettes to uker etter eventet, navn og e-post senest seks måneder etter."
          className="text-muted-foreground"
        />
      </div>
    </form>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-5 text-center">
      <Text customStyles="text-sm">{children}</Text>
    </div>
  );
}

function Success({
  status,
  alreadyRegistered,
  code,
  ticketUrl,
  waitlistPosition,
  ticketsEnabled,
  guestCount = 0,
}: SuccessState & { ticketsEnabled: boolean }) {
  if (alreadyRegistered) {
    return (
      <div className="space-y-3 rounded-2xl bg-accent-3/30 p-6 text-center">
        <CalendarCheck className="mx-auto size-8 text-primary" aria-hidden />
        <p className="font-bold font-heading text-foreground text-xl">
          Du var allerede påmeldt
        </p>
        <Text variant="muted" customStyles="text-sm">
          Vi har sendt billetten på nytt til e-posten din. Finner du den ikke,
          sjekk søppelposten.
        </Text>
      </div>
    );
  }

  const waitlisted = status === "waitlisted";
  const Icon = waitlisted ? Hourglass : Ticket;

  return (
    <output className="relative block space-y-4 overflow-visible rounded-2xl bg-accent-3/30 p-6 text-center">
      {!waitlisted && <ConfettiBurst />}
      <span className="motion-safe:zoom-in-50 mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground motion-safe:animate-in motion-safe:duration-500">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="font-bold font-heading text-2xl text-foreground">
        {waitlisted ? "Du står på ventelista" : "Du er påmeldt!"}
      </p>
      <Text variant="muted" customStyles="text-sm">
        {waitlisted
          ? guestCount
            ? `Dere er nummer ${waitlistPosition ?? "?"} i køen. Blir det plass til hele følget, får du billettene på e-post automatisk.`
            : `Du er nummer ${waitlistPosition ?? "?"} i køen. Blir det plass, får du billett på e-post automatisk.`
          : guestCount
            ? `Billettene til deg og ${guestCount === 1 ? "den du tar med" : `de ${guestCount} du tar med`} er på vei til e-posten din.`
            : "Billetten er på vei til e-posten din."}
      </Text>
      {!waitlisted && ticketsEnabled && code && (
        <p className="font-bold font-mono text-2xl text-primary tracking-[0.14em]">
          {code}
        </p>
      )}
      {ticketUrl && (
        <Button asChild variant={waitlisted ? "outline" : "default"}>
          <Link href={ticketUrl}>
            {waitlisted ? "Se plassen din" : "Åpne billetten"}
          </Link>
        </Button>
      )}
    </output>
  );
}
