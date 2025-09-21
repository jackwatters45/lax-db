CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"rating" text NOT NULL,
	"feedback" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3)
);
