import { getContactsOverview } from "@/lib/contacts-overview";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import type { AdminViewServerProps } from "payload";
import { ContactsBoard } from "../../components/contacts/contacts-board";

/**
 * Kontakter (/admin/kontakter): light-CRM som samler alle personene som finnes
 * spredt i systemet — kunder (Bestillinger), henvendelser og venteliste
 * (Innsendinger), nyhetsbrevlista (Resend), On Poynt-medlemmer og
 * medlemssøknader — slått sammen per person på normalisert e-post.
 */
export const ContactsListView = async (props: AdminViewServerProps) => {
  const { rows, newsletterAvailable } = await getContactsOverview(
    props.payload
  );
  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "Kontakter" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>Kontakter</h1>
          </div>
          <p
            style={{
              marginBottom: "1.5rem",
              maxWidth: "70ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            Alle som har handlet, tatt kontakt, meldt seg på noe eller blitt
            medlem — samlet på ett sted. Én rad per person, uansett hvor mange
            steder de finnes.
            {!newsletterAvailable &&
              " (Nyhetsbrevlista kunne ikke hentes fra Resend akkurat nå.)"}
          </p>
          <ContactsBoard rows={rows} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};
