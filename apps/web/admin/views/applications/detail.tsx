import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, Pill, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { db, eq } from "@poynt/planner-db";
import {
  plannerIndustry,
  plannerMembershipApplication,
} from "@poynt/planner-db/schema";
import type { AdminViewServerProps } from "payload";
import type React from "react";
import { ApplicationActions } from "../../components/applications/application-actions";

const companySizeLabels: Record<string, string> = {
  solo: "Enmannsbedrift",
  small: "2–10 ansatte",
  medium: "11–50 ansatte",
  large: "50+ ansatte",
};

const audienceTypeLabels: Record<string, string> = {
  b2b: "Bedrifter (B2B)",
  b2c: "Forbrukere (B2C)",
  both: "Begge deler",
};

const statusLabels: Record<string, string> = {
  pending: "Til behandling",
  approved: "Godkjent",
  rejected: "Avslått",
};

async function getApplication(id: string) {
  const [application] = await db
    .select()
    .from(plannerMembershipApplication)
    .where(eq(plannerMembershipApplication.id, id))
    .limit(1);

  if (!application) return null;

  let industryName: string | null = null;
  if (application.industryId) {
    const [industry] = await db
      .select({ name: plannerIndustry.name })
      .from(plannerIndustry)
      .where(eq(plannerIndustry.id, application.industryId))
      .limit(1);
    industryName = industry?.name ?? application.industryId;
  }

  return { application, industryName };
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--theme-elevation-400)",
  marginBottom: "0.25rem",
};

const valueStyle: React.CSSProperties = {
  fontSize: "var(--font-body-size)",
  color: "var(--theme-text)",
  whiteSpace: "pre-wrap",
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2
        style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}
      >
        {title}
      </h2>
      <div
        style={{
          padding: "1.25rem",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-s)",
          background: "var(--theme-elevation-50)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export const MembershipApplicationDetailView = async (
  props: AdminViewServerProps
) => {
  const params = props.params as Record<string, string | string[] | undefined>;
  const segments = params?.segments;
  const id =
    typeof segments === "string"
      ? segments
      : Array.isArray(segments)
        ? segments[1]
        : (params?.id as string | undefined);

  const visibleEntities = getVisibleEntities({
    req: props.initPageResult.req,
  });

  const template = (children: React.ReactNode) => (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      {children}
    </DefaultTemplate>
  );

  const result = id ? await getApplication(id) : null;

  if (!result) {
    return template(
      <div style={{ width: "100%" }}>
        <SetStepNav
          nav={[
            { label: "Søknader", url: "/admin/soknader" },
            { label: "Ikke funnet" },
          ]}
        />
        <Gutter>
          <p style={{ marginTop: "2rem" }}>Fant ikke søknaden</p>
        </Gutter>
      </div>
    );
  }

  const { application, industryName } = result;

  return template(
    <div style={{ width: "100%" }}>
      <SetStepNav
        nav={[
          { label: "Søknader", url: "/admin/soknader" },
          { label: application.fullName || application.email },
        ]}
      />
      <Gutter>
        <div style={{ marginTop: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            <h1 style={{ margin: 0 }}>
              {application.fullName || application.email}
            </h1>
            <Pill
              pillStyle={
                application.status === "approved"
                  ? "success"
                  : application.status === "rejected"
                    ? "light"
                    : "warning"
              }
            >
              {statusLabels[application.status] ?? application.status}
            </Pill>
          </div>

          <Section title="Søker">
            <Field label="Navn" value={application.fullName} />
            <Field label="E-post" value={application.email} />
          </Section>

          <Section title="Bedrift og faktura">
            <Field label="Bedriftsnavn" value={application.companyName} />
            <Field label="Organisasjonsnummer" value={application.orgNumber} />
            <Field
              label="E-post for faktura"
              value={application.invoiceEmail}
            />
            <Field
              label="Omsetter over 1 mill/år"
              value={application.revenueOver1m}
            />
            <Field label="EHF-faktura" value={application.ehfInvoice} />
            <Field label="Fakturaoppdeling" value={application.invoiceSplit} />
            <Field label="Fakturainfo" value={application.invoiceNotes} />
            <Field label="Om bedriften" value={application.aboutCompany} />
          </Section>

          {(industryName ||
            application.companySize ||
            application.audienceType ||
            application.targetAudience) && (
            <Section title="On Poynt-profil (forhåndsutfylles ved oppstart)">
              <Field label="Bransje" value={industryName} />
              <Field
                label="Bedriftsstørrelse"
                value={
                  application.companySize
                    ? (companySizeLabels[application.companySize] ??
                      application.companySize)
                    : null
                }
              />
              <Field
                label="Målgruppe"
                value={
                  application.audienceType
                    ? (audienceTypeLabels[application.audienceType] ??
                      application.audienceType)
                    : null
                }
              />
              <Field
                label="Beskrivelse av målgruppe"
                value={application.targetAudience}
              />
            </Section>
          )}

          <ApplicationActions
            applicationId={application.id}
            status={application.status}
            approvedTier={application.approvedTier}
          />
        </div>
      </Gutter>
    </div>
  );
};
