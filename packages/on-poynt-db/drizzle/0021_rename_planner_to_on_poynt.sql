-- Omdøping «planner» → «on_poynt» (2026-10-06). Medlemsområdet heter On Poynt;
-- «planner» var et arbeidsnavn. Alle data beholdes — bare navn endres:
--   schema  planner            → on_poynt
--   tabeller planner_<navn>    → <navn>          (prefikset er overflødig i eget schema)
--   enums    planner_<navn>    → <navn>
--   indekser/constraints       → samme uten «planner_» (matcher Drizzles genererte navn)
-- Skrevet for hånd (drizzle-kit kan ikke uttrykke rename uten interaktiv prompt);
-- snapshot 0021 er generert fra det nye skjemaet med `drizzle-kit generate --custom`.
ALTER SCHEMA "planner" RENAME TO "on_poynt";--> statement-breakpoint
DO $$
DECLARE
  r record;
BEGIN
  -- 1a) Fremmednøkler: bygg navnet fra definisjonen slik Drizzle gjør
  --     (<tabell>_<kolonner>_<reftabell>_<refkolonner>_fk, avkortet til 63 tegn).
  --     Ren tekst-erstatning holder ikke — fem av de gamle navnene var allerede
  --     avkortet av Postgres, så «planner_» midt i navnet var halvveis borte.
  FOR r IN
    SELECT con.conname,
           rel.relname,
           left(
             regexp_replace(rel.relname, 'planner_', '', 'g') || '_' ||
             (SELECT string_agg(a.attname, '_' ORDER BY k.ord)
                FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord)
                JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum) || '_' ||
             regexp_replace(frel.relname, 'planner_', '', 'g') || '_' ||
             (SELECT string_agg(a.attname, '_' ORDER BY k.ord)
                FROM unnest(con.confkey) WITH ORDINALITY k(attnum, ord)
                JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum) || '_fk',
             63
           ) AS newname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_class frel ON frel.oid = con.confrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'on_poynt' AND con.contype = 'f'
  LOOP
    IF r.newname <> r.conname THEN
      EXECUTE format(
        'ALTER TABLE on_poynt.%I RENAME CONSTRAINT %I TO %I',
        r.relname, r.conname, r.newname
      );
    END IF;
  END LOOP;

  -- 1b) Øvrige constraints (pk/unique): PK/unique-rename døper også om indeksen.
  FOR r IN
    SELECT con.conname, rel.relname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'on_poynt' AND con.contype <> 'f' AND con.conname LIKE '%planner\_%'
  LOOP
    EXECUTE format(
      'ALTER TABLE on_poynt.%I RENAME CONSTRAINT %I TO %I',
      r.relname, r.conname, regexp_replace(r.conname, 'planner_', '', 'g')
    );
  END LOOP;

  -- 2) Frittstående indekser.
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'on_poynt' AND c.relkind = 'i' AND c.relname LIKE '%planner\_%'
  LOOP
    EXECUTE format(
      'ALTER INDEX on_poynt.%I RENAME TO %I',
      r.relname, regexp_replace(r.relname, 'planner_', '', 'g')
    );
  END LOOP;

  -- 3) Sekvenser (ingen i dag, men ufarlig).
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'on_poynt' AND c.relkind = 'S' AND c.relname LIKE 'planner\_%'
  LOOP
    EXECUTE format(
      'ALTER SEQUENCE on_poynt.%I RENAME TO %I',
      r.relname, regexp_replace(r.relname, 'planner_', '', 'g')
    );
  END LOOP;

  -- 4) Tabeller.
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'on_poynt' AND c.relkind IN ('r', 'p') AND c.relname LIKE 'planner\_%'
  LOOP
    EXECUTE format(
      'ALTER TABLE on_poynt.%I RENAME TO %I',
      r.relname, regexp_replace(r.relname, 'planner_', '', 'g')
    );
  END LOOP;

  -- 5) Enum-typer.
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'on_poynt' AND t.typtype = 'e' AND t.typname LIKE 'planner\_%'
  LOOP
    EXECUTE format(
      'ALTER TYPE on_poynt.%I RENAME TO %I',
      r.typname, regexp_replace(r.typname, 'planner_', '', 'g')
    );
  END LOOP;
END $$;
