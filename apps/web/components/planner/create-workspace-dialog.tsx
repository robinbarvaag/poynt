"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type CreateWorkspaceInput,
  createWorkspaceSchema,
  subscriptionTierLabels,
} from "@poynt/planner-validators";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Icon,
  Input,
  Progress,
  toast,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { useRouter } from "next/navigation";
import * as React from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: "owner" | "admin" | "member" | "client";
}

interface SubscriptionStatus {
  tier: "free" | "pro" | "business";
  usage: {
    workspaces: {
      current: number;
      limit: number;
      canCreate: boolean;
    };
  };
}

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (workspace: Workspace) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    React.useState<SubscriptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(false);

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Load subscription status when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoadingStatus(true);
      trpc.workspace.getSubscriptionStatus
        .query()
        .then((status) => {
          setSubscriptionStatus(status as SubscriptionStatus);
        })
        .catch(console.error)
        .finally(() => setIsLoadingStatus(false));
    }
  }, [open]);

  const handleSubmit = async (data: CreateWorkspaceInput) => {
    setIsSubmitting(true);
    try {
      const result = await trpc.workspace.create.mutate(data);
      if (!result) {
        throw new Error("Kunne ikke opprette bedrift");
      }
      toast.success(`"${result.name}" ble opprettet`);
      onSuccess({
        ...result,
        role: "owner",
      } as Workspace);
      form.reset();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Kunne ikke opprette bedrift";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = subscriptionStatus?.usage.workspaces.canCreate ?? true;
  const usage = subscriptionStatus?.usage.workspaces;
  const tier = subscriptionStatus?.tier ?? "free";
  const isUnlimited = usage?.limit === -1;

  const handleViewPlans = () => {
    onOpenChange(false);
    router.push("/on-poynt/innstillinger/medlemskap");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Opprett ny bedrift</DialogTitle>
          <DialogDescription>
            En bedrift representerer en kunde eller et prosjekt du jobber med.
          </DialogDescription>
        </DialogHeader>

        {/* Usage indicator */}
        {subscriptionStatus && !isLoadingStatus && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bedrifter brukt</span>
              <span className="font-medium">
                {usage?.current} / {isUnlimited ? "∞" : usage?.limit}
              </span>
            </div>

            {!isUnlimited && usage && (
              <Progress
                value={(usage.current / usage.limit) * 100}
                className="h-2"
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {subscriptionTierLabels[tier]} plan
              </span>
              {!canCreate && (
                <button
                  type="button"
                  onClick={handleViewPlans}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Icon name="sparkles" className="size-3" />
                  Oppgrader
                </button>
              )}
            </div>
          </div>
        )}

        {/* Limit reached warning */}
        {!canCreate && !isLoadingStatus && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-4">
            <div className="flex gap-3">
              <Icon
                name="alert-triangle"
                className="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Du har nådd grensen
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Din {subscriptionTierLabels[tier]}-plan tillater maks{" "}
                  {usage?.limit} bedrift{usage?.limit === 1 ? "" : "er"}.
                  Oppgrader for å opprette flere.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-300 dark:border-amber-800"
                  onClick={handleViewPlans}
                >
                  <Icon name="sparkles" className="mr-2 size-4" />
                  Se planer
                </Button>
              </div>
            </div>
          </div>
        )}

        {canCreate && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navn</FormLabel>
                    <FormControl>
                      <Input placeholder="F.eks. Kunde AS" {...field} />
                    </FormControl>
                    <FormDescription>
                      Navnet på bedriften eller kunden.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Icon name="loader" className="mr-2 size-4 animate-spin" />
                  )}
                  Opprett
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {!canCreate && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
