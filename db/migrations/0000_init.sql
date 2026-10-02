CREATE TYPE "public"."experience_event_type" AS ENUM('recommended', 'shortlisted', 'scheduled', 'removed', 'attended', 'skipped', 'rated');--> statement-breakpoint
CREATE TYPE "public"."tag_status" AS ENUM('suggested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('planning', 'locked', 'live', 'done');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"fx_to_base" numeric(14, 6) DEFAULT '1' NOT NULL,
	"paid_by_id" uuid NOT NULL,
	"shares" jsonb NOT NULL,
	"plan_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"experience_id" text NOT NULL,
	"type" "experience_event_type" NOT NULL,
	"value" smallint,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_tags" (
	"experience_id" text NOT NULL,
	"interest" text NOT NULL,
	"strength" smallint NOT NULL,
	"status" "tag_status" DEFAULT 'suggested' NOT NULL,
	"source" text NOT NULL,
	"confidence" real,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "experience_tags_experience_id_interest_pk" PRIMARY KEY("experience_id","interest")
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"neighborhood" text,
	"description" text NOT NULL,
	"insider_tip" text,
	"offbeat" smallint NOT NULL,
	"energy" text NOT NULL,
	"emotional_weight" text NOT NULL,
	"physical_intensity" text NOT NULL,
	"group_fit" text[] NOT NULL,
	"best_time" text[] NOT NULL,
	"duration_minutes" integer NOT NULL,
	"cost_usd" numeric(10, 2) NOT NULL,
	"booking_lead_days" integer DEFAULT 0 NOT NULL,
	"logistics" text[] DEFAULT '{}' NOT NULL,
	"ownership" text,
	"avoid_months" smallint[],
	"dress_code" text,
	"source" text NOT NULL,
	"external_id" text,
	"url" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"flight_number" text NOT NULL,
	"direction" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"live_status" text,
	"estimated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"experience_id" text NOT NULL,
	"day_index" integer,
	"slot" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"attendee_ids" uuid[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"role" text DEFAULT 'traveler' NOT NULL,
	"interests" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"adventurousness" smallint DEFAULT 3 NOT NULL,
	"daily_budget_usd" numeric(10, 2),
	"survey_completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"occasion" text NOT NULL,
	"country" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"status" "trip_status" DEFAULT 'planning' NOT NULL,
	"modules" text[] DEFAULT '{"itinerary","payments"}' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"is_curator" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_id_trip_members_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_plan_item_id_plan_items_id_fk" FOREIGN KEY ("plan_item_id") REFERENCES "public"."plan_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_events" ADD CONSTRAINT "experience_events_member_id_trip_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."trip_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_events" ADD CONSTRAINT "experience_events_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_events" ADD CONSTRAINT "experience_events_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_tags" ADD CONSTRAINT "experience_tags_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_tags" ADD CONSTRAINT "experience_tags_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_member_id_trip_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."trip_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "experience_events_experience_idx" ON "experience_events" USING btree ("experience_id","type");--> statement-breakpoint
CREATE INDEX "experience_tags_status_idx" ON "experience_tags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experiences_country_city_idx" ON "experiences" USING btree ("country","city");--> statement-breakpoint
CREATE INDEX "plan_items_trip_day_idx" ON "plan_items" USING btree ("trip_id","day_index");--> statement-breakpoint
CREATE INDEX "trip_members_trip_idx" ON "trip_members" USING btree ("trip_id");