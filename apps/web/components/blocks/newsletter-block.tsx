import { Newsletter } from "@poynt/ui";
import { NewsletterForm } from "../newsletter-form";

interface NewsletterBlockProps {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  buttonText?: string | null;
  placeholder?: string | null;
  variant?: "primary" | "saffron" | "salmon" | null;
}

/** Mapper Payload-blokken `newsletter` til Newsletter i @poynt/ui, og kobler på
 * det ekte påmeldingsskjemaet via form-slotten. */
export function NewsletterBlock({
  eyebrow,
  title,
  description,
  buttonText,
  placeholder,
  variant,
}: NewsletterBlockProps) {
  return (
    <Newsletter
      eyebrow={eyebrow ?? undefined}
      title={title}
      description={description ?? undefined}
      buttonText={buttonText ?? undefined}
      placeholder={placeholder ?? undefined}
      variant={variant ?? undefined}
      form={<NewsletterForm buttonText={buttonText ?? undefined} />}
    />
  );
}
