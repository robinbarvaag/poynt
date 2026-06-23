import { quickActions } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Velkommen til On Poynt!"
        description="Verktøyene og innholdet ditt – samlet på ett sted."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="group h-full transition-all hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={action.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
                <Icon
                  name="arrow-right"
                  className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name="lightbulb" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                Tips: Start med kanalveilederen
              </CardTitle>
              <CardDescription className="mt-1">
                Ikke sikker på hvor du skal begynne? Kanalveilederen analyserer
                bedriften din og anbefaler de beste markedsføringskanalene.
                Deretter kan du bruke markedsplan-generatoren for å lage en
                komplett strategi.
              </CardDescription>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link href="/on-poynt/verktoy/kanalveileder">
                  Prøv kanalveilederen
                  <Icon name="arrow-right" className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
