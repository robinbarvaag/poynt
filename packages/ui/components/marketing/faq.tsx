import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";
import { Container } from "../container";
import { Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  items: FaqItem[];
  /** Indeks som er åpent i utgangspunktet. Default ingen. */
  defaultOpen?: number;
}

/**
 * FAQ-blokk bygget på Accordion-en, med den ikon-frie +/−-markøren. Innholds-
 * only; én åpen om gangen (collapsible).
 */
export function Faq({ eyebrow, title, intro, items, defaultOpen }: FaqProps) {
  return (
    <Container size="sm" padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mb-12 max-w-2xl">
            {eyebrow && (
              <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.2em]">
                {eyebrow}
              </span>
            )}
            {title && (
              <Heading variant="h2" color="foreground" customStyles="mt-3">
                {title}
              </Heading>
            )}
            {intro && (
              <Text variant="lead" customStyles="mt-4">
                {intro}
              </Text>
            )}
          </div>
        </Reveal>
      )}

      <Reveal>
        <Accordion
          type="single"
          collapsible
          defaultValue={
            defaultOpen === undefined ? undefined : `faq-${defaultOpen}`
          }
        >
          {items.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`faq-${index}`}
              className="border-border"
            >
              <AccordionTrigger
                indicator="plus"
                className="py-5 font-heading font-semibold text-foreground text-lg hover:no-underline"
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-base text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Container>
  );
}
