ALTER TABLE "player" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD CONSTRAINT "player_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_player_organization" ON "player" USING btree ("organization_id");
