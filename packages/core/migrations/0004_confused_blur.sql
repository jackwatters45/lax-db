CREATE TYPE "public"."status" AS ENUM('active', 'completed', 'upcoming');--> statement-breakpoint
CREATE TABLE "game" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text NOT NULL,
	"seasonId" integer NOT NULL,
	"opponent_name" text NOT NULL,
	"opponent_team_id" text,
	"game_date" timestamp (3) NOT NULL,
	"venue" text NOT NULL,
	"is_home_game" boolean NOT NULL,
	"game_type" text DEFAULT 'regular' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer DEFAULT 0,
	"away_score" integer DEFAULT 0,
	"notes" text,
	"location" text,
	"uniform_color" text,
	"arrival_time" timestamp (3),
	"opponent_logo_url" text,
	"external_game_id" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "game_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "season" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp (3) NOT NULL,
	"end_date" timestamp (3),
	"status" "status" DEFAULT 'active' NOT NULL,
	"division" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "season_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_seasonId_season_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season" ADD CONSTRAINT "season_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_organization" ON "game" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_game_team" ON "game" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_game_date" ON "game" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "idx_game_status" ON "game" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_game_team_date" ON "game" USING btree ("team_id","game_date");--> statement-breakpoint
CREATE INDEX "idx_season_organization" ON "season" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_season_team" ON "season" USING btree ("team_id");