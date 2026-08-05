"use client";

import type { ReactNode } from "react";
import { BindersAssistant } from "./dashboard/binders-assistant";

/**
 * Global admin-provider som legger den flytende Bindersen-assistenten
 * oppå alle admin-sider. Registrert i payload.config.ts under
 * admin.components.providers.
 */
export const BindersProvider = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <BindersAssistant />
  </>
);
