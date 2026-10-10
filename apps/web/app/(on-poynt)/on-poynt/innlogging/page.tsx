"use client";

import {
  RecaptchaNotice,
  recaptchaHeader,
  useRecaptcha,
} from "@/components/recaptcha";
import { authClient } from "@poynt/on-poynt-auth/client";
import { UNKNOWN_MEMBER_MESSAGE } from "@poynt/on-poynt-auth/messages";
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
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

/**
 * Better Auth sender oss tilbake hit med ?error=… når Google-innloggingen
 * feiler. `signup_disabled` = Google-kontoen har ingen medlemskonto hos oss.
 */
function messageForAuthError(code: string | null): string {
  if (!code) return "";
  if (code === "signup_disabled" || code === "new_user_signup_disabled") {
    return UNKNOWN_MEMBER_MESSAGE;
  }
  return "Google-innlogging feilet. Prøv igjen.";
}

export default function OnPoyntLoginPage() {
  // useSearchParams krever en Suspense-grense med cacheComponents.
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(() =>
    messageForAuthError(searchParams.get("error"))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const getRecaptchaToken = useRecaptcha("innlogging");

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/on-poynt/oversikt",
        errorCallbackURL: "/on-poynt/innlogging",
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
      const token = await getRecaptchaToken();
      // Better Auth kaster ikke på feilsvar — den returnerer { data, error }.
      // Uten denne sjekken hadde et avvist forsøk vist «Sjekk e-posten din»
      // for en e-post som aldri ble sendt.
      const { error: authError } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/on-poynt/oversikt",
        fetchOptions: { headers: recaptchaHeader(token) },
      });

      if (authError) {
        setError(
          authError.message || "Kunne ikke sende innloggingslenke. Prøv igjen."
        );
        return;
      }

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
            Innlogging er for godkjente medlemmer. Bruk e-posten du søkte med —
            andre adresser slipper ikke inn.
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

            <RecaptchaNotice className="text-muted-foreground" />
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
