ALTER TABLE "player" DROP CONSTRAINT "player_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;