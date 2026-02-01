"use client";

import { signIn } from "@poynt/planner-auth/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Innlogging feilet");
      } else {
        router.push("/on-poynt/oversikt");
      }
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>Velkommen tilbake til On Poynt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <div className="rounded-md bg-destructive text-destructive-foreground p-4">
                {error}
              </div>
            )}

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

            <Label htmlFor="password">Passord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              placeholder="********"
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full disabled:cursor-not-allowed"
            >
              {isLoading ? "Logger inn..." : "Logg inn"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>Har du ikke konto?</div>
          <Button asChild variant="secondary" size="sm">
            <Link
              href="/on-poynt/registrering"
              className="font-medium hover:underline"
            >
              Registrer deg
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
