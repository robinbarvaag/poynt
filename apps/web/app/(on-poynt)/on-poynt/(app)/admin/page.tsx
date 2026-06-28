import { createServerCaller } from "@/lib/planner/trpc-server";
import { Card, CardContent, CardHeader, CardTitle, PageShell } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ADMIN_TOOLS: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
}[] = [
  {
    title: "Tilbakemeldinger",
    description:
      "Innspill og ønsker fra medlemmene — sett status og svar tilbake.",
    href: "/on-poynt/admin/tilbakemeldinger",
    icon: "message-square",
  },
  {
    title: "Modell-lab",
    description:
      "Tweak system-prompts og sammenlign AI-modeller på dummy-data.",
    href: "/on-poynt/lab",
    icon: "sparkles",
  },
];

export default async function AdminHubPage() {
  const trpc = await createServerCaller();
  const access = await trpc.admin
    .checkAccess()
    .catch(() => ({ isAdmin: false }));
  if (!access.isAdmin) redirect("/on-poynt/oversikt");

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Interne verktøy for On Poynt.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ADMIN_TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="gap-2">
                <Icon name={t.icon} className="size-5 text-primary" />
                <CardTitle className="text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{t.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
