CREATE TABLE "player" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"name" text,
	"email" text,
	"phone" text,
	"date_of_birth" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "player_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "team_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"team_id" text NOT NULL,
	"player_id" integer NOT NULL,
	"jersey_number" integer,
	"position" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "team_player_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_player_organization" ON "player" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_player_name" ON "player" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_player_email" ON "player" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_team_player_team" ON "team_player" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_player" ON "team_player" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_unique" ON "team_player" USING btree ("team_id","player_id");