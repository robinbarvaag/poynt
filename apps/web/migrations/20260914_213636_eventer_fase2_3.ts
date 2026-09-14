import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_payment_methods" AS ENUM('vipps', 'stripe');
  CREATE TYPE "public"."enum_events_vat_rate" AS ENUM('25', '0');
  CREATE TYPE "public"."enum__events_v_version_payment_methods" AS ENUM('vipps', 'stripe');
  CREATE TYPE "public"."enum__events_v_version_vat_rate" AS ENUM('25', '0');
  CREATE TYPE "public"."enum_event_registrations_source" AS ENUM('online', 'walk_in');
  CREATE TYPE "public"."enum_event_registrations_payment_provider" AS ENUM('vipps', 'stripe');
  ALTER TYPE "public"."enum_event_registrations_status" ADD VALUE 'pending_payment';
  ALTER TYPE "public"."enum_event_registrations_status" ADD VALUE 'refunded';
  CREATE TABLE "events_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_events_payment_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_events_v_version_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__events_v_version_payment_methods",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "event_registrations" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "events" ADD COLUMN "max_guests" numeric;
  ALTER TABLE "events" ADD COLUMN "price_kr" numeric;
  ALTER TABLE "events" ADD COLUMN "vat_rate" "enum_events_vat_rate" DEFAULT '25';
  ALTER TABLE "_events_v" ADD COLUMN "version_max_guests" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_price_kr" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_vat_rate" "enum__events_v_version_vat_rate" DEFAULT '25';
  ALTER TABLE "event_registrations" ADD COLUMN "source" "enum_event_registrations_source" DEFAULT 'online' NOT NULL;
  ALTER TABLE "event_registrations" ADD COLUMN "guest_of_id" integer;
  ALTER TABLE "event_registrations" ADD COLUMN "reminder_sent_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_provider" "enum_event_registrations_payment_provider";
  ALTER TABLE "event_registrations" ADD COLUMN "payment_amount_kr" numeric;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_reference" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_stripe_payment_intent_id" varchar;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_expires_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_paid_at" timestamp(3) with time zone;
  ALTER TABLE "event_registrations" ADD COLUMN "payment_refunded_at" timestamp(3) with time zone;
  ALTER TABLE "events_payment_methods" ADD CONSTRAINT "events_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_payment_methods" ADD CONSTRAINT "_events_v_version_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_payment_methods_order_idx" ON "events_payment_methods" USING btree ("order");
  CREATE INDEX "events_payment_methods_parent_idx" ON "events_payment_methods" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_payment_methods_order_idx" ON "_events_v_version_payment_methods" USING btree ("order");
  CREATE INDEX "_events_v_version_payment_methods_parent_idx" ON "_events_v_version_payment_methods" USING btree ("parent_id");
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_guest_of_id_event_registrations_id_fk" FOREIGN KEY ("guest_of_id") REFERENCES "public"."event_registrations"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "event_registrations_guest_of_idx" ON "event_registrations" USING btree ("guest_of_id");
  CREATE INDEX "event_registrations_payment_payment_reference_idx" ON "event_registrations" USING btree ("payment_reference");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_payment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_payment_methods" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_payment_methods" CASCADE;
  DROP TABLE "_events_v_version_payment_methods" CASCADE;
  ALTER TABLE "event_registrations" DROP CONSTRAINT "event_registrations_guest_of_id_event_registrations_id_fk";
  
  DROP INDEX "event_registrations_guest_of_idx";
  DROP INDEX "event_registrations_payment_payment_reference_idx";
  ALTER TABLE "event_registrations" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "events" DROP COLUMN "max_guests";
  ALTER TABLE "events" DROP COLUMN "price_kr";
  ALTER TABLE "events" DROP COLUMN "vat_rate";
  ALTER TABLE "_events_v" DROP COLUMN "version_max_guests";
  ALTER TABLE "_events_v" DROP COLUMN "version_price_kr";
  ALTER TABLE "_events_v" DROP COLUMN "version_vat_rate";
  ALTER TABLE "event_registrations" DROP COLUMN "source";
  ALTER TABLE "event_registrations" DROP COLUMN "guest_of_id";
  ALTER TABLE "event_registrations" DROP COLUMN "reminder_sent_at";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_provider";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_amount_kr";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_reference";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_stripe_payment_intent_id";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_expires_at";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_paid_at";
  ALTER TABLE "event_registrations" DROP COLUMN "payment_refunded_at";
  ALTER TABLE "public"."event_registrations" ALTER COLUMN "status" SET DATA TYPE text;
  DROP TYPE "public"."enum_event_registrations_status";
  CREATE TYPE "public"."enum_event_registrations_status" AS ENUM('registered', 'waitlisted', 'checked_in', 'cancelled');
  ALTER TABLE "public"."event_registrations" ALTER COLUMN "status" SET DATA TYPE "public"."enum_event_registrations_status" USING "status"::"public"."enum_event_registrations_status";
  DROP TYPE "public"."enum_events_payment_methods";
  DROP TYPE "public"."enum_events_vat_rate";
  DROP TYPE "public"."enum__events_v_version_payment_methods";
  DROP TYPE "public"."enum__events_v_version_vat_rate";
  DROP TYPE "public"."enum_event_registrations_source";
  DROP TYPE "public"."enum_event_registrations_payment_provider";`)
}
