"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type UpdateWorkspaceInput,
  updateWorkspaceSchema,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import { Input } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon } from "@poynt/ui/icons";
import * as React from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

interface WorkspaceGeneralFormProps {
  workspace: Workspace;
  disabled?: boolean;
}

export function WorkspaceGeneralForm({
  workspace,
  disabled = false,
}: WorkspaceGeneralFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? "",
      image: workspace.image,
    },
  });

  const handleSubmit = async (data: UpdateWorkspaceInput) => {
    setIsSubmitting(true);
    try {
      const result = await trpc.workspace.update.mutate(data);
      if (result) {
        toast.success("Innstillinger oppdatert");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Kunne ikke oppdatere innstillinger";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bedriftsnavn</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormDescription>
                Dette navnet vises i sidebar og i rapporter.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  disabled={disabled}
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                En kort beskrivelse av bedriften (valgfritt).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">URL-slug</p>
            <p className="text-sm text-muted-foreground">{workspace.slug}</p>
          </div>
        </div>

        {!disabled && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Icon name="loader" className="mr-2 size-4 animate-spin" />
              )}
              Lagre endringer
            </Button>
          </div>
        )}

        {disabled && (
          <p className="text-sm text-muted-foreground">
            Du har ikke tilgang til å redigere disse innstillingene.
          </p>
        )}
      </form>
    </Form>
  );
}
