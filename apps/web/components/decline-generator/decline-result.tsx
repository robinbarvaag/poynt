"use client";

import { trpc } from "@/lib/planner/trpc";
import { Button } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function DeclineResult({
  result,
  onReset,
  mode = "result",
  onStartForm,
  toolResultId,
}: DeclineResultProps) {
  // Intro mode
  if (mode === "intro") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-10 max-w-5xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary mb-2"
          >
            <Icon name="message-square-off" className="size-10" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">Si nei med stil</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Profesjonelle avslag som bevarer relasjoner. Få 3 varianter
            tilpasset din situasjon.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xl font-semibold mb-2">
                <Icon name="sparkles" className="size-5 text-primary" />
                Dette får du
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Icon name="zap" className="size-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Kort & konsis</h3>
                  <p className="text-sm text-muted-foreground">
                    Rask og profesjonell variant
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Icon name="heart" className="size-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Varm & personlig</h3>
                  <p className="text-sm text-muted-foreground">
                    Empatisk med forklaring
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Icon name="lightbulb" className="size-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Med alternativ</h3>
                  <p className="text-sm text-muted-foreground">
                    Forslag til andre løsninger
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center pt-4">
          <Button
            size="lg"
            onClick={onStartForm}
            className="gap-2 px-8 h-12 text-base"
          >
            <Icon name="sparkles" className="size-5" />
            Lag mitt avslag
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Under 1 minutt • Helt gratis
          </p>
        </motion.div>
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
      <h2 className="text-lg font-medium">Ditt svar</h2>

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
