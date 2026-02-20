import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_membership_tier" AS ENUM('community', 'community_ai');
  CREATE TYPE "public"."enum_pages_blocks_form_block_variant" AS ENUM('default', 'card', 'bordered');
  CREATE TYPE "public"."enum_pages_blocks_form_block_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_pages_blocks_form_block_max_width" AS ENUM('sm', 'md', 'lg', 'full');
  CREATE TYPE "public"."enum_pages_blocks_product_archive_selection_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_pages_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  CREATE TYPE "public"."enum_pages_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  CREATE TYPE "public"."enum_pages_blocks_services_archive_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_form_block_variant" AS ENUM('default', 'card', 'bordered');
  CREATE TYPE "public"."enum__pages_v_blocks_form_block_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__pages_v_blocks_form_block_max_width" AS ENUM('sm', 'md', 'lg', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_selection_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_services_archive_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum_services_price_type" AS ENUM('fixed', 'from', 'monthly', 'contact');
  CREATE TYPE "public"."enum_homepage_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen', 'gradient');
  CREATE TYPE "public"."enum_homepage_blocks_form_block_variant" AS ENUM('default', 'card', 'bordered');
  CREATE TYPE "public"."enum_homepage_blocks_form_block_alignment" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_homepage_blocks_form_block_max_width" AS ENUM('sm', 'md', 'lg', 'full');
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_selection_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  CREATE TYPE "public"."enum_homepage_blocks_services_archive_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum_homepage_blocks_testimonials_layout" AS ENUM('cards', 'slider', 'quote');
  CREATE TYPE "public"."enum_homepage_blocks_cta_section_variant" AS ENUM('simple', 'colored', 'image');
  CREATE TYPE "public"."enum_homepage_blocks_spotify_embed_embed_type" AS ENUM('episode', 'show', 'playlist');
  CREATE TYPE "public"."enum_homepage_blocks_spotify_embed_height" AS ENUM('compact', 'standard', 'large');
  CREATE TYPE "public"."enum_homepage_blocks_spotify_embed_theme" AS ENUM('auto', 'light', 'dark');
  ALTER TYPE "public"."enum_products_type" ADD VALUE 'membership';
  ALTER TYPE "public"."enum_pages_blocks_hero_variant" ADD VALUE 'gradient';
  ALTER TYPE "public"."enum__pages_v_blocks_hero_variant" ADD VALUE 'gradient';
  CREATE TABLE "products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "pages_blocks_hero_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"variant" "enum_pages_blocks_form_block_variant" DEFAULT 'default',
  	"alignment" "enum_pages_blocks_form_block_alignment" DEFAULT 'left',
  	"max_width" "enum_pages_blocks_form_block_max_width" DEFAULT 'md',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_product_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"selection_mode" "enum_pages_blocks_product_archive_selection_mode" DEFAULT 'auto',
  	"filter_by_type" "enum_pages_blocks_product_archive_filter_by_type" DEFAULT 'all',
  	"limit" numeric DEFAULT 8,
  	"layout" "enum_pages_blocks_product_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_podcast_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 6,
  	"show_more_link" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_pages_blocks_services_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"title" varchar,
  	"description" varchar,
  	"variant" "enum__pages_v_blocks_form_block_variant" DEFAULT 'default',
  	"alignment" "enum__pages_v_blocks_form_block_alignment" DEFAULT 'left',
  	"max_width" "enum__pages_v_blocks_form_block_max_width" DEFAULT 'md',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_product_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"selection_mode" "enum__pages_v_blocks_product_archive_selection_mode" DEFAULT 'auto',
  	"filter_by_type" "enum__pages_v_blocks_product_archive_filter_by_type" DEFAULT 'all',
  	"limit" numeric DEFAULT 8,
  	"layout" "enum__pages_v_blocks_product_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_podcast_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 6,
  	"show_more_link" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_services_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__pages_v_blocks_services_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "podcasts_guests" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "podcasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"content" jsonb,
  	"spotify_url" varchar NOT NULL,
  	"cover_image_id" integer,
  	"duration" varchar,
  	"episode_number" numeric,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcasts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"image_id" integer,
  	"short_description" varchar NOT NULL,
  	"content" jsonb,
  	"price_type" "enum_services_price_type" DEFAULT 'fixed' NOT NULL,
  	"price" numeric,
  	"includes_vat" boolean DEFAULT true,
  	"cta_text" varchar DEFAULT 'Les mer',
  	"cta_link" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_homepage_blocks_hero_variant" DEFAULT 'centered',
  	"title" varchar NOT NULL,
  	"subtitle" jsonb,
  	"tags_label" varchar,
  	"image_id" integer,
  	"primary_cta_text" varchar,
  	"primary_cta_url" varchar,
  	"secondary_cta_text" varchar,
  	"secondary_cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rich_text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"variant" "enum_homepage_blocks_form_block_variant" DEFAULT 'default',
  	"alignment" "enum_homepage_blocks_form_block_alignment" DEFAULT 'left',
  	"max_width" "enum_homepage_blocks_form_block_max_width" DEFAULT 'md',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_podcast_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"limit" numeric DEFAULT 6,
  	"show_more_link" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_product_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"selection_mode" "enum_homepage_blocks_product_archive_selection_mode" DEFAULT 'auto',
  	"filter_by_type" "enum_homepage_blocks_product_archive_filter_by_type" DEFAULT 'all',
  	"limit" numeric DEFAULT 8,
  	"layout" "enum_homepage_blocks_product_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_services_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_homepage_blocks_services_archive_layout" DEFAULT 'grid',
  	"show_more_link" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_testimonials_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"role" varchar,
  	"company" varchar,
  	"logo_id" integer,
  	"avatar_id" integer,
  	"rating" numeric
  );
  
  CREATE TABLE "homepage_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"layout" "enum_homepage_blocks_testimonials_layout" DEFAULT 'cards',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_cta_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_homepage_blocks_cta_section_variant" DEFAULT 'simple',
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"background_image_id" integer,
  	"primary_cta_text" varchar NOT NULL,
  	"primary_cta_url" varchar NOT NULL,
  	"secondary_cta_text" varchar,
  	"secondary_cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_spotify_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"embed_type" "enum_homepage_blocks_spotify_embed_embed_type" DEFAULT 'episode' NOT NULL,
  	"spotify_url" varchar NOT NULL,
  	"title" varchar,
  	"height" "enum_homepage_blocks_spotify_embed_height" DEFAULT 'compact',
  	"theme" "enum_homepage_blocks_spotify_embed_theme" DEFAULT 'auto',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "blogpage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Blogg' NOT NULL,
  	"description" varchar,
  	"empty_state_text" varchar DEFAULT 'Ingen publiserte innlegg ennå. Kom tilbake snart!',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "podcastpage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_title" varchar DEFAULT 'Podkast',
  	"hero_description" varchar DEFAULT 'Lytt til alle episoder',
  	"hero_image_id" integer,
  	"empty_state_text" varchar DEFAULT 'Ingen episoder publisert ennå. Kom tilbake snart!',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "productspage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_title" varchar DEFAULT 'Produkter',
  	"hero_description" varchar DEFAULT 'Utforsk våre digitale produkter',
  	"hero_image_id" integer,
  	"empty_state_text" varchar DEFAULT 'Ingen produkter tilgjengelig for øyeblikket.',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "servicespage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_title" varchar DEFAULT 'Tjenester',
  	"hero_description" varchar DEFAULT 'Se hva vi kan hjelpe deg med',
  	"hero_image_id" integer,
  	"empty_state_text" varchar DEFAULT 'Ingen tjenester tilgjengelig for øyeblikket.',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "product_settings_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "product_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_features_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_features_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_posts_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_blog_posts_v_version_categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "pages_blocks_archive" CASCADE;
  DROP TABLE "pages_blocks_features_features" CASCADE;
  DROP TABLE "pages_blocks_features" CASCADE;
  DROP TABLE "_pages_v_blocks_archive" CASCADE;
  DROP TABLE "_pages_v_blocks_features_features" CASCADE;
  DROP TABLE "_pages_v_blocks_features" CASCADE;
  DROP TABLE "blog_posts_categories" CASCADE;
  DROP TABLE "_blog_posts_v_version_categories" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_image_id_media_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
  
  DROP INDEX "products_image_idx";
  DROP INDEX "orders_user_idx";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE jsonb;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE jsonb;
  ALTER TABLE "header_nav_items_sub_items" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "users" ADD COLUMN "first_name" varchar;
  ALTER TABLE "users" ADD COLUMN "last_name" varchar;
  ALTER TABLE "users" ADD COLUMN "avatar_id" integer;
  ALTER TABLE "users" ADD COLUMN "bio" varchar;
  ALTER TABLE "products" ADD COLUMN "recurring_interval" numeric;
  ALTER TABLE "products" ADD COLUMN "membership_tier" "enum_products_membership_tier";
  ALTER TABLE "products" ADD COLUMN "short_description" varchar;
  ALTER TABLE "products" ADD COLUMN "featured_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "compare_at_price" numeric;
  ALTER TABLE "products" ADD COLUMN "benefits" jsonb;
  ALTER TABLE "orders" ADD COLUMN "customer_email" varchar NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "customer_name" varchar;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "tags_label" varchar;
  ALTER TABLE "pages_blocks_testimonials_testimonials" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "tags_label" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" ADD COLUMN "logo_id" integer;
  ALTER TABLE "blog_posts_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "_blog_posts_v_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "media" ADD COLUMN "is_private" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcasts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "header_nav_items_sub_items" ADD COLUMN "blog_post_id" integer;
  ALTER TABLE "header_nav_items_sub_items" ADD COLUMN "product_id" integer;
  ALTER TABLE "header_nav_items_sub_items" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "header_nav_items" ADD COLUMN "blog_post_id" integer;
  ALTER TABLE "header_nav_items" ADD COLUMN "product_id" integer;
  ALTER TABLE "header_nav_items" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_tags" ADD CONSTRAINT "pages_blocks_hero_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_product_archive" ADD CONSTRAINT "pages_blocks_product_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_podcast_archive" ADD CONSTRAINT "pages_blocks_podcast_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_archive" ADD CONSTRAINT "pages_blocks_services_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_tags" ADD CONSTRAINT "_pages_v_blocks_hero_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_product_archive" ADD CONSTRAINT "_pages_v_blocks_product_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_podcast_archive" ADD CONSTRAINT "_pages_v_blocks_podcast_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_services_archive" ADD CONSTRAINT "_pages_v_blocks_services_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcasts_guests" ADD CONSTRAINT "podcasts_guests_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcasts_rels" ADD CONSTRAINT "podcasts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcasts_rels" ADD CONSTRAINT "podcasts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero_tags" ADD CONSTRAINT "homepage_blocks_hero_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_content" ADD CONSTRAINT "homepage_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_media" ADD CONSTRAINT "homepage_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_media" ADD CONSTRAINT "homepage_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_form_block" ADD CONSTRAINT "homepage_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_form_block" ADD CONSTRAINT "homepage_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_podcast_archive" ADD CONSTRAINT "homepage_blocks_podcast_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_archive" ADD CONSTRAINT "homepage_blocks_product_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_services_archive" ADD CONSTRAINT "homepage_blocks_services_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta_section" ADD CONSTRAINT "homepage_blocks_cta_section_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_cta_section" ADD CONSTRAINT "homepage_blocks_cta_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_spotify_embed" ADD CONSTRAINT "homepage_blocks_spotify_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogpage" ADD CONSTRAINT "blogpage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcastpage" ADD CONSTRAINT "podcastpage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcastpage" ADD CONSTRAINT "podcastpage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productspage" ADD CONSTRAINT "productspage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productspage" ADD CONSTRAINT "productspage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "servicespage" ADD CONSTRAINT "servicespage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "servicespage" ADD CONSTRAINT "servicespage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_settings_benefits" ADD CONSTRAINT "product_settings_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "pages_blocks_hero_tags_order_idx" ON "pages_blocks_hero_tags" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_tags_parent_id_idx" ON "pages_blocks_hero_tags" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_block_order_idx" ON "pages_blocks_form_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_block_parent_id_idx" ON "pages_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_block_path_idx" ON "pages_blocks_form_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_block_form_idx" ON "pages_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "pages_blocks_product_archive_order_idx" ON "pages_blocks_product_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_product_archive_parent_id_idx" ON "pages_blocks_product_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_product_archive_path_idx" ON "pages_blocks_product_archive" USING btree ("_path");
  CREATE INDEX "pages_blocks_podcast_archive_order_idx" ON "pages_blocks_podcast_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_podcast_archive_parent_id_idx" ON "pages_blocks_podcast_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_podcast_archive_path_idx" ON "pages_blocks_podcast_archive" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_archive_order_idx" ON "pages_blocks_services_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_archive_parent_id_idx" ON "pages_blocks_services_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_archive_path_idx" ON "pages_blocks_services_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_tags_order_idx" ON "_pages_v_blocks_hero_tags" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_tags_parent_id_idx" ON "_pages_v_blocks_hero_tags" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_block_order_idx" ON "_pages_v_blocks_form_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_block_parent_id_idx" ON "_pages_v_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_block_path_idx" ON "_pages_v_blocks_form_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_block_form_idx" ON "_pages_v_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "_pages_v_blocks_product_archive_order_idx" ON "_pages_v_blocks_product_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_product_archive_parent_id_idx" ON "_pages_v_blocks_product_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_product_archive_path_idx" ON "_pages_v_blocks_product_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_podcast_archive_order_idx" ON "_pages_v_blocks_podcast_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_podcast_archive_parent_id_idx" ON "_pages_v_blocks_podcast_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_podcast_archive_path_idx" ON "_pages_v_blocks_podcast_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_services_archive_order_idx" ON "_pages_v_blocks_services_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_archive_parent_id_idx" ON "_pages_v_blocks_services_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_archive_path_idx" ON "_pages_v_blocks_services_archive" USING btree ("_path");
  CREATE INDEX "podcasts_guests_order_idx" ON "podcasts_guests" USING btree ("_order");
  CREATE INDEX "podcasts_guests_parent_id_idx" ON "podcasts_guests" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "podcasts_slug_idx" ON "podcasts" USING btree ("slug");
  CREATE INDEX "podcasts_cover_image_idx" ON "podcasts" USING btree ("cover_image_id");
  CREATE INDEX "podcasts_updated_at_idx" ON "podcasts" USING btree ("updated_at");
  CREATE INDEX "podcasts_created_at_idx" ON "podcasts" USING btree ("created_at");
  CREATE INDEX "podcasts_rels_order_idx" ON "podcasts_rels" USING btree ("order");
  CREATE INDEX "podcasts_rels_parent_idx" ON "podcasts_rels" USING btree ("parent_id");
  CREATE INDEX "podcasts_rels_path_idx" ON "podcasts_rels" USING btree ("path");
  CREATE INDEX "podcasts_rels_categories_id_idx" ON "podcasts_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_image_idx" ON "services" USING btree ("image_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_categories_id_idx" ON "services_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "homepage_blocks_hero_tags_order_idx" ON "homepage_blocks_hero_tags" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_tags_parent_id_idx" ON "homepage_blocks_hero_tags" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_image_idx" ON "homepage_blocks_hero" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_content_order_idx" ON "homepage_blocks_content" USING btree ("_order");
  CREATE INDEX "homepage_blocks_content_parent_id_idx" ON "homepage_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_content_path_idx" ON "homepage_blocks_content" USING btree ("_path");
  CREATE INDEX "homepage_blocks_media_order_idx" ON "homepage_blocks_media" USING btree ("_order");
  CREATE INDEX "homepage_blocks_media_parent_id_idx" ON "homepage_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_media_path_idx" ON "homepage_blocks_media" USING btree ("_path");
  CREATE INDEX "homepage_blocks_media_media_idx" ON "homepage_blocks_media" USING btree ("media_id");
  CREATE INDEX "homepage_blocks_form_block_order_idx" ON "homepage_blocks_form_block" USING btree ("_order");
  CREATE INDEX "homepage_blocks_form_block_parent_id_idx" ON "homepage_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_form_block_path_idx" ON "homepage_blocks_form_block" USING btree ("_path");
  CREATE INDEX "homepage_blocks_form_block_form_idx" ON "homepage_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "homepage_blocks_podcast_archive_order_idx" ON "homepage_blocks_podcast_archive" USING btree ("_order");
  CREATE INDEX "homepage_blocks_podcast_archive_parent_id_idx" ON "homepage_blocks_podcast_archive" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_podcast_archive_path_idx" ON "homepage_blocks_podcast_archive" USING btree ("_path");
  CREATE INDEX "homepage_blocks_product_archive_order_idx" ON "homepage_blocks_product_archive" USING btree ("_order");
  CREATE INDEX "homepage_blocks_product_archive_parent_id_idx" ON "homepage_blocks_product_archive" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_product_archive_path_idx" ON "homepage_blocks_product_archive" USING btree ("_path");
  CREATE INDEX "homepage_blocks_services_archive_order_idx" ON "homepage_blocks_services_archive" USING btree ("_order");
  CREATE INDEX "homepage_blocks_services_archive_parent_id_idx" ON "homepage_blocks_services_archive" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_services_archive_path_idx" ON "homepage_blocks_services_archive" USING btree ("_path");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_order_idx" ON "homepage_blocks_testimonials_testimonials" USING btree ("_order");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_parent_id_idx" ON "homepage_blocks_testimonials_testimonials" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_logo_idx" ON "homepage_blocks_testimonials_testimonials" USING btree ("logo_id");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_avatar_idx" ON "homepage_blocks_testimonials_testimonials" USING btree ("avatar_id");
  CREATE INDEX "homepage_blocks_testimonials_order_idx" ON "homepage_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "homepage_blocks_testimonials_parent_id_idx" ON "homepage_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_testimonials_path_idx" ON "homepage_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta_section_order_idx" ON "homepage_blocks_cta_section" USING btree ("_order");
  CREATE INDEX "homepage_blocks_cta_section_parent_id_idx" ON "homepage_blocks_cta_section" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_cta_section_path_idx" ON "homepage_blocks_cta_section" USING btree ("_path");
  CREATE INDEX "homepage_blocks_cta_section_background_image_idx" ON "homepage_blocks_cta_section" USING btree ("background_image_id");
  CREATE INDEX "homepage_blocks_spotify_embed_order_idx" ON "homepage_blocks_spotify_embed" USING btree ("_order");
  CREATE INDEX "homepage_blocks_spotify_embed_parent_id_idx" ON "homepage_blocks_spotify_embed" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_spotify_embed_path_idx" ON "homepage_blocks_spotify_embed" USING btree ("_path");
  CREATE INDEX "homepage_meta_meta_image_idx" ON "homepage" USING btree ("meta_image_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_products_id_idx" ON "homepage_rels" USING btree ("products_id");
  CREATE INDEX "blogpage_meta_meta_image_idx" ON "blogpage" USING btree ("meta_image_id");
  CREATE INDEX "podcastpage_hero_hero_image_idx" ON "podcastpage" USING btree ("hero_image_id");
  CREATE INDEX "podcastpage_meta_meta_image_idx" ON "podcastpage" USING btree ("meta_image_id");
  CREATE INDEX "productspage_hero_hero_image_idx" ON "productspage" USING btree ("hero_image_id");
  CREATE INDEX "productspage_meta_meta_image_idx" ON "productspage" USING btree ("meta_image_id");
  CREATE INDEX "servicespage_hero_hero_image_idx" ON "servicespage" USING btree ("hero_image_id");
  CREATE INDEX "servicespage_meta_meta_image_idx" ON "servicespage" USING btree ("meta_image_id");
  CREATE INDEX "product_settings_benefits_order_idx" ON "product_settings_benefits" USING btree ("_order");
  CREATE INDEX "product_settings_benefits_parent_id_idx" ON "product_settings_benefits" USING btree ("_parent_id");
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_testimonials_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" ADD CONSTRAINT "_pages_v_blocks_testimonials_testimonials_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcasts_fk" FOREIGN KEY ("podcasts_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_sub_items" ADD CONSTRAINT "header_nav_items_sub_items_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "header_nav_items_sub_items" ADD CONSTRAINT "header_nav_items_sub_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "products_featured_image_idx" ON "products" USING btree ("featured_image_id");
  CREATE INDEX "pages_blocks_testimonials_testimonials_logo_idx" ON "pages_blocks_testimonials_testimonials" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_testimonials_testimonials_logo_idx" ON "_pages_v_blocks_testimonials_testimonials" USING btree ("logo_id");
  CREATE INDEX "blog_posts_rels_categories_id_idx" ON "blog_posts_rels" USING btree ("categories_id");
  CREATE INDEX "_blog_posts_v_rels_categories_id_idx" ON "_blog_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_podcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("podcasts_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "header_nav_items_sub_items_blog_post_idx" ON "header_nav_items_sub_items" USING btree ("blog_post_id");
  CREATE INDEX "header_nav_items_sub_items_product_idx" ON "header_nav_items_sub_items" USING btree ("product_id");
  CREATE INDEX "header_nav_items_blog_post_idx" ON "header_nav_items" USING btree ("blog_post_id");
  CREATE INDEX "header_nav_items_product_idx" ON "header_nav_items" USING btree ("product_id");
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "stripe_customer_id";
  ALTER TABLE "products" DROP COLUMN "image_id";
  ALTER TABLE "orders" DROP COLUMN "user_id";
  ALTER TABLE "public"."header_nav_items_sub_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_header_nav_items_sub_items_link_type";
  CREATE TYPE "public"."enum_header_nav_items_sub_items_link_type" AS ENUM('custom', 'page', 'blog', 'product');
  ALTER TABLE "public"."header_nav_items_sub_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_header_nav_items_sub_items_link_type" USING "link_type"::"public"."enum_header_nav_items_sub_items_link_type";
  ALTER TABLE "public"."header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_header_nav_items_link_type";
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('custom', 'page', 'blog', 'product');
  ALTER TABLE "public"."header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_header_nav_items_link_type" USING "link_type"::"public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_pages_blocks_archive_populate_by";
  DROP TYPE "public"."enum_pages_blocks_features_features_icon";
  DROP TYPE "public"."enum_pages_blocks_features_layout";
  DROP TYPE "public"."enum__pages_v_blocks_archive_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_features_features_icon";
  DROP TYPE "public"."enum__pages_v_blocks_features_layout";
  DROP TYPE "public"."enum_blog_posts_categories_category";
  DROP TYPE "public"."enum__blog_posts_v_version_categories_category";`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'customer');
  CREATE TYPE "public"."enum_pages_blocks_archive_populate_by" AS ENUM('selection', 'all');
  CREATE TYPE "public"."enum_pages_blocks_features_features_icon" AS ENUM('book', 'video', 'check', 'star', 'rocket', 'shield', 'heart', 'message', 'chart', 'clock');
  CREATE TYPE "public"."enum_pages_blocks_features_layout" AS ENUM('grid-3', 'grid-2', 'grid-4', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_populate_by" AS ENUM('selection', 'all');
  CREATE TYPE "public"."enum__pages_v_blocks_features_features_icon" AS ENUM('book', 'video', 'check', 'star', 'rocket', 'shield', 'heart', 'message', 'chart', 'clock');
  CREATE TYPE "public"."enum__pages_v_blocks_features_layout" AS ENUM('grid-3', 'grid-2', 'grid-4', 'list');
  CREATE TYPE "public"."enum_blog_posts_categories_category" AS ENUM('instagram', 'linkedin', 'pinterest', 'markedsforing', 'sosiale-medier', 'tips');
  CREATE TYPE "public"."enum__blog_posts_v_version_categories_category" AS ENUM('instagram', 'linkedin', 'pinterest', 'markedsforing', 'sosiale-medier', 'tips');
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"orders_id" integer
  );
  
  CREATE TABLE "pages_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum_pages_blocks_archive_populate_by" DEFAULT 'selection',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_features_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_features_features_icon",
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum_pages_blocks_features_layout" DEFAULT 'grid-3',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum__pages_v_blocks_archive_populate_by" DEFAULT 'selection',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_features_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_features_features_icon",
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"layout" "enum__pages_v_blocks_features_layout" DEFAULT 'grid-3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "blog_posts_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_blog_posts_categories_category"
  );
  
  CREATE TABLE "_blog_posts_v_version_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum__blog_posts_v_version_categories_category",
  	"_uuid" varchar
  );
  
  ALTER TABLE "products_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_form_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_product_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_podcast_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_form_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_product_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_podcast_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_services_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcasts_guests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcasts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcasts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_form_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_podcast_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_product_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_services_archive" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_testimonials_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_cta_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_spotify_embed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogpage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcastpage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "productspage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "servicespage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_settings_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "product_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "pages_blocks_hero_tags" CASCADE;
  DROP TABLE "pages_blocks_form_block" CASCADE;
  DROP TABLE "pages_blocks_product_archive" CASCADE;
  DROP TABLE "pages_blocks_podcast_archive" CASCADE;
  DROP TABLE "pages_blocks_services_archive" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_tags" CASCADE;
  DROP TABLE "_pages_v_blocks_form_block" CASCADE;
  DROP TABLE "_pages_v_blocks_product_archive" CASCADE;
  DROP TABLE "_pages_v_blocks_podcast_archive" CASCADE;
  DROP TABLE "_pages_v_blocks_services_archive" CASCADE;
  DROP TABLE "podcasts_guests" CASCADE;
  DROP TABLE "podcasts" CASCADE;
  DROP TABLE "podcasts_rels" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "homepage_blocks_hero_tags" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_content" CASCADE;
  DROP TABLE "homepage_blocks_media" CASCADE;
  DROP TABLE "homepage_blocks_form_block" CASCADE;
  DROP TABLE "homepage_blocks_podcast_archive" CASCADE;
  DROP TABLE "homepage_blocks_product_archive" CASCADE;
  DROP TABLE "homepage_blocks_services_archive" CASCADE;
  DROP TABLE "homepage_blocks_testimonials_testimonials" CASCADE;
  DROP TABLE "homepage_blocks_testimonials" CASCADE;
  DROP TABLE "homepage_blocks_cta_section" CASCADE;
  DROP TABLE "homepage_blocks_spotify_embed" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "blogpage" CASCADE;
  DROP TABLE "podcastpage" CASCADE;
  DROP TABLE "productspage" CASCADE;
  DROP TABLE "servicespage" CASCADE;
  DROP TABLE "product_settings_benefits" CASCADE;
  DROP TABLE "product_settings" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_featured_image_id_media_id_fk";
  
  ALTER TABLE "pages_blocks_testimonials_testimonials" DROP CONSTRAINT "pages_blocks_testimonials_testimonials_logo_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" DROP CONSTRAINT "_pages_v_blocks_testimonials_testimonials_logo_id_media_id_fk";
  
  ALTER TABLE "blog_posts_rels" DROP CONSTRAINT "blog_posts_rels_categories_fk";
  
  ALTER TABLE "_blog_posts_v_rels" DROP CONSTRAINT "_blog_posts_v_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_podcasts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "header_nav_items_sub_items" DROP CONSTRAINT "header_nav_items_sub_items_blog_post_id_blog_posts_id_fk";
  
  ALTER TABLE "header_nav_items_sub_items" DROP CONSTRAINT "header_nav_items_sub_items_product_id_products_id_fk";
  
  ALTER TABLE "header_nav_items" DROP CONSTRAINT "header_nav_items_blog_post_id_blog_posts_id_fk";
  
  ALTER TABLE "header_nav_items" DROP CONSTRAINT "header_nav_items_product_id_products_id_fk";
  
  DROP INDEX "users_avatar_idx";
  DROP INDEX "products_featured_image_idx";
  DROP INDEX "pages_blocks_testimonials_testimonials_logo_idx";
  DROP INDEX "_pages_v_blocks_testimonials_testimonials_logo_idx";
  DROP INDEX "blog_posts_rels_categories_id_idx";
  DROP INDEX "_blog_posts_v_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_podcasts_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "header_nav_items_sub_items_blog_post_idx";
  DROP INDEX "header_nav_items_sub_items_product_idx";
  DROP INDEX "header_nav_items_blog_post_idx";
  DROP INDEX "header_nav_items_product_idx";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE varchar;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE varchar;
  ALTER TABLE "header_nav_items_sub_items" ALTER COLUMN "link_type" SET DEFAULT 'internal';
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'internal';
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'customer' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar;
  ALTER TABLE "products" ADD COLUMN "image_id" integer;
  ALTER TABLE "orders" ADD COLUMN "user_id" integer NOT NULL;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_archive" ADD CONSTRAINT "pages_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_features_features" ADD CONSTRAINT "pages_blocks_features_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_features" ADD CONSTRAINT "pages_blocks_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_archive" ADD CONSTRAINT "_pages_v_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_features_features" ADD CONSTRAINT "_pages_v_blocks_features_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_features" ADD CONSTRAINT "_pages_v_blocks_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_categories" ADD CONSTRAINT "blog_posts_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_version_categories" ADD CONSTRAINT "_blog_posts_v_version_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_blog_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_orders_id_idx" ON "users_rels" USING btree ("orders_id");
  CREATE INDEX "pages_blocks_archive_order_idx" ON "pages_blocks_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_archive_parent_id_idx" ON "pages_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_archive_path_idx" ON "pages_blocks_archive" USING btree ("_path");
  CREATE INDEX "pages_blocks_features_features_order_idx" ON "pages_blocks_features_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_features_features_parent_id_idx" ON "pages_blocks_features_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_features_order_idx" ON "pages_blocks_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_features_parent_id_idx" ON "pages_blocks_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_features_path_idx" ON "pages_blocks_features" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_archive_order_idx" ON "_pages_v_blocks_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_archive_parent_id_idx" ON "_pages_v_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_archive_path_idx" ON "_pages_v_blocks_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_features_features_order_idx" ON "_pages_v_blocks_features_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_features_features_parent_id_idx" ON "_pages_v_blocks_features_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_features_order_idx" ON "_pages_v_blocks_features" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_features_parent_id_idx" ON "_pages_v_blocks_features" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_features_path_idx" ON "_pages_v_blocks_features" USING btree ("_path");
  CREATE INDEX "blog_posts_categories_order_idx" ON "blog_posts_categories" USING btree ("_order");
  CREATE INDEX "blog_posts_categories_parent_id_idx" ON "blog_posts_categories" USING btree ("_parent_id");
  CREATE INDEX "_blog_posts_v_version_categories_order_idx" ON "_blog_posts_v_version_categories" USING btree ("_order");
  CREATE INDEX "_blog_posts_v_version_categories_parent_id_idx" ON "_blog_posts_v_version_categories" USING btree ("_parent_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_image_idx" ON "products" USING btree ("image_id");
  CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
  ALTER TABLE "users" DROP COLUMN "first_name";
  ALTER TABLE "users" DROP COLUMN "last_name";
  ALTER TABLE "users" DROP COLUMN "avatar_id";
  ALTER TABLE "users" DROP COLUMN "bio";
  ALTER TABLE "products" DROP COLUMN "recurring_interval";
  ALTER TABLE "products" DROP COLUMN "membership_tier";
  ALTER TABLE "products" DROP COLUMN "short_description";
  ALTER TABLE "products" DROP COLUMN "featured_image_id";
  ALTER TABLE "products" DROP COLUMN "compare_at_price";
  ALTER TABLE "products" DROP COLUMN "benefits";
  ALTER TABLE "orders" DROP COLUMN "customer_email";
  ALTER TABLE "orders" DROP COLUMN "customer_name";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "tags_label";
  ALTER TABLE "pages_blocks_testimonials_testimonials" DROP COLUMN "logo_id";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "tags_label";
  ALTER TABLE "_pages_v_blocks_testimonials_testimonials" DROP COLUMN "logo_id";
  ALTER TABLE "blog_posts_rels" DROP COLUMN "categories_id";
  ALTER TABLE "_blog_posts_v_rels" DROP COLUMN "categories_id";
  ALTER TABLE "media" DROP COLUMN "is_private";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcasts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "header_nav_items_sub_items" DROP COLUMN "blog_post_id";
  ALTER TABLE "header_nav_items_sub_items" DROP COLUMN "product_id";
  ALTER TABLE "header_nav_items_sub_items" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "header_nav_items" DROP COLUMN "blog_post_id";
  ALTER TABLE "header_nav_items" DROP COLUMN "product_id";
  ALTER TABLE "header_nav_items" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "public"."products" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_type";
  CREATE TYPE "public"."enum_products_type" AS ENUM('course', 'pdf', 'bundle');
  ALTER TABLE "public"."products" ALTER COLUMN "type" SET DATA TYPE "public"."enum_products_type" USING "type"::"public"."enum_products_type";
  ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen');
  ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_hero_variant" USING "variant"::"public"."enum_pages_blocks_hero_variant";
  ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_hero_variant";
  CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen');
  ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__pages_v_blocks_hero_variant" USING "variant"::"public"."enum__pages_v_blocks_hero_variant";
  ALTER TABLE "public"."header_nav_items_sub_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_header_nav_items_sub_items_link_type";
  CREATE TYPE "public"."enum_header_nav_items_sub_items_link_type" AS ENUM('internal', 'external');
  ALTER TABLE "public"."header_nav_items_sub_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_header_nav_items_sub_items_link_type" USING "link_type"::"public"."enum_header_nav_items_sub_items_link_type";
  ALTER TABLE "public"."header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_header_nav_items_link_type";
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('internal', 'external');
  ALTER TABLE "public"."header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_header_nav_items_link_type" USING "link_type"::"public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_products_membership_tier";
  DROP TYPE "public"."enum_pages_blocks_form_block_variant";
  DROP TYPE "public"."enum_pages_blocks_form_block_alignment";
  DROP TYPE "public"."enum_pages_blocks_form_block_max_width";
  DROP TYPE "public"."enum_pages_blocks_product_archive_selection_mode";
  DROP TYPE "public"."enum_pages_blocks_product_archive_filter_by_type";
  DROP TYPE "public"."enum_pages_blocks_product_archive_layout";
  DROP TYPE "public"."enum_pages_blocks_services_archive_layout";
  DROP TYPE "public"."enum__pages_v_blocks_form_block_variant";
  DROP TYPE "public"."enum__pages_v_blocks_form_block_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_form_block_max_width";
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_selection_mode";
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type";
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_layout";
  DROP TYPE "public"."enum__pages_v_blocks_services_archive_layout";
  DROP TYPE "public"."enum_services_price_type";
  DROP TYPE "public"."enum_homepage_blocks_hero_variant";
  DROP TYPE "public"."enum_homepage_blocks_form_block_variant";
  DROP TYPE "public"."enum_homepage_blocks_form_block_alignment";
  DROP TYPE "public"."enum_homepage_blocks_form_block_max_width";
  DROP TYPE "public"."enum_homepage_blocks_product_archive_selection_mode";
  DROP TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type";
  DROP TYPE "public"."enum_homepage_blocks_product_archive_layout";
  DROP TYPE "public"."enum_homepage_blocks_services_archive_layout";
  DROP TYPE "public"."enum_homepage_blocks_testimonials_layout";
  DROP TYPE "public"."enum_homepage_blocks_cta_section_variant";
  DROP TYPE "public"."enum_homepage_blocks_spotify_embed_embed_type";
  DROP TYPE "public"."enum_homepage_blocks_spotify_embed_height";
  DROP TYPE "public"."enum_homepage_blocks_spotify_embed_theme";`);
}
