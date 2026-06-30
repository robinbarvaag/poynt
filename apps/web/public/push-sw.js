/**
 * Service worker for On Poynt Web Push.
 * Viser push-varsler og åpner/fokuserer riktig samtale ved klikk.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = {};
  }

  const title = data.title || "On Poynt";
  const options = {
    body: data.body || "",
    tag: data.url || "on-poynt",
    data: { url: data.url || "/on-poynt/fellesskap" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) ||
    "/on-poynt/fellesskap";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/on-poynt") && "focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return undefined;
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
