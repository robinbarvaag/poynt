"use client";

import { trpc } from "@/lib/planner/trpc";
import { toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Konverter base64url VAPID-nøkkel til Uint8Array (det subscribe() krever). */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

/**
 * Av/på-knapp for Web Push-varsler (i varsel-bjella). Skjuler seg selv hvis
 * nettleseren ikke støtter push eller VAPID-nøkkelen ikke er konfigurert.
 */
export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      !!VAPID_PUBLIC_KEY;
    setSupported(ok);
    if (!ok) return;

    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  if (!supported) return null;

  async function enable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/push-sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Varsler ble ikke tillatt i nettleseren.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
      });
      const json = sub.toJSON();
      await trpc.chat.savePushSubscription.mutate({
        endpoint: json.endpoint as string,
        p256dh: json.keys?.p256dh as string,
        auth: json.keys?.auth as string,
      });
      setSubscribed(true);
      toast.success("Push-varsler er på.");
    } catch {
      toast.error("Kunne ikke slå på push-varsler.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await trpc.chat.deletePushSubscription
          .mutate({ endpoint: sub.endpoint })
          .catch(() => undefined);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Push-varsler er av.");
    } catch {
      toast.error("Kunne ikke skru av push-varsler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={subscribed ? disable : enable}
      className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60"
    >
      {busy ? (
        <Icon name="loader" className="size-4 animate-spin" />
      ) : (
        <Icon name="bell" className="size-4" />
      )}
      {subscribed ? "Skru av push-varsler" : "Slå på push-varsler"}
    </button>
  );
}
