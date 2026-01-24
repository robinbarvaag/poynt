"use client";

import { Button, cn, Container, H2, Text } from "@poynt/ui";
import { useState } from "react";
import type { Form as PayloadForm } from "../../payload-types";

interface FormBlockProps {
  form: PayloadForm | string;
  title?: string | null;
  description?: string | null;
  variant?: "default" | "card" | "bordered" | null;
  alignment?: "left" | "center" | null;
  maxWidth?: "sm" | "md" | "lg" | "full" | null;
}

export function FormBlockComponent({
  form,
  title,
  description,
  variant = "default",
  alignment = "left",
  maxWidth = "md",
}: FormBlockProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If form is just an ID string, we can't render it
  if (typeof form === "string") {
    return (
      <Container size="sm" className="py-12">
        <Text variant="subtle">Skjema ikke funnet</Text>
      </Container>
    );
  }

  const formData = form as PayloadForm;
  const formTitle = title || formData.title;
  const confirmationMessage =
    typeof formData.confirmationMessage === "object"
      ? "Takk for din henvendelse!"
      : formData.confirmationMessage || "Takk for din henvendelse!";

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

    try {
      const response = await fetch("/api/form-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          form: formData.id,
          submissionData: Object.entries(values).map(([field, value]) => ({
            field,
            value,
          })),
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

  if (isSubmitted) {
    return (
      <Container size="sm" className="py-12">
        <div
          className={cn(
            maxWidthClasses[currentMaxWidth],
            currentAlignment === "center" && "mx-auto text-center",
            variantClasses[currentVariant]
          )}
        >
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <Text className="text-lg">{confirmationMessage}</Text>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container size="sm" className="py-12">
      <div
        className={cn(
          maxWidthClasses[currentMaxWidth],
          currentAlignment === "center" && "mx-auto",
          variantClasses[currentVariant]
        )}
      >
        {formTitle && <H2 className="mb-2">{formTitle}</H2>}
        {description && (
          <Text variant="subtle" className="mb-6">
            {description}
          </Text>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.fields
              ?.filter((field) => "name" in field && field.name)
              .map((field, index) => {
                // Type guard: only process fields with name property
                if (!("name" in field) || !field.name) return null;

                const fieldName = field.name;
                const fieldLabel =
                  "label" in field ? field.label || field.name : field.name;
                const isRequired = "required" in field ? field.required ?? false : false;
                const fieldWidth = "width" in field ? field.width ?? 100 : 100;

                return (
                <div
                  key={index}
                  className={cn(
                    fieldWidth === 50 ? "md:col-span-1" : "md:col-span-2"
                  )}
                >
                  <label className="block mb-1.5">
                    <Text as="span" className="font-medium text-sm">
                      {fieldLabel}
                      {isRequired && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Text>
                  </label>

                  {field.blockType === "text" && (
                    <input
                      type="text"
                      name={fieldName}
                      required={isRequired}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {field.blockType === "email" && (
                    <input
                      type="email"
                      name={fieldName}
                      required={isRequired}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {field.blockType === "number" && (
                    <input
                      type="number"
                      name={fieldName}
                      required={isRequired}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  {field.blockType === "textarea" && (
                    <textarea
                      name={fieldName}
                      required={isRequired}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  )}

                  {field.blockType === "select" && "options" in field && (
                    <select
                      name={fieldName}
                      required={isRequired}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Velg...</option>
                      {field.options?.map((option, optIndex) => (
                        <option key={optIndex} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.blockType === "checkbox" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={fieldName}
                        required={isRequired}
                        className="w-4 h-4 rounded border-input"
                      />
                      <Text as="span" variant="subtle">
                        {fieldLabel}
                      </Text>
                    </label>
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

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting
              ? "Sender..."
              : formData.submitButtonLabel || "Send inn"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
