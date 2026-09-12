/**
 * Rendrer ett eller flere JSON-LD-objekter som `<script type="application/ld+json">`.
 * Strukturert data hjelper både tradisjonelle søkemotorer og generative
 * motorer (GEO/AI) med å forstå innholdet på siden.
 *
 * Server-komponent: kjøres kun på server, ingen klient-JS.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, i) => (
        <script
          // `<` escapes så CMS-tekst som «</script>» ikke kan bryte ut av taggen.
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD krever rå script-innhold
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
          // biome-ignore lint/suspicious/noArrayIndexKey: statisk, rekkefølge-stabil liste
          key={`ld-${i}`}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
