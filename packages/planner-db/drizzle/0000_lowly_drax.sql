CREATE TYPE "public"."planner_audience_type" AS ENUM('b2b', 'b2c', 'both');--> statement-breakpoint
CREATE TYPE "public"."planner_company_size" AS ENUM('solo', 'small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."planner_subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."planner_subscription_tier" AS ENUM('free', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."planner_workspace_role" AS ENUM('owner', 'admin', 'member', 'client');--> statement-breakpoint
CREATE TABLE "planner_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "planner_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "planner_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "planner_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_industry" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"prompt_hints" text,
	"related_keywords" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_prompt_template" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"template" text NOT NULL,
	"variables" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_decline_generator_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_result_id" text NOT NULL,
	"variant_copied" text,
	"worked" boolean,
	"custom_version" text,
	"feedback_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_marketing_plan_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_result_id" text NOT NULL,
	"type" text NOT NULL,
	"month_index" text,
	"task_index" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier" "planner_subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "planner_subscription_status" DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_subscription_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "planner_tool_result" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"tool_id" text NOT NULL,
	"title" text,
	"inputs" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"active_workspace_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "planner_workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "planner_workspace_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "planner_workspace_role" DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_workspace_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "planner_workspace_member" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "planner_workspace_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_workspace_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"industry_id" text,
	"target_audience" text,
	"audience_type" "planner_audience_type",
	"company_size" "planner_company_size",
	"goals" jsonb,
	"custom_context" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_workspace_profile_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "planner_account" ADD CONSTRAINT "planner_account_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_session" ADD CONSTRAINT "planner_session_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_decline_generator_feedback" ADD CONSTRAINT "planner_decline_generator_feedback_tool_result_id_planner_tool_result_id_fk" FOREIGN KEY ("tool_result_id") REFERENCES "public"."planner_tool_result"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_marketing_plan_progress" ADD CONSTRAINT "planner_marketing_plan_progress_tool_result_id_planner_tool_result_id_fk" FOREIGN KEY ("tool_result_id") REFERENCES "public"."planner_tool_result"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_subscription" ADD CONSTRAINT "planner_subscription_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_tool_result" ADD CONSTRAINT "planner_tool_result_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."planner_workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_user_preferences" ADD CONSTRAINT "planner_user_preferences_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_user_preferences" ADD CONSTRAINT "planner_user_preferences_active_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."planner_workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_invitation" ADD CONSTRAINT "planner_workspace_invitation_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."planner_workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_invitation" ADD CONSTRAINT "planner_workspace_invitation_invited_by_id_planner_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_member" ADD CONSTRAINT "planner_workspace_member_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."planner_workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_member" ADD CONSTRAINT "planner_workspace_member_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_profile" ADD CONSTRAINT "planner_workspace_profile_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."planner_workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_workspace_profile" ADD CONSTRAINT "planner_workspace_profile_industry_id_planner_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."planner_industry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_account_userId_idx" ON "planner_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_session_userId_idx" ON "planner_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_verification_identifier_idx" ON "planner_verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "planner_decline_feedback_tool_result_idx" ON "planner_decline_generator_feedback" USING btree ("tool_result_id");--> statement-breakpoint
CREATE INDEX "planner_marketing_plan_progress_tool_result_idx" ON "planner_marketing_plan_progress" USING btree ("tool_result_id");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_marketing_plan_progress_unique_task" ON "planner_marketing_plan_progress" USING btree ("tool_result_id","type","month_index","task_index");--> statement-breakpoint
CREATE INDEX "planner_subscription_user_idx" ON "planner_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_subscription_stripe_customer_idx" ON "planner_subscription" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "planner_tool_result_workspace_idx" ON "planner_tool_result" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "planner_tool_result_tool_idx" ON "planner_tool_result" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "planner_tool_result_created_idx" ON "planner_tool_result" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "planner_workspace_slug_idx" ON "planner_workspace" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "planner_workspace_invitation_token_idx" ON "planner_workspace_invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "planner_workspace_invitation_email_idx" ON "planner_workspace_invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_workspace_member_unique_idx" ON "planner_workspace_member" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "planner_workspace_member_workspace_idx" ON "planner_workspace_member" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "planner_workspace_member_user_idx" ON "planner_workspace_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_workspace_profile_workspace_idx" ON "planner_workspace_profile" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "planner_workspace_profile_industry_idx" ON "planner_workspace_profile" USING btree ("industry_id");