import type {
  Myth,
  PortalDoor,
  ProfitExample,
  VekstLink,
  VekstPillar,
  WheelArea,
  Workflow,
} from "@poynt/ui";

/**
 * Innhold fra «Verdifull vekst» (Susanne Todnem) som vekst-blokkene starter
 * med. Brukes som standardverdier når en blokk legges til i admin, i
 * eksempelsiden (`scripts/seed-vekst-eksempler.ts`) og i Storybook.
 * Susanne kan skrive om alt i admin; dette er bare utgangspunktet.
 *
 * Ankrene (#lonnsomhet osv.) er blokk-navnene på eksempelsiden, slugifisert
 * (æ → ae, ø → o, å → a).
 */

export const PROFIT_EXAMPLE: ProfitExample = {
  label: "Prøv Gudruns komler",
  price: 140,
  cost: 160,
  costLabel: "Komler og kjøtt per tallerken",
  note: "«Prisen du betalte for en gigantisk komletallerken var bare 140 kroner! Komle- og kjøttkostnaden til Gudrun? Den var 160 kroner per tallerken!» Gudrun tapte rett og slett penger på å selge komler.",
};

export const HOURLY_MULTIPLIER = 1.5;

/** Hagesenteret i boka. */
export const FORECAST_MONTHLY_NEED = 127_000;

export const CHANGE_WHEEL_AREAS: WheelArea[] = [
  {
    name: "Salg og markedsføring",
    questions: [
      "Har du salg og markedsføring i kalenderen eller fast på agendaen?",
      "Vet du hvor de tre siste kundene eller salgene dine kom fra?",
      "Er du fornøyd med antall salg som kan kobles til markedsføring?",
    ],
    advice:
      "Sett av fast tid til salg hver uke, og finn ut hvor de siste kundene kom fra. Omsetnings-onsdag er et godt sted å starte.",
    link: { label: "Til Omsetnings-onsdag", href: "#omsetnings-onsdag" },
  },
  {
    name: "Systemer, drift og administrasjon",
    questions: [
      "Vet du hvor mange timer du eller bedriften bruker på administrasjon per uke?",
      "Kan du nevne noe du har satt bort eller automatisert det siste halvåret?",
      "Kunne noen tatt over det viktigste i jobben din i en måned hvis du ble syk?",
    ],
    advice:
      "Tell hvor mange timer som går til administrasjon i en vanlig uke. Velg én ting du kan sette bort eller automatisere den neste måneden.",
    link: { label: "Se arbeidsflytene med KI", href: "#arbeidsflyter-med-ki" },
  },
  {
    name: "Produkter, tjenester og prising",
    questions: [
      "Har noen betalt for det du selger de siste tre månedene?",
      "Vet du hva lønnsomheten er på hovedproduktet ditt?",
      "Har du justert opp prisene dine de siste to årene?",
    ],
    advice:
      "Regn ut lønnsomheten på hovedproduktet ditt. Har du ikke justert prisene på to år, er det sannsynligvis på tide.",
    link: { label: "Regn på lønnsomheten", href: "#lonnsomhet" },
    // Lønnsomhetsverktøyet er ikke tatt i bruk ennå: lenken ligger klar, men
    // holdes tilbake til Susanne skrur den på.
    linkPending: true,
  },
  {
    name: "Kunder og målgruppe",
    questions: [
      "Kan du navngi tre drømmekunder på stående fot?",
      "Vet du nok om målgruppen din til å beskrive dem i detalj?",
      "Har du nok kunder?",
    ],
    advice:
      "Skriv ned tre drømmekunder og alt du vet om dem. Og husk det første budet om kunder: ta vare på dem du allerede har.",
  },
];

export const CHANGE_WHEEL_AI_PROMPT = `Jeg har fylt ut endringshjulet fra boka «Verdifull vekst». Her er svarene mine:
{resultat}

Bedriften min: [hva dere driver med]
Visjonen min: [visjonen]
Målene mine: [målene]

Hjelp meg å lage en plan for det svakeste området: tre konkrete tiltak for de neste tre månedene, hvor mye tid hvert tiltak krever, og hvordan jeg ser at det virker.`;

export const VEKST_PILLARS: VekstPillar[] = [
  {
    letter: "V",
    name: "Visjon",
    questions: [
      "Kan du beskrive visjonen din i én setning?",
      "Har du skrevet ned 3–5 verdier som bedriften skal bygge på?",
      "Har målene dine et tall og en tidsfrist?",
    ],
    advice:
      "«Der du ikke vet hvor du skal, kan du heller ikke måle om du har lykkes.» Start med ett spørsmål: hvordan ser ting ut i bedriften når du har lykkes?",
  },
  {
    letter: "E",
    name: "Endring",
    questions: [
      "Har du sluttet med noe som ikke lønte seg det siste året?",
      "Vet du hvilket område i bedriften som trenger endring mest?",
      "Sjekker du at en løsning faktisk treffer problemet før du setter i gang?",
    ],
    advice:
      "Ta endringshjulet. Det viser hvilket område du bør ta tak i først.",
    link: { label: "Til endringshjulet", href: "#endringshjulet" },
  },
  {
    letter: "K",
    name: "Kunder",
    questions: [
      "Kan du navngi tre drømmekunder på stående fot?",
      "Har du spurt kundene dine om de er fornøyde det siste halvåret?",
      "Vet du hvor kundene dine henger?",
    ],
    advice:
      "Det første budet om kunder: ta vare på dem du allerede har. Ring tre av dem denne uka og spør hva de synes.",
  },
  {
    letter: "S",
    name: "Salg",
    questions: [
      "Har du fast tid til salg i kalenderen hver uke?",
      "Har du oversikt over hvem du er i dialog med, og hvem som skal følges opp?",
      "Vet du hvilke måneder du må selge ekstra for å gå i null?",
    ],
    advice:
      "Det som reddet bedriften min var salg. Sett av fast tid hver uke, så blir det en vane.",
    link: { label: "Til Omsetnings-onsdag", href: "#omsetnings-onsdag" },
  },
  {
    letter: "T",
    name: "Tall",
    questions: [
      "Vet du lønnsomheten på hovedproduktet ditt?",
      "Vet du hvor tiden din blir av i en vanlig uke?",
      "Vet du hvor de siste nye kundene dine kom fra?",
    ],
    advice:
      "Jevn innsats trumfer det meste, men bare hvis du måler den. Start med lønnsomheten på det du selger mest av.",
    link: { label: "Regn på lønnsomheten", href: "#lonnsomhet" },
  },
];

export const MYTHS: Myth[] = [
  {
    lie: "Det er kult å være travel",
    truth:
      "Tiden er den viktigste valutaen din. Å være travel betyr ikke at du skaper verdifull vekst.",
  },
  {
    lie: "Du må ta flere kurs",
    truth:
      "Du kan sannsynligvis nok til å komme i gang. Bruk tida på å gjennomføre det du allerede kan.",
  },
  {
    lie: "Du må bare tenke positivt",
    truth:
      "Positiv tenkning holder ikke alene. Den må kombineres med handling, tall og vilje til å se ting som de er.",
  },
  {
    lie: "Du må alltid vite hva konkurrentene dine gjør",
    truth:
      "Bruk energien på din egen visjon og din egen vekst, ikke på å følge med på alle andre.",
  },
  {
    lie: "Et hull i markedet er et rødt flagg",
    truth:
      "Et hull i markedet kan være en mulighet, så lenge det er lønnsomt og passer med visjonen din.",
  },
  {
    lie: "Alle kan mer om KI enn deg",
    truth:
      "Nysgjerrighet betyr mer enn å være ekspert. Start med å prøve én ting denne uka.",
  },
  {
    lie: "Du må jobbe gratis",
    truth:
      "Tida di har verdi. Å gi bort arbeid for å være snill er ikke bærekraftig, verken for deg eller bedriften.",
  },
  {
    lie: "Vi er likestilte i Norge",
    truth:
      "Likestilling i arbeidslivet kommer ikke av seg selv. Ofte må du være bevisst og aktiv for å få den.",
  },
  {
    lie: "Det er ingen som hjelper deg",
    truth:
      "Det finnes mentorer, nettverk og folk som gjerne hjelper. Men du må ofte spørre først.",
  },
  {
    lie: "Det er umulig å ta ferie",
    truth:
      "Med planlegging og delegering kan du ta ferie uten at bedriften faller sammen. Jeg hadde fri hver fredag i ti år.",
  },
];

export const AI_WORKFLOWS: Workflow[] = [
  {
    title: "Gå-tur-strategien",
    description:
      "Jeg brukte KI til å transkribere ordene mine mens jeg gikk tur og snakket med meg selv om hva som måtte med i boka. Det samme fungerer for bedriften.",
    inputLabel: "Talememo fra turen",
    inputIcon: "mic",
    outputLabel: "Tre prioriteringer",
    style: "standard",
    prompt: `Her er en transkripsjon av et talememo der jeg tenker høyt om bedriften min, [bedriftsnavn], som [hva dere gjør].

Les gjennom og gi meg:
1. De tre viktigste tingene jeg bør gjøre de neste 30 dagene, i prioritert rekkefølge
2. Én ting jeg sier at jeg vil, men som ikke passer med resten
3. Ett spørsmål jeg bør svare på før jeg går videre

Transkripsjon:
[lim inn]`,
    exampleOutput: `De tre viktigste tingene de neste 30 dagene:
1. Ring de tre kundene som har handlet mest i år, og spør hva de trenger neste halvår.
2. Kutt den minst lønnsomme månedspakken, og bruk tida på salg.
3. Sett av onsdag formiddag til salg, fast.

Dette passer ikke med resten:
Du sier du vil jobbe mindre, men også starte en podkast i høst.

Svar på dette før du går videre:
Hvilken kundegruppe vil du ha flere av om ett år?`,
  },
  {
    title: "Ditt fiktive styre",
    description:
      "«Jeg har bygget mitt eget fiktive styre i et KI-verktøy. Styret har tilgang til relevant informasjon om bedriften min, og jeg kan snakke med styret på høyttaler mens jeg kjører bil.»",
    inputLabel: "Om bedriften og et spørsmål",
    inputIcon: "users",
    outputLabel: "Råd fra tre styremedlemmer",
    style: "board",
    prompt: `Du er styret i bedriften min, [bedriftsnavn]. Styret har tre medlemmer:
- Regnskapsføreren: opptatt av lønnsomhet, kontantflyt og risiko
- Kunden: en av drømmekundene mine, ærlig om hva som faktisk betyr noe
- Gründeren: modig, har bygget og solgt bedrifter før

Om bedriften: [hva vi selger, til hvem, omtrentlig omsetning, antall ansatte]
Visjon: [visjonen]
Mål i år: [målene]

Jeg vil diskutere: [spørsmålet]

La hvert styremedlem svare kort etter tur. Avslutt med ett konkret råd styret er enige om.`,
    exampleOutput: `Regnskapsføreren: Månedspakkene tar over halvparten av tida di, men gir under en femtedel av fortjenesten. Det tallet ville jeg sett nærmere på.
Kunden: Jeg kjøper av deg fordi du løser problemet mitt raskt. Jeg bryr meg ikke om det heter pakke eller medlemskap.
Gründeren: Kutt ned til to pakker. Bruk tida du får tilbake på et produkt som kan selges uten at du er med.
Styret: Test et medlemskap på fem av kundene dine før sommeren, og bestem deg i august.`,
  },
  {
    title: "Endringshjulet med KI",
    description:
      "Ta et bilde av endringshjulet, eller kopier resultatet, og send det til et KI-verktøy sammen med hva bedriften driver med, visjonen og målene dine.",
    inputLabel: "Resultatet fra endringshjulet",
    inputIcon: "image",
    outputLabel: "Plan for det svakeste området",
    style: "standard",
    prompt: CHANGE_WHEEL_AI_PROMPT.replace(
      "{resultat}",
      "[lim inn resultatet, eller last opp et bilde av hjulet]"
    ),
    exampleOutput: `Plan for salg og markedsføring (1 av 3 ja):

1. Fast salgstid hver onsdag, 09–13.
   Tid: 4 timer i uka.
   Virker når: du har minst fem nye salgssamtaler i måneden.

2. Spør alle nye kunder hvor de hørte om deg.
   Tid: 5 minutter per kunde.
   Virker når: du vet hvor de tre siste kundene kom fra.

3. Velg én kanal og hold den i tre måneder.
   Tid: 2 timer i uka.
   Virker når: du får henvendelser, ikke bare likerklikk.`,
  },
  {
    title: "Prioritert salgsliste",
    description:
      "Få oversikt over potensielle kunder i et område, og en prioritert liste over salgsoppgaver for uka.",
    inputLabel: "Hva du selger, og hvor",
    inputIcon: "search",
    outputLabel: "Salgstavle og ukeliste",
    style: "standard",
    prompt: `Jeg selger [produkt/tjeneste] til [type bedrifter] i [område].

1. Foreslå hvilke typer bedrifter i området som passer best, og hvor jeg kan finne dem.
2. Lag en salgstavle med kolonnene: drømmekunder, i dialog, tilbud sendt (må følges opp), avslått, i boks.
3. Lag en prioritert liste over salgsoppgaver for denne uka, med de varmeste kundene først.

Her er kundene jeg har i dag, med status: [lim inn]`,
    exampleOutput: `Denne uka, varmeste først:
1. Følg opp tilbudet til Holviga Terrasse (sendt for ti dager siden).
2. Book et møte med Oltedal orientering, som sa ja til en prat.
3. Send en kort e-post til Wenches garn og A. Eriksens surdeigsbrød.
4. Finn fem nye drømmekunder i Brønnøysundregistrene.

Kalde kunder å varme opp neste uke:
Daniels duppsko, Lillians middagsservice.`,
  },
];

export const SALES_RITUAL = {
  ritualName: "Omsetnings-onsdag",
  weekday: "WE" as const,
  startTime: "09:00",
  durationMinutes: 240,
  quote:
    "«Min filosofi er at du burde gjøre minst én salgsfremmende aktivitet hver dag. Hvis du ikke har tid til å drive med salg hver dag, kanskje du kan dedikere halve onsdagen til salg og halve onsdagen til markedsføring, og kalle det omsetnings-onsdag?»",
  calendarDescription:
    "Halve økta til salg, halve til markedsføring. Fra boka «Verdifull vekst».",
  checklist: [
    "Gå gjennom salgstavla: kalde, medium varme og varme kunder",
    "Følg opp tilbud som er sendt",
    "Ta kontakt med én ny drømmekunde",
    "Sjekk spåkula: hvilke måneder trenger ekstra salg?",
    "Gjør én markedsføringsaktivitet",
  ],
};

export const CHAPTER_DOORS: PortalDoor[] = [
  {
    letter: "V",
    title: "Visjon",
    text: "Vet du hvor du skal? Ta VEKST-sjekken.",
    href: "#vekst-sjekken",
    linkLabel: "VEKST-sjekken",
  },
  {
    letter: "E",
    title: "Endring",
    text: "Finn området som trenger endring mest.",
    href: "#endringshjulet",
    linkLabel: "Endringshjulet",
  },
  {
    letter: "K",
    title: "Kunder",
    text: "Få KI til å sette opp salgstavla og drømmekundene.",
    href: "#arbeidsflyter-med-ki",
    linkLabel: "Arbeidsflyter med KI",
  },
  {
    letter: "S",
    title: "Salg",
    text: "Fast salgstid hver uke, rett i kalenderen.",
    href: "#omsetnings-onsdag",
    linkLabel: "Omsetnings-onsdag",
  },
  {
    letter: "T",
    title: "Tall",
    text: "Regn ut lønnsomhet, timepris og spåkule.",
    href: "#lonnsomhet",
    linkLabel: "Kalkulatorene",
  },
];

// ---------------------------------------------------------------------------
// Samme innhold i Payload-formen (array-rader og lenkefelt), til
// standardverdier og seed.
// ---------------------------------------------------------------------------

const linkFields = (link?: VekstLink) => ({
  linkLabel: link?.label,
  linkUrl: link?.href,
});

export const changeWheelAreasCms = () =>
  CHANGE_WHEEL_AREAS.map((area) => ({
    name: area.name,
    questions: area.questions.map((question) => ({ question })),
    advice: area.advice,
    ...linkFields(area.link),
    linkPending: area.linkPending ?? false,
  }));

export const vekstPillarsCms = () =>
  VEKST_PILLARS.map((pillar) => ({
    letter: pillar.letter,
    name: pillar.name,
    questions: pillar.questions.map((question) => ({ question })),
    advice: pillar.advice,
    ...linkFields(pillar.link),
  }));

export const mythsCms = () => MYTHS.map((myth) => ({ ...myth }));

export const workflowsCms = () =>
  AI_WORKFLOWS.map((workflow) => ({
    title: workflow.title,
    description: workflow.description,
    inputLabel: workflow.inputLabel,
    inputIcon: workflow.inputIcon,
    outputLabel: workflow.outputLabel,
    prompt: workflow.prompt,
    exampleOutput: workflow.exampleOutput,
    style: workflow.style ?? "standard",
  }));

export const ritualChecklistCms = () =>
  SALES_RITUAL.checklist.map((item) => ({ item }));

export const chapterDoorsCms = () =>
  CHAPTER_DOORS.map((door) => ({
    letter: door.letter,
    title: door.title,
    text: door.text,
    linkLabel: door.linkLabel,
    href: door.href,
  }));
