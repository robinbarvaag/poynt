import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_book_expenses_category" AS ENUM('design', 'redaktor', 'oversetter', 'trykkeri', 'bokbasen', 'forlagsentralen', 'markedsforing', 'lansering', 'annet');
  CREATE TYPE "public"."enum_book_sales_channel" AS ENUM('norli', 'ark', 'egen', 'foredrag', 'direkte', 'annet');
  CREATE TYPE "public"."enum_book_sales_sale_source" AS ENUM('avregning', 'foredrag', 'direkte', 'annet');
  CREATE TYPE "public"."enum_book_stock_snapshots_source_key" AS ENUM('norli', 'ark');
  CREATE TYPE "public"."enum_book_stock_snapshots_online" AS ENUM('unknown', 'not_listed', 'preorder', 'in_stock', 'out_of_stock');
  CREATE TYPE "public"."enum_book_stock_events_type" AS ENUM('sale', 'restock', 'listed', 'delisted', 'sold_out', 'availability');
  CREATE TYPE "public"."enum_book_stock_events_source_key" AS ENUM('norli', 'ark');
  CREATE TYPE "public"."enum_book_economy_channels_key" AS ENUM('norli', 'ark', 'egen', 'foredrag', 'direkte', 'annet');
  CREATE TYPE "public"."enum_book_economy_channels_stock_source" AS ENUM('none', 'norli', 'ark');
  CREATE TYPE "public"."enum_book_economy_sources_source_key" AS ENUM('norli', 'ark');
  CREATE TYPE "public"."enum_book_economy_editor_basis" AS ENUM('brutto', 'netto');
  CREATE TABLE "book_expenses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"category" "enum_book_expenses_category" NOT NULL,
  	"supplier" varchar,
  	"attachment_id" integer,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "book_sales" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"copies" numeric NOT NULL,
  	"channel" "enum_book_sales_channel" NOT NULL,
  	"sale_source" "enum_book_sales_sale_source" DEFAULT 'avregning' NOT NULL,
  	"unit_price" numeric,
  	"replaces_estimate" boolean DEFAULT false,
  	"period_start" timestamp(3) with time zone,
  	"reference" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "book_stock_snapshots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_key" "enum_book_stock_snapshots_source_key" NOT NULL,
  	"fetched_at" timestamp(3) with time zone NOT NULL,
  	"online" "enum_book_stock_snapshots_online" NOT NULL,
  	"price" numeric,
  	"store_count" numeric DEFAULT 0,
  	"stores_with_stock" numeric DEFAULT 0,
  	"total_copies" numeric DEFAULT 0,
  	"external_id" varchar,
  	"note" varchar,
  	"stores" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "book_stock_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"occurred_at" timestamp(3) with time zone NOT NULL,
  	"type" "enum_book_stock_events_type" NOT NULL,
  	"source_key" "enum_book_stock_events_source_key" NOT NULL,
  	"delta" numeric DEFAULT 0,
  	"store_name" varchar,
  	"city" varchar,
  	"region" varchar,
  	"from_qty" numeric,
  	"to_qty" numeric,
  	"store_id" varchar,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "book_economy_channels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_book_economy_channels_key" NOT NULL,
  	"label" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"stock_source" "enum_book_economy_channels_stock_source" DEFAULT 'none',
  	"retailer_percent" numeric DEFAULT 0,
  	"distribution_percent" numeric DEFAULT 0,
  	"distribution_per_copy" numeric DEFAULT 0,
  	"transaction_percent" numeric DEFAULT 0,
  	"transaction_per_copy" numeric DEFAULT 0
  );
  
  CREATE TABLE "book_economy_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_key" "enum_book_economy_sources_source_key" NOT NULL,
  	"active" boolean DEFAULT true
  );
  
  CREATE TABLE "book_economy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Verdifull vekst – i din bedrift' NOT NULL,
  	"isbn" varchar DEFAULT '9788230375334' NOT NULL,
  	"release_date" timestamp(3) with time zone DEFAULT '2026-10-15T00:00:00.000Z',
  	"list_price" numeric DEFAULT 399 NOT NULL,
  	"print_run" numeric,
  	"print_cost_per_copy" numeric DEFAULT 0,
  	"shop_product_id" integer,
  	"editor_percent" numeric DEFAULT 10 NOT NULL,
  	"editor_basis" "enum_book_economy_editor_basis" DEFAULT 'brutto' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_expenses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_sales_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_stock_snapshots_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_stock_events_id" integer;
  ALTER TABLE "book_expenses" ADD CONSTRAINT "book_expenses_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "book_economy_channels" ADD CONSTRAINT "book_economy_channels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."book_economy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "book_economy_sources" ADD CONSTRAINT "book_economy_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."book_economy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "book_economy" ADD CONSTRAINT "book_economy_shop_product_id_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "book_expenses_attachment_idx" ON "book_expenses" USING btree ("attachment_id");
  CREATE INDEX "book_expenses_updated_at_idx" ON "book_expenses" USING btree ("updated_at");
  CREATE INDEX "book_expenses_created_at_idx" ON "book_expenses" USING btree ("created_at");
  CREATE INDEX "book_sales_updated_at_idx" ON "book_sales" USING btree ("updated_at");
  CREATE INDEX "book_sales_created_at_idx" ON "book_sales" USING btree ("created_at");
  CREATE INDEX "book_stock_snapshots_source_key_idx" ON "book_stock_snapshots" USING btree ("source_key");
  CREATE INDEX "book_stock_snapshots_fetched_at_idx" ON "book_stock_snapshots" USING btree ("fetched_at");
  CREATE INDEX "book_stock_snapshots_updated_at_idx" ON "book_stock_snapshots" USING btree ("updated_at");
  CREATE INDEX "book_stock_snapshots_created_at_idx" ON "book_stock_snapshots" USING btree ("created_at");
  CREATE INDEX "book_stock_events_occurred_at_idx" ON "book_stock_events" USING btree ("occurred_at");
  CREATE INDEX "book_stock_events_type_idx" ON "book_stock_events" USING btree ("type");
  CREATE INDEX "book_stock_events_source_key_idx" ON "book_stock_events" USING btree ("source_key");
  CREATE INDEX "book_stock_events_store_id_idx" ON "book_stock_events" USING btree ("store_id");
  CREATE INDEX "book_stock_events_updated_at_idx" ON "book_stock_events" USING btree ("updated_at");
  CREATE INDEX "book_stock_events_created_at_idx" ON "book_stock_events" USING btree ("created_at");
  CREATE INDEX "book_economy_channels_order_idx" ON "book_economy_channels" USING btree ("_order");
  CREATE INDEX "book_economy_channels_parent_id_idx" ON "book_economy_channels" USING btree ("_parent_id");
  CREATE INDEX "book_economy_sources_order_idx" ON "book_economy_sources" USING btree ("_order");
  CREATE INDEX "book_economy_sources_parent_id_idx" ON "book_economy_sources" USING btree ("_parent_id");
  CREATE INDEX "book_economy_shop_product_idx" ON "book_economy" USING btree ("shop_product_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_expenses_fk" FOREIGN KEY ("book_expenses_id") REFERENCES "public"."book_expenses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_sales_fk" FOREIGN KEY ("book_sales_id") REFERENCES "public"."book_sales"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_stock_snapshots_fk" FOREIGN KEY ("book_stock_snapshots_id") REFERENCES "public"."book_stock_snapshots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_stock_events_fk" FOREIGN KEY ("book_stock_events_id") REFERENCES "public"."book_stock_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_book_expenses_id_idx" ON "payload_locked_documents_rels" USING btree ("book_expenses_id");
  CREATE INDEX "payload_locked_documents_rels_book_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("book_sales_id");
  CREATE INDEX "payload_locked_documents_rels_book_stock_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("book_stock_snapshots_id");
  CREATE INDEX "payload_locked_documents_rels_book_stock_events_id_idx" ON "payload_locked_documents_rels" USING btree ("book_stock_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_expenses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_sales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_stock_snapshots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_stock_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_economy_channels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_economy_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "book_economy" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "book_expenses" CASCADE;
  DROP TABLE "book_sales" CASCADE;
  DROP TABLE "book_stock_snapshots" CASCADE;
  DROP TABLE "book_stock_events" CASCADE;
  DROP TABLE "book_economy_channels" CASCADE;
  DROP TABLE "book_economy_sources" CASCADE;
  DROP TABLE "book_economy" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_expenses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_sales_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_stock_snapshots_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_stock_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_book_expenses_id_idx";
  DROP INDEX "payload_locked_documents_rels_book_sales_id_idx";
  DROP INDEX "payload_locked_documents_rels_book_stock_snapshots_id_idx";
  DROP INDEX "payload_locked_documents_rels_book_stock_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_expenses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_sales_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_stock_snapshots_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_stock_events_id";
  DROP TYPE "public"."enum_book_expenses_category";
  DROP TYPE "public"."enum_book_sales_channel";
  DROP TYPE "public"."enum_book_sales_sale_source";
  DROP TYPE "public"."enum_book_stock_snapshots_source_key";
  DROP TYPE "public"."enum_book_stock_snapshots_online";
  DROP TYPE "public"."enum_book_stock_events_type";
  DROP TYPE "public"."enum_book_stock_events_source_key";
  DROP TYPE "public"."enum_book_economy_channels_key";
  DROP TYPE "public"."enum_book_economy_channels_stock_source";
  DROP TYPE "public"."enum_book_economy_sources_source_key";
  DROP TYPE "public"."enum_book_economy_editor_basis";`)
}
