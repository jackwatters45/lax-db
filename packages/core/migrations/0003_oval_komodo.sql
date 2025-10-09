CREATE TABLE "player_contact_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"player_id" integer NOT NULL,
	"email" text,
	"phone" text,
	"facebook" text,
	"instagram" text,
	"whatsapp" text,
	"linkedin" text,
	"groupme" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "player_contact_info_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "player_contact_info_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
ALTER TABLE "player_contact_info" ADD CONSTRAINT "player_contact_info_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_player_contact_info_player" ON "player_contact_info" USING btree ("player_id");