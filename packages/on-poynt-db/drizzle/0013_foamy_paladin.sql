CREATE TYPE "planner"."planner_conversation_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "planner"."planner_conversation_type" AS ENUM('channel', 'group', 'dm');--> statement-breakpoint
CREATE TABLE "planner"."planner_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "planner"."planner_conversation_type" DEFAULT 'channel' NOT NULL,
	"name" text,
	"slug" text,
	"description" text,
	"icon" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_conversation_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_conversation_member" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "planner"."planner_conversation_member_role" DEFAULT 'member' NOT NULL,
	"notifications_muted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_conversation_read" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_message_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"url" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_conversation" ADD CONSTRAINT "planner_conversation_created_by_id_planner_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "planner"."planner_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_conversation_member" ADD CONSTRAINT "planner_conversation_member_conversation_id_planner_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "planner"."planner_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_conversation_member" ADD CONSTRAINT "planner_conversation_member_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_conversation_read" ADD CONSTRAINT "planner_conversation_read_conversation_id_planner_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "planner"."planner_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_conversation_read" ADD CONSTRAINT "planner_conversation_read_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_message" ADD CONSTRAINT "planner_message_conversation_id_planner_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "planner"."planner_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_message" ADD CONSTRAINT "planner_message_author_id_planner_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_message_attachment" ADD CONSTRAINT "planner_message_attachment_message_id_planner_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "planner"."planner_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_conversation_type_idx" ON "planner"."planner_conversation" USING btree ("type");--> statement-breakpoint
CREATE INDEX "planner_conversation_slug_idx" ON "planner"."planner_conversation" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_conversation_member_unique_idx" ON "planner"."planner_conversation_member" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "planner_conversation_member_conversation_idx" ON "planner"."planner_conversation_member" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "planner_conversation_member_user_idx" ON "planner"."planner_conversation_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "planner_conversation_read_unique_idx" ON "planner"."planner_conversation_read" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "planner_conversation_read_user_idx" ON "planner"."planner_conversation_read" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_message_conversation_idx" ON "planner"."planner_message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "planner_message_author_idx" ON "planner"."planner_message" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "planner_message_attachment_message_idx" ON "planner"."planner_message_attachment" USING btree ("message_id");