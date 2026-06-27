"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type InviteMemberInput,
  inviteMemberSchema,
  workspaceRoleDescriptions,
  workspaceRoleLabels,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import { Separator } from "@poynt/ui";
import { Skeleton } from "@poynt/ui/components/skeleton";
import { toast } from "@poynt/ui/components/sonner";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon } from "@poynt/ui/icons";
import * as React from "react";

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member" | "client";
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name: string;
  };
}

interface WorkspaceInviteFormProps {
  workspaceId: string;
}

export function WorkspaceInviteForm({ workspaceId }: WorkspaceInviteFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingInvitations, setPendingInvitations] = React.useState<
    Invitation[]
  >([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = React.useState(true);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      workspaceId,
      email: "",
      role: "member",
    },
  });

  React.useEffect(() => {
    async function loadInvitations() {
      try {
        const data = await trpc.workspace.getPendingInvitations.query({
          workspaceId,
        });
        setPendingInvitations(data as Invitation[]);
      } catch (error) {
        console.error("Failed to load invitations:", error);
      } finally {
        setIsLoadingInvitations(false);
      }
    }
    loadInvitations();
  }, [workspaceId]);

  const handleSubmit = async (data: InviteMemberInput) => {
    setIsSubmitting(true);
    try {
      const result = await trpc.workspace.inviteMember.mutate(data);
      toast.success(`Invitasjon sendt til ${data.email}`);
      setPendingInvitations((prev) => [
        {
          id: result.id,
          email: result.email,
          role: result.role as "admin" | "member" | "client",
          expiresAt: result.expiresAt,
          createdAt: new Date().toISOString(),
          invitedBy: { id: "", name: "Deg" },
        },
        ...prev,
      ]);
      form.reset({ workspaceId, email: "", role: "member" });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Kunne ikke sende invitasjon";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (
    invitationId: string,
    email: string
  ) => {
    try {
      await trpc.workspace.revokeInvitation.mutate({
        invitationId,
        workspaceId,
      });
      setPendingInvitations((prev) =>
        prev.filter((i) => i.id !== invitationId)
      );
      toast.success(`Invitasjon til ${email} ble trukket tilbake`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Kunne ikke trekke tilbake invitasjon";
      toast.error(errorMessage);
    }
  };

  const formatExpiresAt = (dateString: string) => {
    const now = new Date();
    const expiresAt = new Date(dateString);
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Utløpt";
    if (diffDays === 1) return "Utløper i morgen";
    return `Utløper om ${diffDays} dager`;
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-postadresse</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="navn@eksempel.no"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Personen vil motta en e-post med invitasjonslenke.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rolle</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ikke valgt" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">
                      {workspaceRoleLabels.admin}
                    </SelectItem>
                    <SelectItem value="member">
                      {workspaceRoleLabels.member}
                    </SelectItem>
                    <SelectItem value="client">
                      {workspaceRoleLabels.client}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {workspaceRoleDescriptions[field.value]}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Icon name="loader" className="mr-2 size-4 animate-spin" />
            ) : (
              <Icon name="send" className="mr-2 size-4" />
            )}
            Send invitasjon
          </Button>
        </form>
      </Form>

      {(pendingInvitations.length > 0 || isLoadingInvitations) && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-4">Ventende invitasjoner</h3>
            {isLoadingInvitations ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="size-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{workspaceRoleLabels[invitation.role]}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="clock" className="size-3" />
                          {formatExpiresAt(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRevokeInvitation(invitation.id, invitation.email)
                      }
                    >
                      <Icon name="trash" className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
