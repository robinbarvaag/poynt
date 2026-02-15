"use client";

import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { toast } from "@poynt/ui";
import { useState } from "react";

export function PortalButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPortal = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to open portal");
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Kunne ikke åpne kundeportal. Prøv igjen.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleOpenPortal}
      disabled={isLoading}
      variant="outline"
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Icon name="loader" className="mr-2 size-4 animate-spin" />
          Åpner...
        </>
      ) : (
        <>
          <Icon name="settings" className="mr-2 size-4" />
          Administrer abonnement
        </>
      )}
    </Button>
  );
}
