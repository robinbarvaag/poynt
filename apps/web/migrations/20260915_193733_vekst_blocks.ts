import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_chapter_portal_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_vekst_check_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_change_wheel_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_growth_calculator_calculator" AS ENUM('profit', 'hourly', 'forecast');
  CREATE TYPE "public"."enum_pages_blocks_growth_calculator_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_myth_cards_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_ai_workflow_workflows_input_icon" AS ENUM('mic', 'file-text', 'users', 'search', 'image', 'lightbulb');
  CREATE TYPE "public"."enum_pages_blocks_ai_workflow_workflows_style" AS ENUM('standard', 'board');
  CREATE TYPE "public"."enum_pages_blocks_ai_workflow_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_pages_blocks_sales_ritual_weekday" AS ENUM('MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU');
  CREATE TYPE "public"."enum_pages_blocks_sales_ritual_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_chapter_portal_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_vekst_check_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_change_wheel_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_growth_calculator_calculator" AS ENUM('profit', 'hourly', 'forecast');
  CREATE TYPE "public"."enum__pages_v_blocks_growth_calculator_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_myth_cards_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_ai_workflow_workflows_input_icon" AS ENUM('mic', 'file-text', 'users', 'search', 'image', 'lightbulb');
  CREATE TYPE "public"."enum__pages_v_blocks_ai_workflow_workflows_style" AS ENUM('standard', 'board');
  CREATE TYPE "public"."enum__pages_v_blocks_ai_workflow_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum__pages_v_blocks_sales_ritual_weekday" AS ENUM('MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU');
  CREATE TYPE "public"."enum__pages_v_blocks_sales_ritual_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_chapter_portal_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_vekst_check_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_change_wheel_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_growth_calculator_calculator" AS ENUM('profit', 'hourly', 'forecast');
  CREATE TYPE "public"."enum_homepage_blocks_growth_calculator_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_myth_cards_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_ai_workflow_workflows_input_icon" AS ENUM('mic', 'file-text', 'users', 'search', 'image', 'lightbulb');
  CREATE TYPE "public"."enum_homepage_blocks_ai_workflow_workflows_style" AS ENUM('standard', 'board');
  CREATE TYPE "public"."enum_homepage_blocks_ai_workflow_palette" AS ENUM('book', 'poynt');
  CREATE TYPE "public"."enum_homepage_blocks_sales_ritual_weekday" AS ENUM('MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU');
  CREATE TYPE "public"."enum_homepage_blocks_sales_ritual_palette" AS ENUM('book', 'poynt');
  CREATE TABLE "pages_blocks_chapter_portal_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_chapter_portal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_pages_blocks_chapter_portal_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_vekst_check_pillars_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar
  );
  
  CREATE TABLE "pages_blocks_vekst_check_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"name" varchar,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_vekst_check" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_pages_blocks_vekst_check_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_change_wheel_areas_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar
  );
  
  CREATE TABLE "pages_blocks_change_wheel_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_change_wheel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ai_prompt" varchar DEFAULT 'Jeg har fylt ut endringshjulet fra boka «Verdifull vekst». Her er svarene mine:
  {resultat}
  
  Bedriften min: [hva dere driver med]
  Visjonen min: [visjonen]
  Målene mine: [målene]
  
  Hjelp meg å lage en plan for det svakeste området: tre konkrete tiltak for de neste tre månedene, hvor mye tid hvert tiltak krever, og hvordan jeg ser at det virker.',
  	"palette" "enum_pages_blocks_change_wheel_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_growth_calculator" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"calculator" "enum_pages_blocks_growth_calculator_calculator" DEFAULT 'profit',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"profit_example_label" varchar DEFAULT 'Prøv Gudruns komler',
  	"profit_example_price" numeric DEFAULT 140,
  	"profit_example_cost" numeric DEFAULT 160,
  	"profit_example_cost_label" varchar DEFAULT 'Komler og kjøtt per tallerken',
  	"profit_example_note" varchar DEFAULT '«Prisen du betalte for en gigantisk komletallerken var bare 140 kroner! Komle- og kjøttkostnaden til Gudrun? Den var 160 kroner per tallerken!» Gudrun tapte rett og slett penger på å selge komler.',
  	"multiplier" numeric DEFAULT 1.5,
  	"monthly_need" numeric DEFAULT 127000,
  	"footnote" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum_pages_blocks_growth_calculator_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_myth_cards_myths" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lie" varchar,
  	"truth" varchar
  );
  
  CREATE TABLE "pages_blocks_myth_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum_pages_blocks_myth_cards_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_ai_workflow_workflows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"input_label" varchar,
  	"input_icon" "enum_pages_blocks_ai_workflow_workflows_input_icon" DEFAULT 'file-text',
  	"output_label" varchar,
  	"prompt" varchar,
  	"example_output" varchar,
  	"style" "enum_pages_blocks_ai_workflow_workflows_style" DEFAULT 'standard'
  );
  
  CREATE TABLE "pages_blocks_ai_workflow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_pages_blocks_ai_workflow_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_ritual_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_sales_ritual" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ritual_name" varchar DEFAULT 'Omsetnings-onsdag',
  	"weekday" "enum_pages_blocks_sales_ritual_weekday" DEFAULT 'WE',
  	"start_time" varchar DEFAULT '09:00',
  	"duration_minutes" numeric DEFAULT 240,
  	"quote" varchar DEFAULT '«Min filosofi er at du burde gjøre minst én salgsfremmende aktivitet hver dag. Hvis du ikke har tid til å drive med salg hver dag, kanskje du kan dedikere halve onsdagen til salg og halve onsdagen til markedsføring, og kalle det omsetnings-onsdag?»',
  	"calendar_description" varchar DEFAULT 'Halve økta til salg, halve til markedsføring. Fra boka «Verdifull vekst».',
  	"palette" "enum_pages_blocks_sales_ritual_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_chapter_portal_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"title" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_chapter_portal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum__pages_v_blocks_chapter_portal_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_vekst_check_pillars_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_vekst_check_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"name" varchar,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_vekst_check" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum__pages_v_blocks_vekst_check_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_change_wheel_areas_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_change_wheel_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_change_wheel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ai_prompt" varchar DEFAULT 'Jeg har fylt ut endringshjulet fra boka «Verdifull vekst». Her er svarene mine:
  {resultat}
  
  Bedriften min: [hva dere driver med]
  Visjonen min: [visjonen]
  Målene mine: [målene]
  
  Hjelp meg å lage en plan for det svakeste området: tre konkrete tiltak for de neste tre månedene, hvor mye tid hvert tiltak krever, og hvordan jeg ser at det virker.',
  	"palette" "enum__pages_v_blocks_change_wheel_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_growth_calculator" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"calculator" "enum__pages_v_blocks_growth_calculator_calculator" DEFAULT 'profit',
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"profit_example_label" varchar DEFAULT 'Prøv Gudruns komler',
  	"profit_example_price" numeric DEFAULT 140,
  	"profit_example_cost" numeric DEFAULT 160,
  	"profit_example_cost_label" varchar DEFAULT 'Komler og kjøtt per tallerken',
  	"profit_example_note" varchar DEFAULT '«Prisen du betalte for en gigantisk komletallerken var bare 140 kroner! Komle- og kjøttkostnaden til Gudrun? Den var 160 kroner per tallerken!» Gudrun tapte rett og slett penger på å selge komler.',
  	"multiplier" numeric DEFAULT 1.5,
  	"monthly_need" numeric DEFAULT 127000,
  	"footnote" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum__pages_v_blocks_growth_calculator_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_myth_cards_myths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"lie" varchar,
  	"truth" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_myth_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum__pages_v_blocks_myth_cards_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ai_workflow_workflows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"input_label" varchar,
  	"input_icon" "enum__pages_v_blocks_ai_workflow_workflows_input_icon" DEFAULT 'file-text',
  	"output_label" varchar,
  	"prompt" varchar,
  	"example_output" varchar,
  	"style" "enum__pages_v_blocks_ai_workflow_workflows_style" DEFAULT 'standard',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_ai_workflow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum__pages_v_blocks_ai_workflow_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_ritual_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_sales_ritual" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ritual_name" varchar DEFAULT 'Omsetnings-onsdag',
  	"weekday" "enum__pages_v_blocks_sales_ritual_weekday" DEFAULT 'WE',
  	"start_time" varchar DEFAULT '09:00',
  	"duration_minutes" numeric DEFAULT 240,
  	"quote" varchar DEFAULT '«Min filosofi er at du burde gjøre minst én salgsfremmende aktivitet hver dag. Hvis du ikke har tid til å drive med salg hver dag, kanskje du kan dedikere halve onsdagen til salg og halve onsdagen til markedsføring, og kalle det omsetnings-onsdag?»',
  	"calendar_description" varchar DEFAULT 'Halve økta til salg, halve til markedsføring. Fra boka «Verdifull vekst».',
  	"palette" "enum__pages_v_blocks_sales_ritual_palette" DEFAULT 'book',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_chapter_portal_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"link_label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "homepage_blocks_chapter_portal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_homepage_blocks_chapter_portal_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_vekst_check_pillars_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_vekst_check_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"letter" varchar,
  	"name" varchar NOT NULL,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "homepage_blocks_vekst_check" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_homepage_blocks_vekst_check_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_change_wheel_areas_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_change_wheel_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"advice" varchar,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "homepage_blocks_change_wheel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ai_prompt" varchar DEFAULT 'Jeg har fylt ut endringshjulet fra boka «Verdifull vekst». Her er svarene mine:
  {resultat}
  
  Bedriften min: [hva dere driver med]
  Visjonen min: [visjonen]
  Målene mine: [målene]
  
  Hjelp meg å lage en plan for det svakeste området: tre konkrete tiltak for de neste tre månedene, hvor mye tid hvert tiltak krever, og hvordan jeg ser at det virker.',
  	"palette" "enum_homepage_blocks_change_wheel_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_growth_calculator" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"calculator" "enum_homepage_blocks_growth_calculator_calculator" DEFAULT 'profit' NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"profit_example_label" varchar DEFAULT 'Prøv Gudruns komler',
  	"profit_example_price" numeric DEFAULT 140,
  	"profit_example_cost" numeric DEFAULT 160,
  	"profit_example_cost_label" varchar DEFAULT 'Komler og kjøtt per tallerken',
  	"profit_example_note" varchar DEFAULT '«Prisen du betalte for en gigantisk komletallerken var bare 140 kroner! Komle- og kjøttkostnaden til Gudrun? Den var 160 kroner per tallerken!» Gudrun tapte rett og slett penger på å selge komler.',
  	"multiplier" numeric DEFAULT 1.5,
  	"monthly_need" numeric DEFAULT 127000,
  	"footnote" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum_homepage_blocks_growth_calculator_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_myth_cards_myths" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lie" varchar NOT NULL,
  	"truth" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_myth_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"link_url" varchar,
  	"palette" "enum_homepage_blocks_myth_cards_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_ai_workflow_workflows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"input_label" varchar,
  	"input_icon" "enum_homepage_blocks_ai_workflow_workflows_input_icon" DEFAULT 'file-text',
  	"output_label" varchar,
  	"prompt" varchar NOT NULL,
  	"example_output" varchar,
  	"style" "enum_homepage_blocks_ai_workflow_workflows_style" DEFAULT 'standard'
  );
  
  CREATE TABLE "homepage_blocks_ai_workflow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"palette" "enum_homepage_blocks_ai_workflow_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_sales_ritual_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_sales_ritual" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"ritual_name" varchar DEFAULT 'Omsetnings-onsdag' NOT NULL,
  	"weekday" "enum_homepage_blocks_sales_ritual_weekday" DEFAULT 'WE' NOT NULL,
  	"start_time" varchar DEFAULT '09:00' NOT NULL,
  	"duration_minutes" numeric DEFAULT 240 NOT NULL,
  	"quote" varchar DEFAULT '«Min filosofi er at du burde gjøre minst én salgsfremmende aktivitet hver dag. Hvis du ikke har tid til å drive med salg hver dag, kanskje du kan dedikere halve onsdagen til salg og halve onsdagen til markedsføring, og kalle det omsetnings-onsdag?»',
  	"calendar_description" varchar DEFAULT 'Halve økta til salg, halve til markedsføring. Fra boka «Verdifull vekst».',
  	"palette" "enum_homepage_blocks_sales_ritual_palette" DEFAULT 'book',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_chapter_portal_doors" ADD CONSTRAINT "pages_blocks_chapter_portal_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_chapter_portal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_chapter_portal" ADD CONSTRAINT "pages_blocks_chapter_portal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_vekst_check_pillars_questions" ADD CONSTRAINT "pages_blocks_vekst_check_pillars_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_vekst_check_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_vekst_check_pillars" ADD CONSTRAINT "pages_blocks_vekst_check_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_vekst_check"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_vekst_check" ADD CONSTRAINT "pages_blocks_vekst_check_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_change_wheel_areas_questions" ADD CONSTRAINT "pages_blocks_change_wheel_areas_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_change_wheel_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_change_wheel_areas" ADD CONSTRAINT "pages_blocks_change_wheel_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_change_wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_change_wheel" ADD CONSTRAINT "pages_blocks_change_wheel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_growth_calculator" ADD CONSTRAINT "pages_blocks_growth_calculator_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_myth_cards_myths" ADD CONSTRAINT "pages_blocks_myth_cards_myths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_myth_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_myth_cards" ADD CONSTRAINT "pages_blocks_myth_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ai_workflow_workflows" ADD CONSTRAINT "pages_blocks_ai_workflow_workflows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_ai_workflow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_ai_workflow" ADD CONSTRAINT "pages_blocks_ai_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_ritual_checklist" ADD CONSTRAINT "pages_blocks_sales_ritual_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_sales_ritual"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_sales_ritual" ADD CONSTRAINT "pages_blocks_sales_ritual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_chapter_portal_doors" ADD CONSTRAINT "_pages_v_blocks_chapter_portal_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_chapter_portal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_chapter_portal" ADD CONSTRAINT "_pages_v_blocks_chapter_portal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_vekst_check_pillars_questions" ADD CONSTRAINT "_pages_v_blocks_vekst_check_pillars_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_vekst_check_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_vekst_check_pillars" ADD CONSTRAINT "_pages_v_blocks_vekst_check_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_vekst_check"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_vekst_check" ADD CONSTRAINT "_pages_v_blocks_vekst_check_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_change_wheel_areas_questions" ADD CONSTRAINT "_pages_v_blocks_change_wheel_areas_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_change_wheel_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_change_wheel_areas" ADD CONSTRAINT "_pages_v_blocks_change_wheel_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_change_wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_change_wheel" ADD CONSTRAINT "_pages_v_blocks_change_wheel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_growth_calculator" ADD CONSTRAINT "_pages_v_blocks_growth_calculator_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_myth_cards_myths" ADD CONSTRAINT "_pages_v_blocks_myth_cards_myths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_myth_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_myth_cards" ADD CONSTRAINT "_pages_v_blocks_myth_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ai_workflow_workflows" ADD CONSTRAINT "_pages_v_blocks_ai_workflow_workflows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_ai_workflow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_ai_workflow" ADD CONSTRAINT "_pages_v_blocks_ai_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_ritual_checklist" ADD CONSTRAINT "_pages_v_blocks_sales_ritual_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_sales_ritual"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_sales_ritual" ADD CONSTRAINT "_pages_v_blocks_sales_ritual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_chapter_portal_doors" ADD CONSTRAINT "homepage_blocks_chapter_portal_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_chapter_portal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_chapter_portal" ADD CONSTRAINT "homepage_blocks_chapter_portal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_vekst_check_pillars_questions" ADD CONSTRAINT "homepage_blocks_vekst_check_pillars_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_vekst_check_pillars"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_vekst_check_pillars" ADD CONSTRAINT "homepage_blocks_vekst_check_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_vekst_check"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_vekst_check" ADD CONSTRAINT "homepage_blocks_vekst_check_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_change_wheel_areas_questions" ADD CONSTRAINT "homepage_blocks_change_wheel_areas_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_change_wheel_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_change_wheel_areas" ADD CONSTRAINT "homepage_blocks_change_wheel_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_change_wheel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_change_wheel" ADD CONSTRAINT "homepage_blocks_change_wheel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_growth_calculator" ADD CONSTRAINT "homepage_blocks_growth_calculator_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_myth_cards_myths" ADD CONSTRAINT "homepage_blocks_myth_cards_myths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_myth_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_myth_cards" ADD CONSTRAINT "homepage_blocks_myth_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_ai_workflow_workflows" ADD CONSTRAINT "homepage_blocks_ai_workflow_workflows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_ai_workflow"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_ai_workflow" ADD CONSTRAINT "homepage_blocks_ai_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_sales_ritual_checklist" ADD CONSTRAINT "homepage_blocks_sales_ritual_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_sales_ritual"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_sales_ritual" ADD CONSTRAINT "homepage_blocks_sales_ritual_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_chapter_portal_doors_order_idx" ON "pages_blocks_chapter_portal_doors" USING btree ("_order");
  CREATE INDEX "pages_blocks_chapter_portal_doors_parent_id_idx" ON "pages_blocks_chapter_portal_doors" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_chapter_portal_order_idx" ON "pages_blocks_chapter_portal" USING btree ("_order");
  CREATE INDEX "pages_blocks_chapter_portal_parent_id_idx" ON "pages_blocks_chapter_portal" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_chapter_portal_path_idx" ON "pages_blocks_chapter_portal" USING btree ("_path");
  CREATE INDEX "pages_blocks_vekst_check_pillars_questions_order_idx" ON "pages_blocks_vekst_check_pillars_questions" USING btree ("_order");
  CREATE INDEX "pages_blocks_vekst_check_pillars_questions_parent_id_idx" ON "pages_blocks_vekst_check_pillars_questions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_vekst_check_pillars_order_idx" ON "pages_blocks_vekst_check_pillars" USING btree ("_order");
  CREATE INDEX "pages_blocks_vekst_check_pillars_parent_id_idx" ON "pages_blocks_vekst_check_pillars" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_vekst_check_order_idx" ON "pages_blocks_vekst_check" USING btree ("_order");
  CREATE INDEX "pages_blocks_vekst_check_parent_id_idx" ON "pages_blocks_vekst_check" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_vekst_check_path_idx" ON "pages_blocks_vekst_check" USING btree ("_path");
  CREATE INDEX "pages_blocks_change_wheel_areas_questions_order_idx" ON "pages_blocks_change_wheel_areas_questions" USING btree ("_order");
  CREATE INDEX "pages_blocks_change_wheel_areas_questions_parent_id_idx" ON "pages_blocks_change_wheel_areas_questions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_change_wheel_areas_order_idx" ON "pages_blocks_change_wheel_areas" USING btree ("_order");
  CREATE INDEX "pages_blocks_change_wheel_areas_parent_id_idx" ON "pages_blocks_change_wheel_areas" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_change_wheel_order_idx" ON "pages_blocks_change_wheel" USING btree ("_order");
  CREATE INDEX "pages_blocks_change_wheel_parent_id_idx" ON "pages_blocks_change_wheel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_change_wheel_path_idx" ON "pages_blocks_change_wheel" USING btree ("_path");
  CREATE INDEX "pages_blocks_growth_calculator_order_idx" ON "pages_blocks_growth_calculator" USING btree ("_order");
  CREATE INDEX "pages_blocks_growth_calculator_parent_id_idx" ON "pages_blocks_growth_calculator" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_growth_calculator_path_idx" ON "pages_blocks_growth_calculator" USING btree ("_path");
  CREATE INDEX "pages_blocks_myth_cards_myths_order_idx" ON "pages_blocks_myth_cards_myths" USING btree ("_order");
  CREATE INDEX "pages_blocks_myth_cards_myths_parent_id_idx" ON "pages_blocks_myth_cards_myths" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_myth_cards_order_idx" ON "pages_blocks_myth_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_myth_cards_parent_id_idx" ON "pages_blocks_myth_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_myth_cards_path_idx" ON "pages_blocks_myth_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_ai_workflow_workflows_order_idx" ON "pages_blocks_ai_workflow_workflows" USING btree ("_order");
  CREATE INDEX "pages_blocks_ai_workflow_workflows_parent_id_idx" ON "pages_blocks_ai_workflow_workflows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ai_workflow_order_idx" ON "pages_blocks_ai_workflow" USING btree ("_order");
  CREATE INDEX "pages_blocks_ai_workflow_parent_id_idx" ON "pages_blocks_ai_workflow" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_ai_workflow_path_idx" ON "pages_blocks_ai_workflow" USING btree ("_path");
  CREATE INDEX "pages_blocks_sales_ritual_checklist_order_idx" ON "pages_blocks_sales_ritual_checklist" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_ritual_checklist_parent_id_idx" ON "pages_blocks_sales_ritual_checklist" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_ritual_order_idx" ON "pages_blocks_sales_ritual" USING btree ("_order");
  CREATE INDEX "pages_blocks_sales_ritual_parent_id_idx" ON "pages_blocks_sales_ritual" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_sales_ritual_path_idx" ON "pages_blocks_sales_ritual" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_chapter_portal_doors_order_idx" ON "_pages_v_blocks_chapter_portal_doors" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_chapter_portal_doors_parent_id_idx" ON "_pages_v_blocks_chapter_portal_doors" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_chapter_portal_order_idx" ON "_pages_v_blocks_chapter_portal" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_chapter_portal_parent_id_idx" ON "_pages_v_blocks_chapter_portal" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_chapter_portal_path_idx" ON "_pages_v_blocks_chapter_portal" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_vekst_check_pillars_questions_order_idx" ON "_pages_v_blocks_vekst_check_pillars_questions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_vekst_check_pillars_questions_parent_id_idx" ON "_pages_v_blocks_vekst_check_pillars_questions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_vekst_check_pillars_order_idx" ON "_pages_v_blocks_vekst_check_pillars" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_vekst_check_pillars_parent_id_idx" ON "_pages_v_blocks_vekst_check_pillars" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_vekst_check_order_idx" ON "_pages_v_blocks_vekst_check" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_vekst_check_parent_id_idx" ON "_pages_v_blocks_vekst_check" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_vekst_check_path_idx" ON "_pages_v_blocks_vekst_check" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_change_wheel_areas_questions_order_idx" ON "_pages_v_blocks_change_wheel_areas_questions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_change_wheel_areas_questions_parent_id_idx" ON "_pages_v_blocks_change_wheel_areas_questions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_change_wheel_areas_order_idx" ON "_pages_v_blocks_change_wheel_areas" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_change_wheel_areas_parent_id_idx" ON "_pages_v_blocks_change_wheel_areas" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_change_wheel_order_idx" ON "_pages_v_blocks_change_wheel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_change_wheel_parent_id_idx" ON "_pages_v_blocks_change_wheel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_change_wheel_path_idx" ON "_pages_v_blocks_change_wheel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_growth_calculator_order_idx" ON "_pages_v_blocks_growth_calculator" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_growth_calculator_parent_id_idx" ON "_pages_v_blocks_growth_calculator" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_growth_calculator_path_idx" ON "_pages_v_blocks_growth_calculator" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_myth_cards_myths_order_idx" ON "_pages_v_blocks_myth_cards_myths" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_myth_cards_myths_parent_id_idx" ON "_pages_v_blocks_myth_cards_myths" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_myth_cards_order_idx" ON "_pages_v_blocks_myth_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_myth_cards_parent_id_idx" ON "_pages_v_blocks_myth_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_myth_cards_path_idx" ON "_pages_v_blocks_myth_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_ai_workflow_workflows_order_idx" ON "_pages_v_blocks_ai_workflow_workflows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ai_workflow_workflows_parent_id_idx" ON "_pages_v_blocks_ai_workflow_workflows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ai_workflow_order_idx" ON "_pages_v_blocks_ai_workflow" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_ai_workflow_parent_id_idx" ON "_pages_v_blocks_ai_workflow" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_ai_workflow_path_idx" ON "_pages_v_blocks_ai_workflow" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_sales_ritual_checklist_order_idx" ON "_pages_v_blocks_sales_ritual_checklist" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_ritual_checklist_parent_id_idx" ON "_pages_v_blocks_sales_ritual_checklist" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_ritual_order_idx" ON "_pages_v_blocks_sales_ritual" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_sales_ritual_parent_id_idx" ON "_pages_v_blocks_sales_ritual" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_sales_ritual_path_idx" ON "_pages_v_blocks_sales_ritual" USING btree ("_path");
  CREATE INDEX "homepage_blocks_chapter_portal_doors_order_idx" ON "homepage_blocks_chapter_portal_doors" USING btree ("_order");
  CREATE INDEX "homepage_blocks_chapter_portal_doors_parent_id_idx" ON "homepage_blocks_chapter_portal_doors" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_chapter_portal_order_idx" ON "homepage_blocks_chapter_portal" USING btree ("_order");
  CREATE INDEX "homepage_blocks_chapter_portal_parent_id_idx" ON "homepage_blocks_chapter_portal" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_chapter_portal_path_idx" ON "homepage_blocks_chapter_portal" USING btree ("_path");
  CREATE INDEX "homepage_blocks_vekst_check_pillars_questions_order_idx" ON "homepage_blocks_vekst_check_pillars_questions" USING btree ("_order");
  CREATE INDEX "homepage_blocks_vekst_check_pillars_questions_parent_id_idx" ON "homepage_blocks_vekst_check_pillars_questions" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_vekst_check_pillars_order_idx" ON "homepage_blocks_vekst_check_pillars" USING btree ("_order");
  CREATE INDEX "homepage_blocks_vekst_check_pillars_parent_id_idx" ON "homepage_blocks_vekst_check_pillars" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_vekst_check_order_idx" ON "homepage_blocks_vekst_check" USING btree ("_order");
  CREATE INDEX "homepage_blocks_vekst_check_parent_id_idx" ON "homepage_blocks_vekst_check" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_vekst_check_path_idx" ON "homepage_blocks_vekst_check" USING btree ("_path");
  CREATE INDEX "homepage_blocks_change_wheel_areas_questions_order_idx" ON "homepage_blocks_change_wheel_areas_questions" USING btree ("_order");
  CREATE INDEX "homepage_blocks_change_wheel_areas_questions_parent_id_idx" ON "homepage_blocks_change_wheel_areas_questions" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_change_wheel_areas_order_idx" ON "homepage_blocks_change_wheel_areas" USING btree ("_order");
  CREATE INDEX "homepage_blocks_change_wheel_areas_parent_id_idx" ON "homepage_blocks_change_wheel_areas" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_change_wheel_order_idx" ON "homepage_blocks_change_wheel" USING btree ("_order");
  CREATE INDEX "homepage_blocks_change_wheel_parent_id_idx" ON "homepage_blocks_change_wheel" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_change_wheel_path_idx" ON "homepage_blocks_change_wheel" USING btree ("_path");
  CREATE INDEX "homepage_blocks_growth_calculator_order_idx" ON "homepage_blocks_growth_calculator" USING btree ("_order");
  CREATE INDEX "homepage_blocks_growth_calculator_parent_id_idx" ON "homepage_blocks_growth_calculator" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_growth_calculator_path_idx" ON "homepage_blocks_growth_calculator" USING btree ("_path");
  CREATE INDEX "homepage_blocks_myth_cards_myths_order_idx" ON "homepage_blocks_myth_cards_myths" USING btree ("_order");
  CREATE INDEX "homepage_blocks_myth_cards_myths_parent_id_idx" ON "homepage_blocks_myth_cards_myths" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_myth_cards_order_idx" ON "homepage_blocks_myth_cards" USING btree ("_order");
  CREATE INDEX "homepage_blocks_myth_cards_parent_id_idx" ON "homepage_blocks_myth_cards" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_myth_cards_path_idx" ON "homepage_blocks_myth_cards" USING btree ("_path");
  CREATE INDEX "homepage_blocks_ai_workflow_workflows_order_idx" ON "homepage_blocks_ai_workflow_workflows" USING btree ("_order");
  CREATE INDEX "homepage_blocks_ai_workflow_workflows_parent_id_idx" ON "homepage_blocks_ai_workflow_workflows" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_ai_workflow_order_idx" ON "homepage_blocks_ai_workflow" USING btree ("_order");
  CREATE INDEX "homepage_blocks_ai_workflow_parent_id_idx" ON "homepage_blocks_ai_workflow" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_ai_workflow_path_idx" ON "homepage_blocks_ai_workflow" USING btree ("_path");
  CREATE INDEX "homepage_blocks_sales_ritual_checklist_order_idx" ON "homepage_blocks_sales_ritual_checklist" USING btree ("_order");
  CREATE INDEX "homepage_blocks_sales_ritual_checklist_parent_id_idx" ON "homepage_blocks_sales_ritual_checklist" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_sales_ritual_order_idx" ON "homepage_blocks_sales_ritual" USING btree ("_order");
  CREATE INDEX "homepage_blocks_sales_ritual_parent_id_idx" ON "homepage_blocks_sales_ritual" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_sales_ritual_path_idx" ON "homepage_blocks_sales_ritual" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_chapter_portal_doors" CASCADE;
  DROP TABLE "pages_blocks_chapter_portal" CASCADE;
  DROP TABLE "pages_blocks_vekst_check_pillars_questions" CASCADE;
  DROP TABLE "pages_blocks_vekst_check_pillars" CASCADE;
  DROP TABLE "pages_blocks_vekst_check" CASCADE;
  DROP TABLE "pages_blocks_change_wheel_areas_questions" CASCADE;
  DROP TABLE "pages_blocks_change_wheel_areas" CASCADE;
  DROP TABLE "pages_blocks_change_wheel" CASCADE;
  DROP TABLE "pages_blocks_growth_calculator" CASCADE;
  DROP TABLE "pages_blocks_myth_cards_myths" CASCADE;
  DROP TABLE "pages_blocks_myth_cards" CASCADE;
  DROP TABLE "pages_blocks_ai_workflow_workflows" CASCADE;
  DROP TABLE "pages_blocks_ai_workflow" CASCADE;
  DROP TABLE "pages_blocks_sales_ritual_checklist" CASCADE;
  DROP TABLE "pages_blocks_sales_ritual" CASCADE;
  DROP TABLE "_pages_v_blocks_chapter_portal_doors" CASCADE;
  DROP TABLE "_pages_v_blocks_chapter_portal" CASCADE;
  DROP TABLE "_pages_v_blocks_vekst_check_pillars_questions" CASCADE;
  DROP TABLE "_pages_v_blocks_vekst_check_pillars" CASCADE;
  DROP TABLE "_pages_v_blocks_vekst_check" CASCADE;
  DROP TABLE "_pages_v_blocks_change_wheel_areas_questions" CASCADE;
  DROP TABLE "_pages_v_blocks_change_wheel_areas" CASCADE;
  DROP TABLE "_pages_v_blocks_change_wheel" CASCADE;
  DROP TABLE "_pages_v_blocks_growth_calculator" CASCADE;
  DROP TABLE "_pages_v_blocks_myth_cards_myths" CASCADE;
  DROP TABLE "_pages_v_blocks_myth_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_ai_workflow_workflows" CASCADE;
  DROP TABLE "_pages_v_blocks_ai_workflow" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_ritual_checklist" CASCADE;
  DROP TABLE "_pages_v_blocks_sales_ritual" CASCADE;
  DROP TABLE "homepage_blocks_chapter_portal_doors" CASCADE;
  DROP TABLE "homepage_blocks_chapter_portal" CASCADE;
  DROP TABLE "homepage_blocks_vekst_check_pillars_questions" CASCADE;
  DROP TABLE "homepage_blocks_vekst_check_pillars" CASCADE;
  DROP TABLE "homepage_blocks_vekst_check" CASCADE;
  DROP TABLE "homepage_blocks_change_wheel_areas_questions" CASCADE;
  DROP TABLE "homepage_blocks_change_wheel_areas" CASCADE;
  DROP TABLE "homepage_blocks_change_wheel" CASCADE;
  DROP TABLE "homepage_blocks_growth_calculator" CASCADE;
  DROP TABLE "homepage_blocks_myth_cards_myths" CASCADE;
  DROP TABLE "homepage_blocks_myth_cards" CASCADE;
  DROP TABLE "homepage_blocks_ai_workflow_workflows" CASCADE;
  DROP TABLE "homepage_blocks_ai_workflow" CASCADE;
  DROP TABLE "homepage_blocks_sales_ritual_checklist" CASCADE;
  DROP TABLE "homepage_blocks_sales_ritual" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_chapter_portal_palette";
  DROP TYPE "public"."enum_pages_blocks_vekst_check_palette";
  DROP TYPE "public"."enum_pages_blocks_change_wheel_palette";
  DROP TYPE "public"."enum_pages_blocks_growth_calculator_calculator";
  DROP TYPE "public"."enum_pages_blocks_growth_calculator_palette";
  DROP TYPE "public"."enum_pages_blocks_myth_cards_palette";
  DROP TYPE "public"."enum_pages_blocks_ai_workflow_workflows_input_icon";
  DROP TYPE "public"."enum_pages_blocks_ai_workflow_workflows_style";
  DROP TYPE "public"."enum_pages_blocks_ai_workflow_palette";
  DROP TYPE "public"."enum_pages_blocks_sales_ritual_weekday";
  DROP TYPE "public"."enum_pages_blocks_sales_ritual_palette";
  DROP TYPE "public"."enum__pages_v_blocks_chapter_portal_palette";
  DROP TYPE "public"."enum__pages_v_blocks_vekst_check_palette";
  DROP TYPE "public"."enum__pages_v_blocks_change_wheel_palette";
  DROP TYPE "public"."enum__pages_v_blocks_growth_calculator_calculator";
  DROP TYPE "public"."enum__pages_v_blocks_growth_calculator_palette";
  DROP TYPE "public"."enum__pages_v_blocks_myth_cards_palette";
  DROP TYPE "public"."enum__pages_v_blocks_ai_workflow_workflows_input_icon";
  DROP TYPE "public"."enum__pages_v_blocks_ai_workflow_workflows_style";
  DROP TYPE "public"."enum__pages_v_blocks_ai_workflow_palette";
  DROP TYPE "public"."enum__pages_v_blocks_sales_ritual_weekday";
  DROP TYPE "public"."enum__pages_v_blocks_sales_ritual_palette";
  DROP TYPE "public"."enum_homepage_blocks_chapter_portal_palette";
  DROP TYPE "public"."enum_homepage_blocks_vekst_check_palette";
  DROP TYPE "public"."enum_homepage_blocks_change_wheel_palette";
  DROP TYPE "public"."enum_homepage_blocks_growth_calculator_calculator";
  DROP TYPE "public"."enum_homepage_blocks_growth_calculator_palette";
  DROP TYPE "public"."enum_homepage_blocks_myth_cards_palette";
  DROP TYPE "public"."enum_homepage_blocks_ai_workflow_workflows_input_icon";
  DROP TYPE "public"."enum_homepage_blocks_ai_workflow_workflows_style";
  DROP TYPE "public"."enum_homepage_blocks_ai_workflow_palette";
  DROP TYPE "public"."enum_homepage_blocks_sales_ritual_weekday";
  DROP TYPE "public"."enum_homepage_blocks_sales_ritual_palette";`)
}
