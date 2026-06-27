"use client";

import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import { trpc } from "@/lib/planner/trpc";
import { AiBadge, Button } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMemo, useState } from "react";

const DECLINE_STEPS: ToolIntroStep[] = [
  {
    icon: "zap",
    title: "Kort & konsis",
    description: "Et raskt og profesjonelt avslag.",
  },
  {
    icon: "heart",
    title: "Varm & personlig",
    description: "Et empatisk avslag med en kort forklaring.",
  },
  {
    icon: "lightbulb",
    title: "Med alternativ",
    description: "Et nei som peker på andre løsninger.",
  },
];

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
    return (
      <ToolIntro
        icon="message-square-off"
        title="Si nei med stil"
        description="Profesjonelle avslag som bevarer relasjoner. Beskriv forespørselen, så får du tre høflige måter å takke nei på — tilpasset situasjonen."
        steps={DECLINE_STEPS}
        footnote="Under 1 minutt • Helt gratis"
      >
        <div>
          <Button onClick={onStartForm} className="gap-2">
            <Icon name="message-square-off" className="size-4" />
            Lag mitt avslag
          </Button>
        </div>
      </ToolIntro>
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
