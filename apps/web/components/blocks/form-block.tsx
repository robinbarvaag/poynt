"use client";

import {
  Button,
  Checkbox,
  Container,
  FormSuccess,
  Heading,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  cn,
} from "@poynt/ui";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Form as PayloadForm } from "../../payload-types";

interface FormBlockProps {
  form: PayloadForm | string;
  title?: string | null;
  description?: string | null;
  variant?: "default" | "card" | "bordered" | null;
  alignment?: "left" | "center" | null;
  maxWidth?: "sm" | "md" | "lg" | "full" | null;
  /** Dropp Container-wrapperen (brukes når skjemaet ligger i en dialog). */
  bare?: boolean;
  /** Dropp intern tittel/beskrivelse — omgivelsen eier headingen selv. */
  hideHeader?: boolean;
}

/** Sporings-/kontekstdata lest fra URL-en (?kilde=&emne=&fra=). */
interface SubmissionContext {
  kilde?: string;
  sti?: string;
  emne?: string;
}

/**
 * Prefyll for emne-selecten: eksakt (case-insensitiv) match mot verdi eller
 * label; et emne som ikke matcher noen av valgene (f.eks. en kort-tittel fra
 * en landingsside) faller tilbake til «Annet» — konteksten er uansett med i
 * innsendingen via kilde-feltet.
 */
function resolveSelectDefault(
  emne: string | undefined,
  options: { label: string; value: string }[]
): string | undefined {
  if (!emne) return undefined;
  const norm = emne.trim().toLowerCase();
  const hit = options.find(
    (o) => o.value.toLowerCase() === norm || o.label.toLowerCase() === norm
  );
  if (hit) return hit.value;
  return options.find((o) => o.value.toLowerCase() === "annet")?.value;
}

/**
 * Henter ren tekst ut av et Lexical-dokument (kvitteringsmeldinga lagres som
 * richText i skjema-builderen). Uten dette faller alle skjemaer tilbake på den
 * generiske «Takk for din henvendelse!» — også der redaktøren har skrevet en
 * egen tekst.
 */
function lexicalToPlainText(value: unknown): string | null {
  const root = (value as { root?: { children?: unknown[] } })?.root;
  if (!root?.children) return null;

  const collect = (nodes: unknown[]): string[] =>
    nodes.flatMap((node) => {
      const n = node as { text?: string; children?: unknown[] };
      if (typeof n.text === "string") return [n.text];
      return n.children ? collect(n.children) : [];
    });

  const text = collect(root.children).join(" ").replace(/\s+/g, " ").trim();
  return text || null;
}

/** Delt felt-styling så tekstfelt og select får identisk høyde. */
const fieldControlClasses =
  "h-12 w-full rounded-xl border border-input bg-background px-4 focus:outline-none focus:ring-2 focus:ring-ring";

export function FormBlockComponent({
  form,
  title,
  description,
  variant = "default",
  alignment = "left",
  maxWidth = "md",
  bare = false,
  hideHeader = false,
}: FormBlockProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Kilde/sti/emne hentes fra URL-ens query etter mount (samme query finnes
  // både i modal- og fullside-konteksten). Tom på første render → ingen
  // hydration-mismatch; fylles inn rett etter.
  const [ctx, setCtx] = useState<SubmissionContext>({});
  // Kvitterings-kortet rulles inn i visning når innsendingen lykkes – ellers
  // blir brukeren stående nederst på en lang skjema-side uten å se bekreftelsen.
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setCtx({
      kilde: sp.get("kilde") ?? undefined,
      sti: sp.get("fra") ?? undefined,
      emne: sp.get("emne") ?? undefined,
    });
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      successRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isSubmitted]);

  // If form is just an ID string, we can't render it
  if (typeof form === "string") {
    return (
      <Container size="sm">
        <Text variant="muted">Skjema ikke funnet</Text>
      </Container>
    );
  }

  const formData = form as PayloadForm;
  const formTitle = title || formData.title;
  const confirmationMessage =
    (typeof formData.confirmationMessage === "object"
      ? lexicalToPlainText(formData.confirmationMessage)
      : formData.confirmationMessage) || "Takk for din henvendelse!";

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-xl",
    lg: "max-w-3xl",
    full: "max-w-none",
  };

  const variantClasses = {
    default: "",
    card: "bg-card p-6 md:p-8 rounded-xl shadow-sm",
    bordered: "border border-border p-6 md:p-8 rounded-xl",
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formElement = e.currentTarget;
    const data = new FormData(formElement);
    const values: Record<string, string> = {};

    data.forEach((value, key) => {
      values[key] = value.toString();
    });

    const submissionData = Object.entries(values).map(([field, value]) => ({
      field,
      value,
    }));
    // Intern sporing: hvor henvendelsen kom fra. Lagres som ekstra felt på
    // innsendingen → synlig i admin og kan tas med i varsel-e-posten.
    if (ctx.kilde) submissionData.push({ field: "kilde", value: ctx.kilde });
    if (ctx.sti) submissionData.push({ field: "sti", value: ctx.sti });

    try {
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: formData.id,
          submissionData,
        }),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke sende skjema");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError("Noe gikk galt. Vennligst prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentMaxWidth = maxWidth || "md";
  const currentVariant = variant || "default";
  const currentAlignment = alignment || "left";

  // I dialog-modus (bare) droppes Container-wrapperen — dialogen styrer bredden.
  const wrap = (node: ReactNode) =>
    bare ? (
      <div className="w-full">{node}</div>
    ) : (
      <Container size="sm">{node}</Container>
    );

  if (isSubmitted) {
    return wrap(
      <div
        ref={successRef}
        className={cn(
          "scroll-mt-24",
          maxWidthClasses[currentMaxWidth],
          "mx-auto",
          variantClasses[currentVariant]
        )}
      >
        <FormSuccess message={confirmationMessage} />
      </div>
    );
  }

  return wrap(
    <div
      className={cn(
        maxWidthClasses[currentMaxWidth],
        currentAlignment === "center" && "mx-auto",
        variantClasses[currentVariant]
      )}
    >
      {!hideHeader && (formTitle || description) && (
        <div className="mb-7 space-y-2">
          {formTitle && <Heading variant="h3">{formTitle}</Heading>}
          {description && <Text variant="muted">{description}</Text>}
        </div>
      )}

      <form
        key={ctx.emne ?? "default"}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          {formData.fields
            ?.filter((field) => "name" in field && field.name)
            .map((field) => {
              if (!("name" in field) || !field.name) return null;

              const fieldName = field.name;
              const fieldLabel =
                "label" in field ? field.label || field.name : field.name;
              const isRequired =
                "required" in field ? (field.required ?? false) : false;
              const fieldWidth = "width" in field ? (field.width ?? 100) : 100;

              return (
                <div
                  key={`${fieldName}-${field.id}`}
                  className={cn(
                    fieldWidth === 50 ? "md:col-span-1" : "md:col-span-2"
                  )}
                >
                  {/* Checkbox har egen inline-label under – unngå dobbel tekst. */}
                  {field.blockType !== "checkbox" && (
                    <Label className="mb-2 flex items-start font-heading font-semibold text-foreground leading-snug md:min-h-[2lh]">
                      <span>
                        {fieldLabel}
                        {isRequired && (
                          <span className="text-destructive">&nbsp;*</span>
                        )}
                      </span>
                    </Label>
                  )}

                  {field.blockType === "text" && (
                    <input
                      type="text"
                      name={fieldName}
                      required={isRequired}
                      className={fieldControlClasses}
                    />
                  )}

                  {field.blockType === "email" && (
                    <input
                      type="email"
                      name={fieldName}
                      required={isRequired}
                      className={fieldControlClasses}
                    />
                  )}

                  {field.blockType === "number" && (
                    <input
                      type="number"
                      name={fieldName}
                      required={isRequired}
                      className={fieldControlClasses}
                    />
                  )}

                  {field.blockType === "textarea" && (
                    <textarea
                      name={fieldName}
                      required={isRequired}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  )}

                  {field.blockType === "select" && "options" in field && (
                    <Select
                      name={fieldName}
                      required={isRequired}
                      defaultValue={
                        fieldName === "emne"
                          ? resolveSelectDefault(ctx.emne, field.options ?? [])
                          : undefined
                      }
                    >
                      <SelectTrigger className="h-12! w-full rounded-xl border-input bg-background px-4 text-base shadow-none">
                        <SelectValue placeholder="Velg..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.blockType === "checkbox" && (
                    // Design-systemets Checkbox (Radix + fjær-pop), ikke
                    // nettleserens standardboks. Radix rendrer selv en skjult
                    // input med `name`, så vanlig FormData-innsending virker.
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`${fieldName}-${field.id}`}
                        name={fieldName}
                        required={isRequired}
                        size="sm"
                        // Samtykke skal ALDRI være forhåndsavhaket (GDPR):
                        // `defaultValue` fra skjema-builderen styrer bare
                        // ikke-samtykke-bokser.
                        defaultChecked={
                          "defaultValue" in field
                            ? Boolean(field.defaultValue)
                            : false
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`${fieldName}-${field.id}`}
                        // `block` overstyrer Label sin flex — ellers blir
                        // stjerna for påkrevd et eget flex-barn og havner
                        // alene ute til høyre i stedet for etter siste ord.
                        className="block cursor-pointer font-normal text-muted-foreground text-sm leading-snug"
                      >
                        {fieldLabel}
                        {isRequired && (
                          <span className="text-destructive">&nbsp;*</span>
                        )}
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto"
        >
          {isSubmitting
            ? "Sender..."
            : formData.submitButtonLabel || "Send inn"}
        </Button>
      </form>
    </div>
  );
}
