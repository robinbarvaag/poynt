CREATE TYPE "planner"."planner_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "planner"."planner_membership_application" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "planner"."planner_application_status" DEFAULT 'pending' NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"canonical_email" text NOT NULL,
	"company_name" text,
	"org_number" text,
	"invoice_email" text,
	"revenue_over_1m" text,
	"ehf_invoice" text,
	"invoice_split" text,
	"invoice_notes" text,
	"about_company" text,
	"industry_id" text,
	"company_size" "planner"."planner_company_size",
	"audience_type" "planner"."planner_audience_type",
	"target_audience" text,
	"raw_submission" jsonb,
	"form_submission_id" text,
	"approved_tier" "planner"."planner_subscription_tier",
	"user_id" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_membership_application" ADD CONSTRAINT "planner_membership_application_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_membership_application_status_idx" ON "planner"."planner_membership_application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "planner_membership_application_email_idx" ON "planner"."planner_membership_application" USING btree ("canonical_email");--> statement-breakpoint
CREATE INDEX "planner_membership_application_created_idx" ON "planner"."planner_membership_application" USING btree ("created_at");