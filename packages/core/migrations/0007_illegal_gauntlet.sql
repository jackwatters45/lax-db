CREATE TABLE "team_player" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"player_id" text NOT NULL,
	"jersey_number" integer,
	"position" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "team_player_unique" UNIQUE("team_id","player_id"),
	CONSTRAINT "team_jersey_unique" UNIQUE("team_id","jersey_number")
);
--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "date_of_birth" text;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_player" ADD CONSTRAINT "team_player_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_player_team_id_idx" ON "team_player" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_player_player_id_idx" ON "team_player" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_email" ON "player" USING btree ("email");--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN "number";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN "age";