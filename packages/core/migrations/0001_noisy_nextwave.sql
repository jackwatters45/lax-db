CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"topic" text NOT NULL,
	"rating" text NOT NULL,
	"feedback" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"created_at" timestamp (3) NOT NULL,
	"updated_at" timestamp (3),
	"deleted_at" timestamp (3),
	CONSTRAINT "feedback_public_id_unique" UNIQUE("public_id")
);
