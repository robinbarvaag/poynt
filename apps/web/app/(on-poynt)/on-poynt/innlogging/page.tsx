"use client";

import { authClient } from "@poynt/planner-auth/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@poynt/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlannerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/on-poynt/oversikt",
      });
    } catch {
      setError("Google-innlogging feilet. Prøv igjen.");
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: "/on-poynt/oversikt",
      });

      setMagicLinkSent(true);
    } catch {
      setError("Kunne ikke sende innloggingslenke. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sjekk e-posten din</CardTitle>
            <CardDescription>
              Vi har sendt en innloggingslenke til {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Klikk på lenken i e-posten for å logge inn. Du kan lukke dette
              vinduet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Innlogging er for godkjente medlemmer. Bruk e-posten du søkte med.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive text-destructive-foreground p-4">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            Logg inn med Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                eller
              </span>
            </div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="din@epost.no"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full disabled:cursor-not-allowed"
            >
              {isLoading ? "Sender..." : "Send innloggingslenke"}
            </Button>
          </form>

          <p className="border-t pt-4 text-center text-sm text-muted-foreground">
            Ikke medlem enda?{" "}
            <Link
              href="/bli-medlem"
              className="font-medium text-primary hover:underline"
            >
              Søk om medlemskap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
