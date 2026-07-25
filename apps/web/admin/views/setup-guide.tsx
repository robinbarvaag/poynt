import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import type { AdminViewServerProps } from "payload";
import {
  type EnvStatus,
  SetupGuideTabs,
} from "../components/setup-guide/setup-guide-tabs";

// Kun tilstedeværelse (satt/ikke satt) sendes til klienten — aldri verdiene.
const checkedEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "VIPPS_MSN",
  "VIPPS_CLIENT_ID",
  "VIPPS_CLIENT_SECRET",
  "VIPPS_SUBSCRIPTION_KEY",
  "VIPPS_API_URL",
  "VIPPS_WEBHOOK_SECRET",
  "NEXT_PUBLIC_URL",
  "RESEND_API_KEY",
  "DATABASE_URI",
  "PAYLOAD_SECRET",
] as const;

export const SetupGuideView = (props: AdminViewServerProps) => {
  const env: EnvStatus = {};
  for (const name of checkedEnvVars) {
    env[name] = Boolean(process.env[name]);
  }

  const visibleEntities = getVisibleEntities({
    req: props.initPageResult.req,
  });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Betalingsoppsett" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
            <h1 style={{ margin: "0 0 0.35rem" }}>Betalingsoppsett</h1>
            <p
              style={{
                margin: 0,
                fontSize: "var(--font-body-size)",
                color: "var(--theme-elevation-500)",
              }}
            >
              Slik setter vi opp Stripe og Vipps med webhooks — og slik tester
              vi at alt virker. Statusprikkene viser om miljøvariablene er satt
              i miljøet denne serveren kjører i.
            </p>
          </div>
          <SetupGuideTabs env={env} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};
