/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* eslint-disable no-restricted-exports */
import config from "@payload-config";
import "@payloadcms/next/css";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import { connection } from "next/server";
import type { ServerFunctionClient } from "payload";
import type React from "react";
import { importMap } from "./admin/importMap";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const Layout = async ({ children }: Args) => {
  // Payloads RootLayout kaller new Date() under render, som Cache Components
  // ikke tillater i en prerender. connection() gjør segmentet request-bundet
  // slik at prerenderingen stopper før RootLayout — instant=false under
  // tillater at ruten blokkerer.
  await connection();
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
};

export default Layout;

// Payload-admin er dynamisk per bruker — opt-out fra Instant Navigations-kravet.
export const instant = false;
