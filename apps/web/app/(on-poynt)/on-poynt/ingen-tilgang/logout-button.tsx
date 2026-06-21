"use client";

import { authClient } from "@poynt/planner-auth/client";
import { Button } from "@poynt/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await authClient.signOut();
        router.push("/on-poynt");
      }}
    >
      {loading ? "Logger ut…" : "Logg ut"}
    </Button>
  );
}
