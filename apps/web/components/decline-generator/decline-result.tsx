"use client";

import { trpc } from "@/lib/planner/trpc";
import { AiBadge, Button, Heading, Text } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

interface DeclineResultProps {
  result?: string;
  onReset?: () => void;
  mode?: "intro" | "result";
  onStartForm?: () => void;
  toolResultId?: string;
}

interface Variant {
  id: string;
  label: string;
  content: string;
}

export function DeclineResult({
  result,
  onReset,
  mode = "result",
  onStartForm,
  toolResultId,
}: DeclineResultProps) {
  // Intro mode
  if (mode === "intro") {
    const features: { icon: IconName; title: string; description: string }[] = [
      {
        icon: "zap",
        title: "Kort & konsis",
        description: "Rask og profesjonell variant",
      },
      {
        icon: "heart",
        title: "Varm & personlig",
        description: "Empatisk med forklaring",
      },
      {
        icon: "lightbulb",
        title: "Med alternativ",
        description: "Forslag til andre løsninger",
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-3xl space-y-8"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="message-square-off" className="size-8" />
          </div>
          <Heading size="h1">Si nei med stil</Heading>
          <Text>
            Profesjonelle avslag som bevarer relasjoner. Få 3 varianter
            tilpasset din situasjon.
          </Text>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <p className="mb-6 font-semibold">Dette får du</p>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon name={feature.icon} className="size-5" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={onStartForm}
            className="h-12 px-8 text-base"
          >
            Lag mitt avslag
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Under 1 minutt • Helt gratis
          </p>
        </div>
      </motion.div>
    );
  }

  // Result mode
  if (!result) {
    return null;
  }

  const variants = useMemo(() => {
    const parsed = result
      .split("## ")
      .filter(Boolean)
      .map((v, index) => {
        const lines = v.trim().split("\n");
        const title = lines[0] || "";
        const content = lines.slice(1).join("\n").trim();

        // Map variant titles to tab labels
        let label = "Variant";
        let id = `variant-${index}`;

        if (title.toLowerCase().includes("kort")) {
          label = "Kort";
          id = "kort";
        } else if (
          title.toLowerCase().includes("varm") ||
          title.toLowerCase().includes("personlig")
        ) {
          label = "Varm";
          id = "varm";
        } else if (
          title.toLowerCase().includes("alternativ") ||
          title.toLowerCase().includes("åpen")
        ) {
          label = "Med alternativ";
          id = "alternativ";
        } else if (index === 0) {
          label = "Kort";
          id = "kort";
        } else if (index === 1) {
          label = "Varm";
          id = "varm";
        } else if (index === 2) {
          label = "Med alternativ";
          id = "alternativ";
        }

        return { id, label, content };
      });

    return parsed as Variant[];
  }, [result]);

  const [activeTab, setActiveTab] = useState(variants[0]?.id || "kort");

  const copyToClipboard = async (text: string, variantId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Kopiert til utklippstavlen");

      // Save which variant was copied (low-friction tracking)
      if (toolResultId) {
        trpc.declineFeedback.saveVariantCopy.mutate({
          toolResultId,
          variant: variantId as "kort" | "varm" | "alternativ",
        });
      }
    } catch {
      toast.error("Kunne ikke kopiere teksten");
    }
  };

  if (variants.length === 0) {
    return null;
  }

  const activeVariant = variants.find((v) => v.id === activeTab) || variants[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium">Ditt svar</h2>
        <AiBadge />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {variants.map((variant) => (
            <TabsTrigger key={variant.id} value={variant.id} className="flex-1">
              {variant.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {variants.map((variant) => (
          <TabsContent
            key={variant.id}
            value={variant.id}
            className="mt-4 animate-in fade-in-50 duration-200"
          >
            <div className="rounded-lg border bg-muted/30 p-5">
              <p className="whitespace-pre-wrap leading-relaxed">
                {variant.content}
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            copyToClipboard(
              activeVariant?.content || "",
              activeVariant?.id || ""
            )
          }
        >
          <Icon name="copy" className="size-4" />
          Kopier tekst
        </Button>
        {onReset && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onReset}
          >
            <Icon name="refresh" className="size-4" />
            Lag nytt
          </Button>
        )}
      </div>
    </div>
  );
}
