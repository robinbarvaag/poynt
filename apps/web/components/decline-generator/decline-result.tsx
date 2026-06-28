"use client";

import { trpc } from "@/lib/planner/trpc";
import { Button } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMemo, useState } from "react";

interface DeclineResultProps {
  result?: string;
  mode?: "result";
  toolResultId?: string;
}

interface Variant {
  id: string;
  label: string;
  content: string;
}

export function DeclineResult({ result, toolResultId }: DeclineResultProps) {
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

  const sendAsEmail = (text: string) => {
    if (!text) return;
    const subject = encodeURIComponent("Svar på din henvendelse");
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => sendAsEmail(activeVariant?.content || "")}
        >
          <Icon name="mail" className="size-4" />
          Send som e-post
        </Button>
      </div>
    </div>
  );
}
