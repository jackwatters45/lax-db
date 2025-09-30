ALTER TABLE "team_player" DROP CONSTRAINT "team_player_unique";--> statement-breakpoint
ALTER TABLE "team_player" DROP CONSTRAINT "team_jersey_unique";--> statement-breakpoint
DROP INDEX "team_player_team_id_idx";--> statement-breakpoint
DROP INDEX "team_player_player_id_idx";--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_player" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "team_player" ADD COLUMN "deleted_at" timestamp (3);--> statement-breakpoint
CREATE INDEX "idx_team_player_team" ON "team_player" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_player" ON "team_player" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_team_player_unique" ON "team_player" USING btree ("team_id","player_id");